'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WalletConnection } from '@/components/WalletConnection';
import { ProductDetailDialog } from '@/components/ProductDetailDialog';
import { CartDrawer } from '@/components/CartDrawer';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { mistToSui, formatAddress, Product } from '@/lib/sui-utils';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { ShoppingCart, Store, Eye, Package, User } from 'lucide-react';

export default function ShopPage() {
    const account = useCurrentAccount();
    const { products, isLoading } = useProducts();
    const { addToCart, items: cartItems } = useCart();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const listedProducts = products?.filter(p => p.listed) || [];

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailOpen(true);
    };

    const handleQuickAddToCart = (e: React.MouseEvent, product: Product) => {
        e.stopPropagation();
        const isInCart = cartItems.some(item => item.id === product.id);

        if (isInCart) {
            toast.info('Product already in cart');
            return;
        }

        addToCart(product);
        toast.success('Added to cart!');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-primary" />
                            <span className="text-xl font-semibold">Sui Commerce</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/seller"
                                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
                            >
                                <Store className="h-4 w-4" />
                                <span className="hidden sm:inline">Seller Dashboard</span>
                            </Link>
                            <Link
                                href="/profile"
                                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
                            >
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">My Profile</span>
                            </Link>
                            <CartDrawer />
                            <WalletConnection />
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="border-b bg-secondary/20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
                        <Badge variant="secondary" className="px-4 py-1.5 rounded-full">
                            Multi-Shop Marketplace
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                            Discover NFT Products
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Browse and purchase products from verified shops on the Sui blockchain.
                            Secure ownership, instant delivery.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Loading State */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="space-y-4">
                                <div className="aspect-square bg-secondary/50 animate-pulse rounded-lg" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-secondary/50 rounded w-3/4 animate-pulse" />
                                    <div className="h-4 bg-secondary/50 rounded w-1/2 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : listedProducts.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center border-2 border-dashed rounded-lg border-secondary">
                        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">No Products Listed</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                The marketplace is currently empty. Be the first to create a shop and list products!
                            </p>
                        </div>
                        <Link href="/seller">
                            <Button size="lg" className="rounded-full px-8">
                                <Store className="h-4 w-4 mr-2" />
                                Create Your Shop
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Results Meta */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b">
                            <p className="text-sm font-medium text-muted-foreground">
                                {listedProducts.length} Product{listedProducts.length !== 1 ? 's' : ''} Available
                            </p>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {listedProducts.map((product) => {
                                const isInCart = cartItems.some(item => item.id === product.id);

                                return (
                                    <Card
                                        key={product.id}
                                        className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                                        onClick={() => handleProductClick(product)}
                                    >
                                        {/* Product Image */}
                                        <div className="relative aspect-square overflow-hidden bg-secondary/20">
                                            <Image
                                                src={product.imageUrl}
                                                alt={product.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute top-3 left-3">
                                                <Badge variant="secondary" className="backdrop-blur-sm bg-black/50 text-white border-none">
                                                    NFT
                                                </Badge>
                                            </div>

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleProductClick(product);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={(e) => handleQuickAddToCart(e, product)}
                                                    disabled={isInCart}
                                                >
                                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                                    {isInCart ? 'In Cart' : 'Add'}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Product Info */}
                                        <CardContent className="p-4 space-y-3">
                                            <div>
                                                <h3 className="font-semibold text-base line-clamp-1 mb-1">
                                                    {product.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                    {product.description}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                                                <span>
                                                    by <span className="text-foreground font-medium">{formatAddress(product.creator)}</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 pt-2">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                                                    <p className="font-bold text-lg">{mistToSui(product.price)} SUI</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Trust Signals */}
                        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-12">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm uppercase tracking-wide">Blockchain Secured</h4>
                                <p className="text-sm text-muted-foreground">
                                    Every item is verified on the Sui network for authentic ownership.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm uppercase tracking-wide">Instant Settlement</h4>
                                <p className="text-sm text-muted-foreground">
                                    Lightning fast transactions with sub-second finality.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm uppercase tracking-wide">Multi-Shop</h4>
                                <p className="text-sm text-muted-foreground">
                                    Purchase from multiple verified sellers in one marketplace.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Product Detail Dialog */}
            <ProductDetailDialog
                product={selectedProduct}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />

            {/* Footer */}
            <footer className="border-t bg-background py-16 mt-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left space-y-2">
                            <h4 className="font-bold text-lg">Sui Commerce</h4>
                            <p className="text-sm text-muted-foreground">
                                The premier multi-shop marketplace for digital assets.
                            </p>
                        </div>
                        <div className="flex gap-8 text-sm text-muted-foreground">
                            <span>Powered by Sui</span>
                            <span>Secure & Fast</span>
                            <span>Verified Assets</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
