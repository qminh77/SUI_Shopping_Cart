'use client';

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useReceipts } from '@/hooks/useReceipts';
import { useKiosk } from '@/hooks/useKiosk';
import { useQuery } from '@tanstack/react-query';
import { getOwnedProducts, Product, parseProduct } from '@/lib/sui-utils';
import { ReceiptCard } from '@/components/ReceiptCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Store, Receipt as ReceiptIcon, Wallet, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { mistToSui, formatAddress } from '@/lib/sui-utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
    const account = useCurrentAccount();
    const client = useSuiClient();

    // Fetch Receipts
    const { receipts, isLoading: isLoadingReceipts, refetch: refetchReceipts } = useReceipts(account?.address);

    // Fetch Kiosk/Listed Items
    const { userKiosk, isLoadingKiosks } = useKiosk(account?.address);

    // Fetch Inventory (Wallet Items)
    const { data: inventory, isLoading: isLoadingInventory } = useQuery({
        queryKey: ['inventory', account?.address],
        queryFn: async () => {
            if (!account?.address) return [];
            const products = await getOwnedProducts(client, account.address);
            // Filter out items that are not products (double check)
            return products;
        },
        enabled: !!account?.address,
    });

    // Helper to render product card
    const ProductCard = ({ product, status }: { product: Product, status?: string }) => (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative aspect-square bg-muted">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-950">
                        <Package className="w-16 h-16 text-neutral-800" />
                    </div>
                )}
                {status && (
                    <div className="absolute top-2 right-2">
                        <Badge variant={status === 'Listed' ? 'default' : 'secondary'}>
                            {status}
                        </Badge>
                    </div>
                )}
            </div>
            <CardContent className="p-4">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium">
                        {product.price > 0 ? `${mistToSui(product.price)} SUI` : 'Listed'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {status === 'Listed' ? 'In Kiosk' : 'In Wallet'}
                    </span>
                </div>
            </CardContent>
        </Card>
    );

    if (!account) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="max-w-md text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold">Connect Wallet</h1>
                    <p className="text-muted-foreground">
                        Please connect your wallet to view your profile, receipts, and inventory.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">My Profile</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-6xl">
                {/* User Info Card */}
                <div className="mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Wallet className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">
                                    {formatAddress(account.address)}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <span>Explorer</span>
                                    <ExternalLink className="h-3 w-3" />
                                </p>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                <Tabs defaultValue="receipts" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                        <TabsTrigger value="receipts" className="gap-2">
                            <ReceiptIcon className="h-4 w-4" /> Receipts
                        </TabsTrigger>
                        <TabsTrigger value="inventory" className="gap-2">
                            <Package className="h-4 w-4" /> Inventory
                        </TabsTrigger>
                        <TabsTrigger value="listed" className="gap-2">
                            <Store className="h-4 w-4" /> Listed
                        </TabsTrigger>
                    </TabsList>

                    {/* Receipts Tab */}
                    <TabsContent value="receipts" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Purchase History</h2>
                            <Badge variant="outline">{receipts.length} Receipts</Badge>
                        </div>

                        {isLoadingReceipts ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-48 rounded-lg" />
                                ))}
                            </div>
                        ) : receipts.length === 0 ? (
                            <div className="text-center py-12 bg-muted/50 rounded-lg">
                                <p className="text-muted-foreground">No receipts found</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {receipts.map(receipt => (
                                    <ReceiptCard key={receipt.id} receipt={receipt} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Inventory Tab */}
                    <TabsContent value="inventory" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Items in Wallet</h2>
                            <Badge variant="outline">{inventory?.length || 0} Items</Badge>
                        </div>

                        {isLoadingInventory ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
                            </div>
                        ) : inventory?.length === 0 ? (
                            <div className="text-center py-12 bg-muted/50 rounded-lg">
                                <p className="text-muted-foreground">Your inventory is empty</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {inventory?.map(product => (
                                    <ProductCard key={product.id} product={product} status="Owned" />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Listed Items Tab (Kiosk) */}
                    <TabsContent value="listed" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Kiosk Listings</h2>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{userKiosk?.items?.length || 0} Listed</Badge>
                                {userKiosk && <Badge variant="default">Kiosk Active</Badge>}
                            </div>
                        </div>

                        {isLoadingKiosks ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
                            </div>
                        ) : !userKiosk || userKiosk.items.length === 0 ? (
                            <div className="text-center py-12 bg-muted/50 rounded-lg">
                                <p className="text-muted-foreground">
                                    {!userKiosk ? "You don't have a Kiosk yet" : "No items listed in your Kiosk"}
                                </p>
                                <Link href="/seller" className="mt-4 inline-block">
                                    <Button variant="outline">Go to Seller Dashboard</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {/* Note: Kiosk items returned by SDK are raw objects, need parsing if we want full Product details */}
                                {/* For simple display we handle rudimentary structure */}
                                {userKiosk.items.map((item: any) => {
                                    // Verified Kiosk Item Parsing
                                    // Kiosk SDK returns SuiObjectResponse, so structure depends on how it was fetched
                                    const content = item.data?.content as any;
                                    const fields = content?.fields;

                                    const product: Product = {
                                        id: item.data?.objectId || item.objectId,
                                        name: fields?.name || 'Unknown Item',
                                        description: fields?.description || '',
                                        imageUrl: fields?.image_url || '',
                                        price: 0, // Kiosk items don't store price in fields, it's in the listing wrapper
                                        creator: fields?.creator || '',
                                        listed: true,
                                        createdAt: Number(fields?.created_at) || 0,
                                        shopId: fields?.shop_id || '',
                                        stock: 1
                                    };

                                    return <ProductCard key={item.objectId} product={product} status="Listed" />;
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

