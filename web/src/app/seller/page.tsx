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
import { Package, ShoppingBag, Loader2, Store, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { CategorySelector } from '@/components/CategorySelector';
import { EditProductDialog } from '@/components/EditProductDialog';
import { Product } from '@/lib/sui-utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2 } from 'lucide-react';

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

    // Debug logging
    console.log('[SellerPage] State:', {
        hasUserShop: !!userShop,
        shopStatus: userShop?.status,
        hasOnChainShop: !!onChainShop,
        isCheckingChain,
        isMissingOnChain
    });

    const [productFormData, setProductFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        price: '',
        stock: '100',
        categoryId: null as string | null,
    });

    const [isCreating, setIsCreating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Edit/Delete State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle sync shop to blockchain
    const handleSyncShop = async () => {
        if (!userShop) return;
        console.log('[SellerPage] Starting shop sync for:', userShop.shop_name);
        setIsSyncing(true);
        try {
            await syncChainShop.mutateAsync({
                name: userShop.shop_name,
                description: userShop.shop_description
            });
            queryClient.invalidateQueries({ queryKey: ['checkChainShop'] });
            toast.success('Shop đã đồng bộ lên blockchain thành công!');
            console.log('[SellerPage] Sync completed successfully');
        } catch (error) {
            console.error('[SellerPage] Sync shop error:', error);
            toast.error('Đồng bộ thất bại. Vui lòng thử lại.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Fetch products
    const { data: myProducts, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['my-retail-products', account?.address],
        queryFn: async () => {
            if (!account?.address) return [];

            const res = await fetch(`/api/seller/products?wallet=${account.address}`);
            if (!res.ok) {
                console.error('Failed to fetch seller products');
                return [];
            }
            return await res.json();
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

        // ✨ MANDATORY: Double-check shop is synced to blockchain
        console.log('[ProductCreate] Verifying shop blockchain sync for:', userShop.owner_wallet);
        const freshOnChainShop = await getUserShop(client, userShop.owner_wallet);

        if (!freshOnChainShop) {
            toast.error('❌ Shop chưa đồng bộ lên blockchain. Vui lòng đồng bộ trước khi tạo sản phẩm.', {
                duration: 6000
            });
            console.error('[ProductCreate] Blocked: No on-chain shop found for wallet:', userShop.owner_wallet);
            return;
        }

        setIsCreating(true);

        try {
            console.log('[ProductCreate] Shop verified on blockchain. Using shop ID:', freshOnChainShop.id);
            const onChainShop = freshOnChainShop;

            console.log('[ProductCreate] Using on-chain shop ID:', onChainShop.id);

            // STEP 2: Create product transaction
            const tx = new Transaction();
            const priceMist = suiToMist(parseFloat(productFormData.price));

            tx.moveCall({
                target: `${PACKAGE_ID}::product::create_shared_product`,
                arguments: [
                    tx.pure.address(onChainShop.id), // ✅ Use actual shop object ID
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
                    console.log('[ProductCreate] Syncing product to database:', productId);
                    const syncResponse = await fetch('/api/products/sync', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            productId,
                            categoryId: productFormData.categoryId
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
            setProductFormData({ name: '', description: '', imageUrl: '', price: '', stock: '100', categoryId: null });
            queryClient.invalidateQueries({ queryKey: ['my-retail-products'] });
            queryClient.invalidateQueries({ queryKey: ['products', 'with-category'] });
        } catch (error) {
            console.error('Create product error:', error);
            toast.error('Failed to create product');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!deletingProductId) return;

        setIsDeleting(true);
        try {
            console.log('[DeleteProduct] Starting delete for:', deletingProductId);

            // 1. On-Chain Delete (Attempt/Guard)
            try {
                /*
                 const tx = new Transaction();
                 tx.moveCall({
                     target: `${PACKAGE_ID}::product::delete_shared_product`,
                     arguments: [tx.object(deletingProductId)]
                 });
                 await signAndExecute({ transaction: tx });
                 */
                console.log('[DeleteProduct] On-chain delete skipped (ABI verification pending)');
            } catch (error) {
                console.warn('[DeleteProduct] On-chain delete failed/skipped:', error);
            }

            // 2. Off-Chain Delete (Supabase)
            const res = await fetch('/api/seller/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deletingProductId })
            });

            if (!res.ok) throw new Error('Failed to delete from database');

            toast.success('Đã xóa sản phẩm thành công');
            setDeletingProductId(null);
            queryClient.invalidateQueries({ queryKey: ['my-retail-products'] });

        } catch (error) {
            console.error('Delete product error:', error);
            toast.error('Có lỗi xảy ra khi xóa sản phẩm');
        } finally {
            setIsDeleting(false);
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

    // Show pending approval UI if shop is pending
    if (userShop && userShop.status === 'PENDING') {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navigation />
                <main className="flex-1 max-w-4xl mx-auto w-full p-6 pt-12 space-y-6">
                    {/* Status Card */}
                    <Card className="border-yellow-500/50 bg-yellow-50/10 dark:bg-yellow-950/10">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                        Đơn đăng ký đang chờ duyệt
                                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50">
                                            PENDING
                                        </Badge>
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Đơn đăng ký shop của bạn đang được quản trị viên xem xét.
                                        Vui lòng kiên nhẫn chờ đợi trong khi chúng tôi xác minh thông tin của bạn.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shop Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="w-5 h-5 text-primary" />
                                Thông tin Shop đã đăng ký
                            </CardTitle>
                            <CardDescription>
                                Thông tin bạn đã gửi để đăng ký
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Basic Information */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                    Thông tin cơ bản
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tên Shop</p>
                                        <p className="font-medium">{userShop.shop_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Loại hình</p>
                                        <p className="font-medium">
                                            {userShop.business_type === 'PERSONAL' ? 'Cá nhân' : 'Doanh nghiệp'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Năm thành lập</p>
                                        <p className="font-medium">{userShop.established_year}</p>
                                    </div>
                                    {userShop.tax_code && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Mã số thuế</p>
                                            <p className="font-medium">{userShop.tax_code}</p>
                                        </div>
                                    )}
                                </div>
                                {userShop.shop_description && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Mô tả</p>
                                        <p className="text-sm">{userShop.shop_description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-3 pt-4 border-t">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                    Thông tin liên hệ
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{userShop.contact_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Số điện thoại</p>
                                        <p className="font-medium">{userShop.contact_phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Thành phố</p>
                                        <p className="font-medium">{userShop.address_city}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Địa chỉ chi tiết</p>
                                        <p className="font-medium">{userShop.address_detail}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Note (if any) */}
                            {userShop.admin_note && (
                                <div className="space-y-2 pt-4 border-t">
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                        Ghi chú từ quản trị viên
                                    </h3>
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <p className="text-sm">{userShop.admin_note}</p>
                                    </div>
                                </div>
                            )}

                            {/* Submission Date */}
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Ngày gửi đơn: {new Date(userShop.created_at).toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Help Card */}
                    <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <h3 className="font-semibold">⏱️ Quy trình phê duyệt</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>• Thời gian xét duyệt trung bình: 1-3 ngày làm việc</li>
                                    <li>• Quản trị viên sẽ xác minh thông tin shop của bạn</li>
                                    <li>• Bạn sẽ nhận được thông báo khi shop được phê duyệt</li>
                                    <li>• Nếu có vấn đề, quản trị viên sẽ để lại ghi chú ở trên</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
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
                    <Badge variant={isMissingOnChain ? "destructive" : "default"} className="text-sm">
                        {isMissingOnChain ? '❌ Chưa thể bán hàng' : '✅ Đang hoạt động'}
                    </Badge>
                </div>

                {/* ✨ MANDATORY SYNC BLOCKER */}
                {isMissingOnChain && (
                    <Card className="border-destructive/50 bg-destructive/10">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-destructive" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-1 text-destructive">
                                        ⚠️ Bắt buộc đồng bộ Blockchain
                                    </h3>
                                    <p className="text-sm mb-2">
                                        Shop của bạn phải được tạo trên SUI Blockchain trước khi có thể bán sản phẩm.
                                    </p>
                                    <p className="text-sm font-semibold mb-4">
                                        🚫 Bạn không thể tạo sản phẩm cho đến khi hoàn thành đồng bộ.
                                    </p>
                                    <Button
                                        onClick={handleSyncShop}
                                        disabled={isSyncing}
                                        size="lg"
                                        className="bg-destructive hover:bg-destructive/90 text-white shadow-lg"
                                    >
                                        {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isSyncing ? 'Đang đồng bộ...' : '🚀 Đồng bộ lên Blockchain ngay'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                                    disabled={isMissingOnChain}
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
                                    disabled={isMissingOnChain}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stock">Số lượng</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    value={productFormData.stock}
                                    onChange={e => setProductFormData({ ...productFormData, stock: e.target.value })}
                                    disabled={isMissingOnChain}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">URL hình ảnh</Label>
                                <Input
                                    id="imageUrl"
                                    value={productFormData.imageUrl}
                                    onChange={e => setProductFormData({ ...productFormData, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                    disabled={isMissingOnChain}
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
                                    disabled={isMissingOnChain}
                                />
                            </div>

                            <div className="space-y-2">
                                <CategorySelector
                                    value={productFormData.categoryId}
                                    onChange={(value) => setProductFormData({ ...productFormData, categoryId: value })}
                                    disabled={isMissingOnChain}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleCreateProduct}
                                disabled={isCreating || !productFormData.name || !productFormData.price || isMissingOnChain}
                            >
                                {isMissingOnChain ? (
                                    '🔒 Đồng bộ blockchain để tạo sản phẩm'
                                ) : isCreating ? (
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
                                    <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow group relative">
                                        <CardContent className="p-4">
                                            {/* Action Buttons */}
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1.5 rounded-md border border-border shadow-sm">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                    onClick={() => setEditingProduct(product)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => setDeletingProductId(product.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

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
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="text-primary font-bold text-lg">
                                                            {mistToSui(product.price).toFixed(2)} SUI
                                                        </div>
                                                        {product.category && (
                                                            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                                                {product.category.icon} {product.category.name}
                                                            </Badge>
                                                        )}
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

            <EditProductDialog
                open={!!editingProduct}
                onOpenChange={(open) => !open && setEditingProduct(null)}
                product={editingProduct}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['my-retail-products'] });
                    queryClient.invalidateQueries({ queryKey: ['products', 'with-category'] });
                }}
            />

            <AlertDialog open={!!deletingProductId} onOpenChange={(open) => !open && setDeletingProductId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Sản phẩm sẽ bị xóa khỏi cửa hàng của bạn.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProduct}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                'Xóa Sản Phẩm'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Footer />
        </div>
    );
}
