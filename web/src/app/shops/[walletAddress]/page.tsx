'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ShopHeader } from '@/components/ShopHeader';
import { SearchBar } from '@/components/SearchBar';
import { ProductDetailDialog } from '@/components/ProductDetailDialog';
import { usePublicShop } from '@/hooks/usePublicShop';
import { useCart } from '@/contexts/CartContext';
import { mistToSui, Product } from '@/lib/sui-utils';
import { ShoppingCart, Package, AlertCircle, Store } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatrixText } from '@/components/ui/matrix-text';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ShopViewPage() {
    const params = useParams();
    const walletAddress = params.walletAddress as string;

    const { shop, products, isLoading, error } = usePublicShop(walletAddress);
    const { addToCart, items: cartItems } = useCart();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = searchQuery
        ? products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : products;

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailOpen(true);
    };

    const handleQuickAddToCart = (e: React.MouseEvent<HTMLButtonElement>, product: Product) => {
        e.stopPropagation();
        const isInCart = cartItems.some(item => item.id === product.id);

        if (isInCart) {
            toast.warning('Product already in cart');
            return;
        }

        addToCart(product);
        toast.success('Added to cart!');
    };

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex flex-col bg-background text-foreground">
                <Navigation />
                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {(error as Error).message || 'Failed to load shop information'}
                        </AlertDescription>
                    </Alert>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground animate-fadeIn">
            <Navigation />

            {/* Shop Header */}
            {isLoading ? (
                <div className="border-b border-border bg-background/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                        <div className="animate-pulse space-y-4">
                            <div className="flex gap-6">
                                <div className="w-32 h-32 bg-muted/20 rounded-lg" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-8 bg-muted/20 rounded w-1/3" />
                                    <div className="h-4 bg-muted/20 rounded w-2/3" />
                                    <div className="h-4 bg-muted/20 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : shop ? (
                <ShopHeader shop={shop} productCount={products.length} />
            ) : null}

            {/* Search Bar */}
            <div className="border-b border-border bg-background/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="max-w-xl">
                        <SearchBar
                            onSearch={setSearchQuery}
                            placeholder="Search products in this shop..."
                            className="bg-background/80 backdrop-blur-sm border-border"
                        />
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="aspect-[4/5] bg-muted/10 animate-pulse rounded-sm border border-border/50" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground py-12">
                        <div className="h-24 w-24 rounded-full bg-muted/10 flex items-center justify-center mb-6">
                            {searchQuery ? (
                                <Package className="w-10 h-10 opacity-30" />
                            ) : (
                                <Store className="w-10 h-10 opacity-30" />
                            )}
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-foreground">
                            {searchQuery ? 'No Products Found' : 'No Products Yet'}
                        </h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            {searchQuery
                                ? 'Try adjusting your search criteria'
                                : 'This shop hasn\'t listed any products yet. Check back later!'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Results Meta */}
                        <div className="flex justify-between items-center mb-8 border-b border-border/50 pb-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Showing <span className="text-foreground font-bold">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'product' : 'products'}
                            </p>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredProducts.map((product) => {
                                const isInCart = cartItems.some(item => item.id === product.id);

                                return (
                                    <SpotlightCard
                                        key={product.id}
                                        onClick={() => handleProductClick(product)}
                                        spotlightColor="rgba(255, 255, 255, 0.15)"
                                        className="group cursor-pointer flex flex-col h-full rounded-none"
                                    >
                                        {/* Image Area */}
                                        <div className="relative aspect-square w-full bg-muted/5 overflow-hidden border-b border-border/50">
                                            {product.imageUrl ? (
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted/10">
                                                    <Package className="w-12 h-12 text-muted-foreground/20" />
                                                </div>
                                            )}

                                            {/* Stock Badge */}
                                            {product.stock === 0 && (
                                                <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                                                    <Badge variant="destructive" className="font-bold uppercase tracking-wider rounded-none">Sold Out</Badge>
                                                </div>
                                            )}
                                            {product.stock > 0 && product.stock < 5 && (
                                                <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] font-bold bg-background/80 backdrop-blur-sm border border-border/50 rounded-none z-10">
                                                    Low Stock
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-1 gap-4">
                                            <div className="flex-1 space-y-2">
                                                <h3 className="font-bold text-base text-foreground truncate group-hover:text-foreground/80 transition-colors tracking-tight uppercase">
                                                    <MatrixText text={product.name} hover={true} speed={40} />
                                                </h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {product.description}
                                                </p>
                                            </div>

                                            <div className="pt-4 mt-auto flex items-end justify-between gap-3 border-t border-border/50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Price</span>
                                                    <span className="text-lg font-bold text-foreground font-mono">
                                                        {mistToSui(product.price).toFixed(2)} SUI
                                                    </span>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant={isInCart ? "secondary" : "default"}
                                                    onClick={(e) => handleQuickAddToCart(e, product)}
                                                    disabled={isInCart || product.stock === 0}
                                                    className="h-9 px-4 font-bold uppercase tracking-wider text-[11px] rounded-none transition-all active:scale-95"
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5 mr-2" />
                                                    {isInCart ? 'Added' : 'Add'}
                                                </Button>
                                            </div>
                                        </div>
                                    </SpotlightCard>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>

            <ProductDetailDialog
                product={selectedProduct}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />

            <Footer />
        </div>
    );
}
