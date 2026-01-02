'use client';

import { useState, useMemo } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'; // Modified
import { useQuery } from '@tanstack/react-query'; // Added
import { WalletConnection } from '@/components/WalletConnection';
import CreateShopForm from '@/components/shops/CreateShopForm';
import { useShop } from '@/hooks/useShop';
import { useProducts } from '@/hooks/useProducts';
import { useKiosk } from '@/hooks/useKiosk';
import { mistToSui, Product, PACKAGE_ID, getUserShop } from '@/lib/sui-utils'; // Modified
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Package, ShoppingBag, Eye, EyeOff, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SellerPage() {
    const account = useCurrentAccount();
    const client = useSuiClient();
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

    const { userProducts, createProduct, isCreatingProduct } = useProducts();
    const {
        hasKiosk,
        isLoadingKiosks,
        createKiosk,
        isCreatingKiosk,
        placeAndList,
        isListingProduct,
        takeFromKiosk,
        isTaking: isTakingProduct,
        userKiosk
    } = useKiosk(account?.address);

    const [productFormData, setProductFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        price: '',
    });

    // Merge Wallet Products (Unlisted) and Kiosk Items (Listed)
    const allProducts = useMemo(() => {
        const walletItems = userProducts?.map(p => ({ ...p, status: 'WALLET' })) || [];

        const kioskItems = userKiosk?.items.map((item: any) => {
            // Parse fields from Kiosk item content
            // Kiosk items are wrapped, fields are in data.content.fields
            const fields = item.data?.content?.fields;
            if (!fields) return null;

            return {
                id: item.data.objectId,
                shopId: fields.shop_id,
                name: fields.name,
                description: fields.description,
                imageUrl: fields.image_url,
                price: Number(fields.price),
                creator: fields.creator,
                listed: true, // Kiosk items are considered listed (for MVP simplicity)
                createdAt: Number(fields.created_at),
                status: 'KIOSK'
            } as Product & { status: string };
        }).filter((i): i is Product & { status: string } => i !== null) || [];

        return [...walletItems, ...kioskItems];
    }, [userProducts, userKiosk]);

    const handleCreateProduct = async () => {
        if (!userShop) return;

        // Auto-create Kiosk if missing? 
        // For now, if no kiosk, we warn or fall back to wallet (but we prefer Kiosk)
        if (!hasKiosk) {
            toast.warning('Please create a Kiosk first to list items automatically.');
            return;
        }

        try {
            await createProduct({
                shopId: userShop.owner_wallet, // Use owner wallet as ID
                name: productFormData.name,
                description: productFormData.description,
                imageUrl: productFormData.imageUrl,
                price: parseFloat(productFormData.price),
                // Pass Kiosk info for auto-listing
                kioskId: userKiosk?.id,
                kioskCapId: userKiosk?.cap.objectId
            });

            setProductFormData({ name: '', description: '', imageUrl: '', price: '' });
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleCreateKiosk = async () => {
        try {
            await createKiosk();
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleToggleListing = async (product: Product & { status?: string }) => {
        if (!hasKiosk) {
            toast.warning('No Kiosk found.');
            return;
        }

        const isListed = product.status === 'KIOSK' || product.listed;

        try {
            if (isListed) {
                // UNLIST: Take from Kiosk back to Wallet
                await takeFromKiosk(product.id);
            } else {
                // LIST: Place from Wallet to Kiosk
                // Note: We currently don't have a UI to update price on list, using original price
                await placeAndList({
                    productId: product.id,
                    price: product.price // Logic assumed price in MIST already if reading from object? 
                    // Wait, sui-utils define Product price as u64 (MIST).
                    // placeAndList expects MIST.
                });
            }
        } catch (error) {
            console.error('Toggle listing error', error);
        }
    };

    const isProcessing = isListingProduct || isTakingProduct;

    if (!account) {
        return (
            <div className="min-h-screen flex flex-col bg-black text-white font-sans">
                <Navigation />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full p-8 bg-neutral-900/50 border border-white/10 cut-corner text-center backdrop-blur-md">
                        <ShoppingBag className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Wallet Required</h3>
                        <p className="text-neutral-400 mb-6 font-light">Please connect your Sui wallet to access the seller dashboard.</p>
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
        return (
            <div className="min-h-screen flex flex-col bg-black text-white font-sans">
                <Navigation />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
                <Footer />
            </div>
        );
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
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">Seller Dashboard</h1>
                        <p className="text-neutral-400 font-mono text-sm">Manage your shop and products</p>
                    </div>
                    <div>
                        <Badge variant="outline" className={`rounded-none px-3 py-1 uppercase tracking-widest font-mono ${isMissingOnChain ? 'text-red-400 bg-red-900/20 border-red-500/20' : 'text-green-400 bg-green-900/20 border-green-500/20'}`}>
                            {isMissingOnChain ? 'Not On Chain' : 'Active Shop'}
                        </Badge>
                    </div>
                </div>

                {/* On-Chain Sync Warning */}
                {isMissingOnChain && (
                    <div className="bg-red-900/10 border border-red-500/20 p-6 cut-corner backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-none shrink-0">
                                    <AlertCircle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-red-100 uppercase tracking-wide">Action Required: Sync Shop On-Chain</h3>
                                    <p className="text-red-200/70 text-sm mt-1 max-w-xl">
                                        Your shop exists in the database but hasn't been created on the Sui Blockchain yet.
                                        You must sync it to enable product listing and sales.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => syncChainShop.mutate({ name: userShop.shop_name, description: userShop.shop_description })}
                                disabled={syncChainShop.isPending}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider px-8 h-12 cut-corner-bottom-right rounded-none w-full md:w-auto"
                            >
                                {syncChainShop.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {syncChainShop.isPending ? 'Syncing...' : 'Sync to Blockchain'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Shop & Kiosk Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shop Info */}
                    <Card className="bg-white/[0.02] border border-white/5 cut-corner rounded-none hover:bg-white/[0.04] transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold uppercase tracking-tight">{userShop.shop_name}</CardTitle>
                                <CardDescription className="text-neutral-400">{userShop.shop_description}</CardDescription>
                            </div>
                            <Package className="text-blue-500 w-5 h-5 opacity-80" />
                        </CardHeader>
                    </Card>

                    {/* Kiosk Status */}
                    <Card className="bg-white/[0.02] border border-white/5 cut-corner rounded-none hover:bg-white/[0.04] transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className=" text-xl font-bold uppercase tracking-wide flex items-center gap-2">
                                    <ShoppingBag className="text-blue-500 w-5 h-5" />
                                    Kiosk Status
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between pt-4">
                            <p className="text-sm text-neutral-400">
                                {hasKiosk ? 'Your Kiosk is ready for listing products' : 'Create a Kiosk to list and sell products'}
                            </p>
                            {hasKiosk ? (
                                <Badge variant="secondary" className="text-green-400 bg-green-900/20 border border-green-500/20 rounded-none font-mono tracking-widest uppercase">ACTIVE</Badge>
                            ) : (
                                <Button
                                    onClick={handleCreateKiosk}
                                    disabled={isCreatingKiosk || isLoadingKiosks}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs uppercase font-bold px-4 py-2 cut-corner-bottom-right transition-colors rounded-none"
                                >
                                    {isCreatingKiosk ? 'Creating...' : 'Create Kiosk'}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Product Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-neutral-900/50 border border-white/10 p-6 cut-corner backdrop-blur-sm sticky top-24">
                            <h3 className="text-lg font-bold mb-1 uppercase tracking-wide">Create Product</h3>
                            <p className="text-xs text-neutral-400 mb-6 font-mono">Mint a product NFT linked to your shop</p>

                            {userShop.status !== 'ACTIVE' ? (
                                <div className="p-4 border border-red-500/20 bg-red-900/10 text-center">
                                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                                    <h5 className="text-red-400 font-bold mb-1">
                                        Shop {userShop.status === 'PENDING' ? 'Pending Approval' : 'Suspended'}
                                    </h5>
                                    <p className="text-xs text-red-300/80">
                                        {userShop.status === 'PENDING'
                                            ? 'Waiting for admin approval.'
                                            : 'Your shop has been suspended.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-neutral-500 font-mono tracking-wider">Product Name</Label>
                                        <Input
                                            type="text"
                                            className="bg-black/40 border-white/10 text-white focus:border-blue-500 rounded-none h-10"
                                            placeholder="e.g., Digital Artwork #1"
                                            value={productFormData.name}
                                            onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-neutral-500 font-mono tracking-wider">Price (SUI)</Label>
                                        <Input
                                            type="number"
                                            className="bg-black/40 border-white/10 text-white focus:border-blue-500 rounded-none h-10"
                                            placeholder="0.000"
                                            value={productFormData.price}
                                            onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-neutral-500 font-mono tracking-wider">Description</Label>
                                        <Textarea
                                            className="bg-black/40 border-white/10 text-white focus:border-blue-500 rounded-none resize-none min-h-[100px]"
                                            placeholder="Describe your product..."
                                            value={productFormData.description}
                                            onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-neutral-500 font-mono tracking-wider">Image URL</Label>
                                        <Input
                                            type="text"
                                            className="bg-black/40 border-white/10 text-white focus:border-blue-500 rounded-none h-10"
                                            placeholder="https://..."
                                            value={productFormData.imageUrl}
                                            onChange={(e) => setProductFormData({ ...productFormData, imageUrl: e.target.value })}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleCreateProduct}
                                        disabled={isCreatingProduct}
                                        className="w-full bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-wider text-xs h-10 cut-corner-bottom-right rounded-none"
                                    >
                                        {isCreatingProduct ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Minting...
                                            </span>
                                        ) : 'Create Product NFT'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold uppercase tracking-wide">My Products ({allProducts.length})</h3>
                        </div>

                        {allProducts.length === 0 ? (
                            <div className="border border-white/5 bg-white/[0.02] p-12 text-center cut-corner">
                                <Package className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                                <p className="text-neutral-500 font-mono">No products yet. Create your first product!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allProducts.map((product) => {
                                    const isListed = product.status === 'KIOSK' || product.listed;
                                    return (
                                        <div key={product.id} className="bg-white/[0.02] border border-white/5 p-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors group cut-corner">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                {product.imageUrl ? (
                                                    <div className="w-12 h-12 bg-neutral-900 border border-white/10 overflow-hidden shrink-0">
                                                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                                                        <Package className="w-6 h-6 text-neutral-700" />
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-white truncate font-mono uppercase tracking-tight">{product.name}</h4>
                                                    <div className="flex items-center gap-3 text-xs mt-1">
                                                        <span className="text-neutral-400 font-mono">{mistToSui(product.price)} SUI</span>
                                                        <Badge variant="outline" className={`px-1.5 py-0 rounded-none text-[10px] uppercase font-mono ${isListed ? 'text-green-400 border-green-500/30 bg-green-900/10' : 'text-neutral-500 border-white/10'}`}>
                                                            {isListed ? 'Listed' : 'Unlisted'}
                                                        </Badge>
                                                        {product.status && <span className="text-[9px] text-neutral-600 uppercase">LOCATION: {product.status}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleListing(product)}
                                                disabled={isProcessing}
                                                className="ml-4 text-neutral-500 hover:text-white hover:bg-white/10 rounded-none border border-transparent hover:border-white/10"
                                                title={isListed ? 'Unlist (Take from Kiosk)' : 'List (Place in Kiosk)'}
                                            >
                                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : (isListed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />)}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
