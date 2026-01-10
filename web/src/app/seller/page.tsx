'use client';

import { useState, useMemo } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import CreateShopForm from '@/components/shops/CreateShopForm';
import { useShop } from '@/hooks/useShop';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { mistToSui, PACKAGE_ID, getUserShop, suiToMist } from '@/lib/sui-utils';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Package, ShoppingBag, Loader2, Store, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function SellerPage() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    const { shop: userShop, isLoading: isLoadingShop } = useShop();

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
        stock: '100',
    });

    const [isCreating, setIsCreating] = useState(false);

    // Fetch products
    const { data: myProducts, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['my-retail-products', account?.address],
        queryFn: async () => {
            if (!account?.address) return [];

            const events = await client.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::product::ProductCreated`,
                    Sender: account.address
                }
            });

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
                    creator: fields.creator,
                    status: 'RETAIL'
                };
            }).filter(Boolean);
        },
        enabled: !!account?.address
    });

    // Fetch sales
    const { data: salesHistory } = useQuery({
        queryKey: ['seller-orders', account?.address],
        queryFn: async () => {
            const res = await fetch(`/api/orders?role=seller&wallet=${account!.address}`);
            if (!res.ok) return [];
            return await res.json();
        },
        enabled: !!account?.address
    });

    const totalEarnings = useMemo(() => {
        return salesHistory?.reduce((acc: number, order: any) => acc + Number(order.total_price), 0) || 0;
    }, [salesHistory]);

    const handleCreateProduct = async () => {
        if (!userShop || !account) return;
        setIsCreating(true);

        try {
            const tx = new Transaction();
            const priceMist = suiToMist(parseFloat(productFormData.price));

            tx.moveCall({
                target: `${PACKAGE_ID}::product::create_shared_product`,
                arguments: [
                    tx.pure.address(userShop.owner_wallet),
                    tx.pure.string(productFormData.name),
                    tx.pure.string(productFormData.description),
                    tx.pure.string(productFormData.imageUrl),
                    tx.pure.u64(priceMist),
                    tx.pure.u64(parseInt(productFormData.stock))
                ]
            });

            const result = await signAndExecute({ transaction: tx });

            // Wait for transaction to complete and get full details
            const fullResponse = await client.waitForTransaction({
                digest: result.digest,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showEvents: true
                }
            });

            // Extract product ID from transaction result
            let productId: string | null = null;

            // Try to get product ID from objectChanges
            if ((fullResponse as any).objectChanges) {
                const created = (fullResponse as any).objectChanges.find(
                    (obj: any) => obj.type === 'created' && obj.objectType?.includes('::product::Product')
                );
                if (created) {
                    productId = created.objectId;
                }
            }

            // If not found in objectChanges, try events
            if (!productId && (fullResponse as any).events) {
                const productCreatedEvent = (fullResponse as any).events.find(
                    (event: any) => event.type.includes('::ProductCreated')
                );
                if (productCreatedEvent?.parsedJson?.product_id) {
                    productId = productCreatedEvent.parsedJson.product_id;
                }
            }

            // Sync to Supabase
            if (productId) {
                try {
                    const syncResponse = await fetch('/api/products/sync', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            productId,
                            categoryId: null // Can add category selection later
                        }),
                    });

                    if (!syncResponse.ok) {
                        console.error('Failed to sync product to Supabase');
                        toast.warning('Product created on blockchain but not synced to database');
                    } else {
                        console.log('Product synced to database successfully');
                    }
                } catch (syncError) {
                    console.error('Error syncing to Supabase:', syncError);
                }
            }

            toast.success('Product created successfully!');
            setProductFormData({ name: '', description: '', imageUrl: '', price: '', stock: '100' });
            queryClient.invalidateQueries({ queryKey: ['my-retail-products'] });
            queryClient.invalidateQueries({ queryKey: ['products', 'with-category'] });
        } catch (error) {
            console.error('Create product error:', error);
            toast.error('Failed to create product');
        } finally {
            setIsCreating(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navigation />
                <main className="flex-1 flex items-center justify-center p-6">
                    <Card className="max-w-md w-full">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Store className="w-16 h-16 text-primary mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Seller Portal</h3>
                            <p className="text-muted-foreground text-center mb-6">
                                Kết nối ví để quản lý shop của bạn
                            </p>
                            <WalletConnectButton />
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    if (isLoadingShop) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }

    if (!userShop) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navigation />
                <main className="flex-1 max-w-2xl mx-auto w-full p-6 pt-12">
                    <CreateShopForm />
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navigation />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                            <Store className="w-8 h-8 text-primary" />
                            Seller Dashboard
                        </h1>
                        <p className="text-muted-foreground">Quản lý sản phẩm và đơn hàng</p>
                    </div>
                    <Badge variant={isMissingOnChain ? "destructive" : "default"}>
                        {isMissingOnChain ? 'Chưa đồng bộ blockchain' : 'Shop đang hoạt động'}
                    </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Tên Shop
                            </CardTitle>
                            <Store className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userShop.shop_name}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Sản phẩm
                            </CardTitle>
                            <Package className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{myProducts?.length || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Tổng sản phẩm</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Doanh thu
                            </CardTitle>
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">
                                {mistToSui(totalEarnings).toFixed(2)} SUI
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Tổng doanh thu</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Product Form */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Thêm Sản Phẩm</CardTitle>
                            <CardDescription>Thêm sản phẩm mới vào kho</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên sản phẩm</Label>
                                <Input
                                    id="name"
                                    value={productFormData.name}
                                    onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
                                    placeholder="VD: iPhone 15 Pro"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Giá (SUI)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={productFormData.price}
                                    onChange={e => setProductFormData({ ...productFormData, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stock">Số lượng</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    value={productFormData.stock}
                                    onChange={e => setProductFormData({ ...productFormData, stock: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">URL hình ảnh</Label>
                                <Input
                                    id="imageUrl"
                                    value={productFormData.imageUrl}
                                    onChange={e => setProductFormData({ ...productFormData, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả</Label>
                                <Textarea
                                    id="description"
                                    value={productFormData.description}
                                    onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
                                    placeholder="Mô tả sản phẩm..."
                                    rows={3}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleCreateProduct}
                                disabled={isCreating || !productFormData.name || !productFormData.price}
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    'Tạo Sản Phẩm'
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Inventory List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-xl font-semibold">Kho Hàng</h3>

                        {isLoadingProducts ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : myProducts?.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {myProducts?.map((product: any) => (
                                    <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex gap-4">
                                                <div className="w-20 h-20 shrink-0 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                                                    {product.imageUrl ? (
                                                        <Image
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            width={80}
                                                            height={80}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <Package className="w-8 h-8 text-muted-foreground/50" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-lg truncate">{product.name}</h4>
                                                        <Badge variant="outline">
                                                            Kho: {product.stock}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-primary font-bold text-lg mb-2">
                                                        {mistToSui(product.price).toFixed(2)} SUI
                                                    </div>
                                                    <p className="text-muted-foreground text-sm line-clamp-2">
                                                        {product.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
