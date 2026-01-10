'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CategoryNav } from '@/components/CategoryNav';
import { SearchBar } from '@/components/SearchBar';
import { ProductDetailDialog } from '@/components/ProductDetailDialog';
import { useProductsWithCategory } from '@/hooks/useSearch';
import { useCart } from '@/contexts/CartContext';
import { mistToSui, Product } from '@/lib/sui-utils';
import { ShoppingCart, Package } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatrixText } from '@/components/ui/matrix-text';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { GridPattern } from '@/components/ui/grid-pattern';

export default function ShopPage() {
    const { data: products = [], isLoading } = useProductsWithCategory(100);
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

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground animate-fadeIn relative">
            <Navigation />
            <CategoryNav />

            {/* Hero Section */}
            <div className="relative py-16 md:py-24 border-b border-border bg-background/50 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <GridPattern
                        className="h-full w-full stroke-muted-foreground/10 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
                        width={40}
                        height={40}
                        x={-1}
                        y={-1}
                    />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
                        <Badge variant="outline" className="mb-4 bg-background/50 backdrop-blur-sm px-3 py-1 border-primary/20 text-muted-foreground uppercase tracking-widest text-[10px]">
                            <MatrixText text="Web3 Marketplace" speed={20} />
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 md:mb-8 text-foreground drop-shadow-sm">
                            <span className="block mb-2">Discover</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">
                                Amazing Assets
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Browse our curated collection of verified digital assets <br className="hidden md:block" />
                            secured on the <span className="font-semibold text-foreground">Sui network</span>.
                        </p>
                    </div>

                    <div className="max-w-xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-foreground/10 via-foreground/5 to-foreground/10 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <SearchBar
                            onSearch={setSearchQuery}
                            placeholder="Search products, collections..."
                            className="bg-background/80 backdrop-blur-md shadow-lg border-border relative h-12"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="aspect-[4/5] bg-muted/10 animate-pulse rounded-sm border border-border/50" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground py-12">
                        <div className="h-24 w-24 rounded-full bg-muted/10 flex items-center justify-center mb-6">
                            <Package className="w-10 h-10 opacity-30" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-foreground">No Products Found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                    </div>
                ) : (
                    <>
                        {/* Results Meta */}
                        <div className="flex justify-between items-center mb-8 border-b border-border/50 pb-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Showing <span className="text-foreground font-bold">{filteredProducts.length}</span> results
                            </p>
                        </div>

                        {/* Products Grid - Consistent Alignment */}
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

                                            {/* Stock Badge - Minimal */}
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
