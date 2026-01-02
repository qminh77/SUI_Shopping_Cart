'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { WalletConnection } from '@/components/WalletConnection';
import { useShop } from '@/hooks/useShop';
import { useProducts } from '@/hooks/useProducts';
import { useKiosk } from '@/hooks/useKiosk';
import { mistToSui, formatAddress } from '@/lib/sui-utils';
import Link from 'next/link';
import { Store, Package, Eye, EyeOff, ShoppingBag } from 'lucide-react';

export default function SellerPage() {
    const account = useCurrentAccount();
    const { userShop, isLoading: isLoadingShop, createShop, isCreatingShop } = useShop();
    const { userProducts, createProduct, isCreatingProduct, toggleProductListing, isTogglingListing } = useProducts();
    const { hasKiosk, userKiosk, isLoadingKiosks, createKiosk, isCreatingKiosk, placeAndList, isListingProduct } = useKiosk(account?.address);

    // Shop form state
    const [shopFormData, setShopFormData] = useState({
        name: '',
        description: '',
    });

    // Product form state
    const [productFormData, setProductFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        price: '',
    });

    const handleCreateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createShop(shopFormData);
            setShopFormData({ name: '', description: '' });
        } catch (error) {
            console.error('Shop creation error:', error);
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userShop) return;
        if (!hasKiosk) {
            alert('Please create a Kiosk first!');
            return;
        }

        try {
            // Create the product NFT
            const result = await createProduct({
                shopId: userShop.id,
                name: productFormData.name,
                description: productFormData.description,
                imageUrl: productFormData.imageUrl,
                price: parseFloat(productFormData.price),
            });

            // TODO: After minting, we would need the product ID to list it
            // For now, products need to be manually listed after creation
            // In a future iteration, we could extract the product ID from the transaction result

            setProductFormData({ name: '', description: '', imageUrl: '', price: '' });
        } catch (error) {
            console.error('Product creation error:', error);
        }
    };

    const handleCreateKiosk = async () => {
        try {
            await createKiosk();
        } catch (error) {
            console.error('Kiosk creation error:', error);
        }
    };

    const handleToggleListing = async (productId: string, currentlyListed: boolean) => {
        try {
            await toggleProductListing({ productId, list: !currentlyListed });
        } catch (error) {
            console.error('Toggle listing error:', error);
        }
    };

    // Not connected
    if (!account) {
        return (
            <div className="min-h-screen bg-background">
                <header className="border-b">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded bg-primary" />
                                <span className="text-xl font-semibold">Sui Commerce</span>
                            </Link>
                            <WalletConnection />
                        </div>
                    </div>
                </header>

                <div className="flex items-center justify-center min-h-[80vh]">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Wallet Required</CardTitle>
                            <CardDescription>
                                Please connect your Sui wallet to access the seller dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                You'll need a connected wallet to create shops and manage products.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Loading shop status
    if (isLoadingShop) {
        return (
            <div className="min-h-screen bg-background">
                <header className="border-b">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded bg-primary" />
                                <span className="text-xl font-semibold">Sui Commerce</span>
                            </Link>
                            <WalletConnection />
                        </div>
                    </div>
                </header>
                <div className="flex items-center justify-center min-h-[80vh]">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // No shop - show create shop form
    if (!userShop) {
        return (
            <div className="min-h-screen bg-background">
                <header className="border-b">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded bg-primary" />
                                <span className="text-xl font-semibold">Sui Commerce</span>
                            </Link>
                            <WalletConnection />
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-6 py-12 max-w-2xl">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Store className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Create Your Shop</CardTitle>
                                    <CardDescription>
                                        Set up your shop to start selling products on the marketplace
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateShop} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="shopName">Shop Name *</Label>
                                    <Input
                                        id="shopName"
                                        placeholder="e.g., My Digital Art Gallery"
                                        value={shopFormData.name}
                                        onChange={(e) => setShopFormData({ ...shopFormData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shopDescription">Shop Description *</Label>
                                    <Textarea
                                        id="shopDescription"
                                        placeholder="Describe what you sell..."
                                        value={shopFormData.description}
                                        onChange={(e) => setShopFormData({ ...shopFormData, description: e.target.value })}
                                        required
                                        rows={4}
                                    />
                                </div>

                                <Separator />

                                <div className="rounded-lg bg-muted p-4 space-y-2">
                                    <h4 className="font-semibold text-sm">What happens next?</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                        <li>Your shop will be registered on-chain</li>
                                        <li>You'll receive a ShopOwnerCap NFT (proof of ownership)</li>
                                        <li>You can start creating and listing products</li>
                                        <li>Your shop will be discoverable on the marketplace</li>
                                    </ul>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isCreatingShop}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isCreatingShop ? 'Creating Shop...' : 'Create Shop'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    // Has shop - show dashboard
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-primary" />
                            <span className="text-xl font-semibold">Sui Commerce</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/profile">
                                <Button variant="ghost">My Profile</Button>
                            </Link>
                            <WalletConnection />
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Seller Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your shop and products
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3 mb-8">
                    {/* Shop Info */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Store className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>{userShop.name}</CardTitle>
                                        <CardDescription>{userShop.description}</CardDescription>
                                    </div>
                                </div>
                                <Badge variant="outline">Your Shop</Badge>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Kiosk Status */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <ShoppingBag className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>Kiosk Status</CardTitle>
                                        <CardDescription>
                                            {hasKiosk ? 'Your Kiosk is ready for listing products' : 'Create a Kiosk to list and sell products'}
                                        </CardDescription>
                                    </div>
                                </div>
                                {hasKiosk ? (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                                        Active
                                    </Badge>
                                ) : (
                                    <Button
                                        onClick={handleCreateKiosk}
                                        disabled={isCreatingKiosk || isLoadingKiosks}
                                        size="sm"
                                    >
                                        {isCreatingKiosk ? 'Creating...' : 'Create Kiosk'}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        {!hasKiosk && (
                            <CardContent>
                                <div className="rounded-lg bg-muted p-4">
                                    <p className="text-sm text-muted-foreground">
                                        ℹ️ A Kiosk is required to list products for sale. It's a secure container on the Sui blockchain that enables decentralized commerce with built-in royalty support.
                                    </p>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Create Product Form */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Package className="h-5 w-5" />
                                <div>
                                    <CardTitle>Create New Product</CardTitle>
                                    <CardDescription>
                                        Mint a product NFT linked to your shop
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateProduct} className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Product Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Digital Artwork #1"
                                            value={productFormData.name}
                                            onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price (SUI) *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.001"
                                            min="0"
                                            placeholder="0.000"
                                            value={productFormData.price}
                                            onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe your product..."
                                        value={productFormData.description}
                                        onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                                        required
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">Image URL *</Label>
                                    <Input
                                        id="imageUrl"
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={productFormData.imageUrl}
                                        onChange={(e) => setProductFormData({ ...productFormData, imageUrl: e.target.value })}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isCreatingProduct}
                                    className="w-full"
                                >
                                    {isCreatingProduct ? 'Creating...' : 'Create Product NFT'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* My Products List */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>My Products ({userProducts?.length || 0})</CardTitle>
                            <CardDescription>
                                Manage your product listings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!userProducts || userProducts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No products yet. Create your first product above!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {userProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold truncate">{product.name}</h4>
                                                    <Badge variant={product.listed ? 'default' : 'secondary'} className="shrink-0">
                                                        {product.listed ? 'Listed' : 'Unlisted'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                                    {product.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="font-mono">{mistToSui(product.price)} SUI</span>
                                                    <span>ID: {formatAddress(product.id, 6)}</span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleListing(product.id, product.listed)}
                                                disabled={isTogglingListing}
                                                className="ml-4"
                                            >
                                                {product.listed ? (
                                                    <>
                                                        <EyeOff className="h-4 w-4 mr-2" />
                                                        Unlist
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        List
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
