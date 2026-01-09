'use client';

import { useState, useMemo } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WalletConnection } from '@/components/WalletConnection';
import CreateShopForm from '@/components/shops/CreateShopForm';
import { useShop } from '@/hooks/useShop';
import { useRetail } from '@/hooks/useRetail'; // We might need a creation hook in useRetail or useProducts? 
// Actually useProducts should be updated to create Shared Object, or we add logic here.
// Let's check useProducts. It currently calls mint. We should update useProducts or call move directly.
// To keep it clean, I'll use the Transaction block directly here or a new hook method.
// Let's use useProducts but modified, OR just implement createSharedProduct here for now.

import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

import { mistToSui, Product, PACKAGE_ID, getUserShop, suiToMist } from '@/lib/sui-utils';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Package, ShoppingBag, AlertCircle, Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SellerPage() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    const { shop: userShop, isLoading: isLoadingShop, syncChainShop } = useShop();

    // Check if shop exists on-chain
    const { data: onChainShop, isLoading: isCheckingChain } = useQuery({
        queryKey: ['checkChainShop', userShop?.owner_wallet],
        queryFn: async () => {
            if (!userShop?.owner_wallet) return null;
            return await getUserShop(client, userShop.owner_wallet);
        },
        enabled: !!userShop?.owner_wallet,
    });

    const isMissingOnChain = userShop?.status === 'ACTIVE' && !onChainShop && !isCheckingChain;

    const [productFormData, setProductFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        price: '',
        stock: '100', // Default stock
    });

    const [isCreating, setIsCreating] = useState(false);

    // Fetch Shared Products (Retail Inventory)
    // We need a way to fetch YOUR shared products. 
    // Currently `useProducts` fetches owned objects (Wallet/Kiosk).
    // Shared objects are harder to "list by owner" without an Indexer.
    // However, `product::Product` has a `creator` field.
    // We can query events `ProductCreated` filtered by creator? Or check if we have an Indexer yet?
    // The previous plan mentioned Indexer is needed.
    // FOR NOW: We will use `client.getOwnedObjects` won't work for Shared.
    // RELIABLE WAY (MVP): Query `ProductCreated` events for this seller address.

    const { data: myProducts, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['my-retail-products', account?.address],
        queryFn: async () => {
            if (!account?.address) return [];

            // Query events to find products created by me
            // This is "Event Sourcing" - simple indexer pattern
            const events = await client.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::product::ProductCreated`,
                    Sender: account.address
                }
            });

            // The event contains the Object ID. We then fetch the object details.
            const objectIds = events.data.map(e => (e.parsedJson as any).product_id);

            if (objectIds.length === 0) return [];

            const objects = await client.multiGetObjects({
                ids: objectIds,
                options: { showContent: true }
            });

            return objects.map(obj => {
                const fields = (obj.data?.content as any)?.fields;
                if (!fields) return null;
                return {
                    id: obj.data!.objectId,
                    name: fields.name,
                    description: fields.description,
                    imageUrl: fields.image_url,
                    price: Number(fields.price),
                    stock: Number(fields.stock),
                    shopId: fields.shop_id,
                    creator: fields.creator, // or from event
                    status: 'RETAIL'
                };
            }).filter(Boolean);
        },
        enabled: !!account?.address
    });

    // Query for Sales History (from DB or Chain events)
    // Reusing the API we made earlier would be best, but let's stick to chain events for now or API?
    // Creating API was for Order History.
    // Let's use the API `GET /api/orders?role=seller`
    const { data: salesHistory } = useQuery({
        queryKey: ['seller-orders', account?.address],
        queryFn: async () => {
            const res = await fetch(`/api/orders?role=seller&wallet=${account!.address}`);
            if (!res.ok) return [];
            return await res.json();
        },
        enabled: !!account?.address
    });

    // Calculate total earnings
    const totalEarnings = useMemo(() => {
        return salesHistory?.reduce((acc: number, order: any) => acc + Number(order.total_price), 0) || 0;
    }, [salesHistory]);

    const handleCreateProduct = async () => {
        if (!userShop || !account) return;
        setIsCreating(true);

        try {
            const tx = new Transaction();
            const priceMist = suiToMist(parseFloat(productFormData.price));

            // Call create_shared_product
            // public fun create_shared_product(shop_id: address, name: String, description: String, image_url: String, price: u64, stock: u64, ctx: &mut TxContext)
            tx.moveCall({
                target: `${PACKAGE_ID}::product::create_shared_product`,
                arguments: [
                    tx.pure.address(userShop.owner_wallet), // shop_id (using owner wallet as shop id mapping for now)
                    tx.pure.string(productFormData.name),
                    tx.pure.string(productFormData.description),
                    tx.pure.string(productFormData.imageUrl),
                    tx.pure.u64(priceMist),
                    tx.pure.u64(parseInt(productFormData.stock))
                ]
            });

            const result = await signAndExecute({ transaction: tx });

            await client.waitForTransaction({ digest: result.digest });

            toast.success('Product created successfully!');
            setProductFormData({ name: '', description: '', imageUrl: '', price: '', stock: '100' });

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['my-retail-products'] });

        } catch (error) {
            console.error('Create product error:', error);
            toast.error('Failed to create product');
        } finally {
            setIsCreating(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen flex flex-col bg-black text-white font-sans">
                <Navigation />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full p-8 bg-neutral-900/50 border border-white/10 cut-corner text-center backdrop-blur-md">
                        <Store className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Seller Portal</h3>
                        <p className="text-neutral-400 mb-6 font-light">Please connect your wallet to manage your shop.</p>
                        <div className="flex justify-center">
                            <WalletConnection />
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (isLoadingShop) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;
    }

    if (!userShop) {
        return (
            <div className="min-h-screen flex flex-col bg-black text-white font-sans">
                <Navigation />
                <div className="flex-1 max-w-2xl mx-auto w-full p-6 pt-12">
                    <CreateShopForm />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-transparent text-white font-sans selection:bg-blue-500/30">
            <Navigation />

            <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 space-y-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">Seller Dashboard</h1>
                        <p className="text-neutral-400 font-mono text-sm">Manage inventory and orders</p>
                    </div>
                    <div>
                        <Badge variant="outline" className={`rounded-none px-3 py-1 uppercase tracking-widest font-mono ${isMissingOnChain ? 'text-red-400 bg-red-900/20 border-red-500/20' : 'text-green-400 bg-green-900/20 border-green-500/20'}`}>
                            {isMissingOnChain ? 'Not On Chain' : 'Active Shop'}
                        </Badge>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white/[0.02] border border-white/5 cut-corner rounded-none">
                        <CardHeader>
                            <CardTitle className="uppercase tracking-wide flex items-center gap-2">
                                <Store className="w-5 h-5 text-blue-500" /> {userShop.shop_name}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-white/[0.02] border border-white/5 cut-corner rounded-none">
                        <CardHeader>
                            <CardTitle className="uppercase tracking-wide flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-green-500" /> Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono">{mistToSui(totalEarnings)} SUI</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Product Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-neutral-900/50 border border-white/10 p-6 cut-corner backdrop-blur-sm sticky top-24">
                            <h3 className="text-lg font-bold mb-1 uppercase tracking-wide">Add Product</h3>
                            <p className="text-xs text-neutral-400 mb-6 font-mono">Add new item to your supermarket shelf</p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase">Product Name</Label>
                                    <Input
                                        className="bg-black/40 border-white/10 rounded-none"
                                        value={productFormData.name}
                                        onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase">Price (SUI)</Label>
                                    <Input
                                        type="number"
                                        className="bg-black/40 border-white/10 rounded-none"
                                        value={productFormData.price}
                                        onChange={e => setProductFormData({ ...productFormData, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase">Stock Quantity</Label>
                                    <Input
                                        type="number"
                                        className="bg-black/40 border-white/10 rounded-none"
                                        value={productFormData.stock}
                                        onChange={e => setProductFormData({ ...productFormData, stock: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase">Image URL</Label>
                                    <Input
                                        className="bg-black/40 border-white/10 rounded-none"
                                        value={productFormData.imageUrl}
                                        onChange={e => setProductFormData({ ...productFormData, imageUrl: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase">Description</Label>
                                    <Textarea
                                        className="bg-black/40 border-white/10 rounded-none resize-none"
                                        value={productFormData.description}
                                        onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
                                    />
                                </div>

                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-500 rounded-none font-bold uppercase"
                                    onClick={handleCreateProduct}
                                    disabled={isCreating}
                                >
                                    {isCreating ? <Loader2 className="animate-spin w-4 h-4" /> : 'Create Product'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Inventory List */}
                    <div className="lg:col-span-2">
                        <h3 className="text-lg font-bold mb-6 uppercase tracking-wide">Inventory</h3>

                        {isLoadingProducts ? (
                            <div className="text-center py-10"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>
                        ) : myProducts?.length === 0 ? (
                            <div className="text-center py-10 border border-white/10 bg-white/5">
                                <Package className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
                                <p className="text-neutral-500">No products in inventory.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myProducts?.map((product: any) => (
                                    <div key={product.id} className="bg-white/5 border border-white/10 p-4 flex gap-4 hover:bg-white/10 transition-colors">
                                        <div className="w-20 h-20 bg-black shrink-0 overflow-hidden">
                                            {product.imageUrl && <img src={product.imageUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-lg">{product.name}</h4>
                                                <Badge variant="outline" className="rounded-none border-blue-500/50 text-blue-400">
                                                    Stock: {product.stock}
                                                </Badge>
                                            </div>
                                            <div className="text-green-400 font-mono font-bold mt-1">
                                                {mistToSui(product.price)} SUI
                                            </div>
                                            <p className="text-neutral-400 text-sm mt-2 line-clamp-2">{product.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
