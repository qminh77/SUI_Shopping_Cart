
'use client';

import { useState, useMemo } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import CreateShopForm from '@/components/shops/CreateShopForm';
import { useShop } from '@/hooks/useShop';
import { getUserShop } from '@/lib/sui-utils';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Store, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// New Components
import { DashboardStats } from '@/components/seller/DashboardStats';
import { AnalyticsChart } from '@/components/seller/AnalyticsChart';
import { ProductList } from '@/components/seller/ProductList';
import { AddProductForm } from '@/components/seller/AddProductForm';
import { LowStockAlert } from '@/components/seller/LowStockAlert';

export default function SellerPage() {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const queryClient = useQueryClient();
    const { t } = useLanguage();

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

    const [isSyncing, setIsSyncing] = useState(false);

    // Edit/Delete State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle sync shop to blockchain
    const handleSyncShop = async () => {
        if (!userShop) return;
        setIsSyncing(true);
        try {
            await syncChainShop.mutateAsync({
                name: userShop.shop_name,
                description: userShop.shop_description
            });
            queryClient.invalidateQueries({ queryKey: ['checkChainShop'] });
            toast.success(t('seller.dashboard.syncSuccess'));
        } catch (error) {
            console.error('[SellerPage] Sync shop error:', error);
            toast.error(t('seller.dashboard.syncError'));
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
            if (!res.ok) return [];
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

    const handleDeleteProduct = async () => {
        if (!deletingProductId) return;

        setIsDeleting(true);
        try {
            // Delete API
            const res = await fetch('/api/seller/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deletingProductId })
            });

            if (!res.ok) throw new Error('Failed to delete from database');

            toast.success(t('seller.products.deleteSuccess'));
            setDeletingProductId(null);
            queryClient.invalidateQueries({ queryKey: ['my-retail-products'] });
            queryClient.invalidateQueries({ queryKey: ['products', 'with-category'] });

        } catch (error) {
            console.error('Delete product error:', error);
            toast.error(t('seller.products.deleteError'));
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
                            <h3 className="text-2xl font-bold mb-2">{t('seller.dashboard.title')}</h3>
                            <p className="text-muted-foreground text-center mb-6">
                                {t('profile.addresses.connectWalletDesc')}
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
            <div className="min-h-screen flex flex-col bg-background unselectable select-none">
                <Navigation />
                <main className="flex-1 max-w-4xl mx-auto w-full p-6 pt-12 space-y-6">
                    <Card className="border-yellow-500/50 bg-yellow-50/10 dark:bg-yellow-950/10">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                                <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold mb-2 text-yellow-600 dark:text-yellow-400">
                                        {t('seller.pending.title')}
                                    </h2>
                                    <p className="text-muted-foreground">{t('seller.pending.desc')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Shop Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Shop Name</span>
                                    <span className="font-medium">{userShop.shop_name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">City</span>
                                    <span className="font-medium">{userShop.address_city}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-medium">{userShop.business_type}</span>
                                </div>
                                <div className="pt-2">
                                    <span className="text-muted-foreground block mb-1">Description</span>
                                    <p className="text-muted-foreground bg-muted p-2 rounded">{userShop.shop_description}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-primary">What happens next?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-start gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                                        <span>Admins will review your supporting documents.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                                        <span>Verification usually takes 24-48 hours.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                                        <span>Once approved, you can start listing products!</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
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
                            {userShop.shop_name}
                        </h1>
                        <p className="text-muted-foreground">Seller Dashboard & Analytics</p>
                    </div>
                    <Badge variant={isMissingOnChain ? "destructive" : "default"} className="text-sm px-3 py-1">
                        {isMissingOnChain ? `Sync Required` : `Active Shop`}
                    </Badge>
                </div>

                {/* Mandatory Sync Blocker */}
                {isMissingOnChain && (
                    <Card className="border-destructive/50 bg-destructive/10 animate-in fade-in slide-in-from-top-4 duration-500">
                        <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="h-14 w-14 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <AlertCircle className="h-7 w-7 text-destructive" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-bold text-lg text-destructive mb-1">Action Required: Sync to Blockchain</h3>
                                <p className="text-muted-foreground mb-4">Your shop is active in our database but not yet synced to the SUI Blockchain. You must sync to start listing products.</p>
                                <Button
                                    onClick={handleSyncShop}
                                    disabled={isSyncing}
                                    variant="destructive"
                                    className="shadow-lg hover:shadow-xl transition-all"
                                >
                                    {isSyncing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Syncing...
                                        </>
                                    ) : (
                                        "Sync Shop Now"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="products">Products</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6 animate-in fade-in-50">
                        {/* Stats Cards */}
                        <DashboardStats orders={salesHistory} products={myProducts} />

                        {/* Inventory Warnings */}
                        <LowStockAlert products={myProducts} />

                        {/* Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                            <div className="md:col-span-4 lg:col-span-5">
                                <AnalyticsChart orders={salesHistory} />
                            </div>
                            <div className="md:col-span-3 lg:col-span-2 space-y-6">
                                {/* Recent Activity or Quick Actions could go here */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Button className="w-full justify-start" variant="outline" onClick={() => document.getElementById('tab-products')?.click()}>
                                            + Add New Product
                                        </Button>
                                        <Button className="w-full justify-start" variant="outline">
                                            View Shop Page
                                        </Button>
                                        <Button className="w-full justify-start" variant="outline">
                                            Edit Shop Settings
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* PRODUCTS TAB */}
                    <TabsContent value="products" className="space-y-6 animate-in fade-in-50">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Add Product Form */}
                            <div className="lg:col-span-1">
                                <AddProductForm userShop={userShop} isMissingOnChain={!!isMissingOnChain} />
                            </div>

                            {/* Product List */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-semibold tracking-tight">Your Products</h3>
                                    <Badge variant="outline" className="ml-2">{myProducts?.length || 0} items</Badge>
                                </div>
                                <ProductList
                                    products={myProducts}
                                    isLoading={isLoadingProducts}
                                    onEdit={setEditingProduct}
                                    onDelete={setDeletingProductId}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* ORDERS TAB */}
                    <TabsContent value="orders" className="space-y-6 animate-in fade-in-50">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Orders</CardTitle>
                                <CardDescription>Manage and track your incoming orders here.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>Order management interface coming soon...</p>
                                    <p className="text-sm mt-2">Use the "Overview" tab to see total sales.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Dialogs */}
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
                        <AlertDialogTitle>{t('seller.products.deleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('seller.products.deleteDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProduct}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('common.delete')}...
                                </>
                            ) : (
                                t('seller.products.delete')
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Footer />
        </div>
    );
}
