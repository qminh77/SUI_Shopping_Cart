'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CategoryNav } from '@/components/CategoryNav';
import { SearchBar } from '@/components/SearchBar';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ProductDetailDialog } from '@/components/ProductDetailDialog';
import { useSearch } from '@/hooks/useSearch';
import { useCart } from '@/contexts/CartContext';
import { mistToSui, Product } from '@/lib/sui-utils';
import { ShoppingCart, Package, X, SlidersHorizontal } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function ShopPage() {
    const account = useCurrentAccount();
    const searchParams = useSearchParams();
    const { addToCart, items: cartItems } = useCart();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Initialize search with URL params
    const {
        products,
        isLoading,
        params,
        updateSearch,
        updateFilters,
        clearFilters
    } = useSearch({
        query: searchParams.get('q') || '',
        categoryId: searchParams.get('category') || undefined,
        sortBy: (searchParams.get('sort') as any) || 'newest'
    });

    // Update URL when filters change
    useEffect(() => {
        const newParams = new URLSearchParams();
        if (params.query) newParams.set('q', params.query);
        if (params.categoryId) newParams.set('category', params.categoryId);
        if (params.sortBy && params.sortBy !== 'newest') newParams.set('sort', params.sortBy);

        const newUrl = `${window.location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`;
        window.history.replaceState(null, '', newUrl);
    }, [params]);

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

    const hasActiveFilters = !!(
        params.query ||
        params.categoryId ||
        params.minPrice ||
        params.maxPrice ||
        params.sortBy !== 'newest'
    );

    return (
        <div className="min-h-screen flex flex-col bg-transparent text-white font-sans selection:bg-blue-500/30 selection:text-blue-200">
            <Navigation />
            <CategoryNav />

            {/* Search Header */}
            <div className="relative py-12 px-6 border-b border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center text-center mb-8">
                        <Badge variant="outline" className="mb-4 px-4 py-1 border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest bg-black/50 backdrop-blur-sm rounded-none">
                            Verified Marketplace
                        </Badge>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 uppercase">
                            Discover <span className="text-blue-500">Products</span>
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto">
                        <SearchBar
                            onSearch={updateSearch}
                            placeholder="Search products by name or description..."
                        />
                    </div>

                    {/* Active Filters */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 mt-6 justify-center">
                            <span className="text-xs text-white/60">Active filters:</span>
                            {params.query && (
                                <Badge
                                    className="bg-blue-500/20 text-blue-300 cursor-pointer hover:bg-blue-500/30 transition-colors"
                                    onClick={() => updateSearch('')}
                                >
                                    Search: {params.query}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )}
                            {params.categoryId && (
                                <Badge
                                    className="bg-blue-500/20 text-blue-300 cursor-pointer hover:bg-blue-500/30 transition-colors"
                                    onClick={() => updateFilters({ categoryId: undefined })}
                                >
                                    Category
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )}
                            {(params.minPrice || params.maxPrice) && (
                                <Badge
                                    className="bg-blue-500/20 text-blue-300 cursor-pointer hover:bg-blue-500/30 transition-colors"
                                    onClick={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}
                                >
                                    Price Range
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-6 text-xs text-red-400 hover:text-red-300"
                            >
                                Clear All
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 relative z-10">
                <div className="flex gap-6">
                    {/* Desktop Filter Sidebar */}
                    <div className="hidden lg:block flex-shrink-0">
                        <FilterSidebar
                            filters={params}
                            onFiltersChange={updateFilters}
                            onClearFilters={clearFilters}
                        />
                    </div>

                    {/* Mobile Filter Button */}
                    <div className="lg:hidden fixed bottom-6 right-6 z-50">
                        <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                            <SheetTrigger asChild>
                                <Button className="h-14 w-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg">
                                    <SlidersHorizontal className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="bg-black/95 backdrop-blur-md border-white/20 text-white p-0">
                                <div className="p-4">
                                    <FilterSidebar
                                        filters={params}
                                        onFiltersChange={(f) => {
                                            updateFilters(f);
                                            setIsMobileFilterOpen(false);
                                        }}
                                        onClearFilters={() => {
                                            clearFilters();
                                            setIsMobileFilterOpen(false);
                                        }}
                                        className="border-none bg-transparent"
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Products Area */}
                    <div className="flex-1 min-w-0">
                        {/* Loading State */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="w-full h-[400px] bg-white/[0.02] border border-white/5 animate-pulse cut-corner" />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center min-h-[40vh] text-neutral-500">
                                <Package className="w-16 h-16 mb-4 opacity-30" />
                                <h3 className="text-xl font-medium font-mono uppercase tracking-widest mb-2">No Products Found</h3>
                                <p className="text-sm text-white/40 mb-6">
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'No products available at the moment'}
                                </p>
                                {hasActiveFilters && (
                                    <Button
                                        onClick={clearFilters}
                                        variant="outline"
                                        className="border-white/20 text-white hover:bg-white/10"
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Results Meta */}
                                <div className="flex justify-between items-center mb-6 px-2">
                                    <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                                        <span className="text-blue-500 font-bold">{products.length}</span> Products Found
                                    </span>
                                </div>

                                {/* Products Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {products.map((product) => {
                                        const isInCart = cartItems.some(item => item.id === product.id);

                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => handleProductClick(product)}
                                                className="group relative bg-black/40 border border-white/10 hover:border-blue-500/50 transition-all duration-300 cursor-pointer cut-corner flex flex-col backdrop-blur-sm hover:shadow-[0_0_20px_rgba(77,162,255,0.1)]"
                                            >
                                                {/* Image */}
                                                <div className="relative aspect-square w-full bg-neutral-900 border-b border-white/5 overflow-hidden">
                                                    {product.imageUrl ? (
                                                        <Image
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                            <Package className="w-12 h-12 text-white/20" />
                                                        </div>
                                                    )}

                                                    {/* Stock Badge */}
                                                    <div className={`absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider backdrop-blur-md cut-corner-bottom-right ${product.stock > 0 ? 'bg-green-600/90' : 'bg-red-600/90'}`}>
                                                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                                    </div>

                                                    {/* Category Badge */}
                                                    {product.categoryName && (
                                                        <div className="absolute bottom-2 left-2">
                                                            <Badge className="bg-black/80 backdrop-blur-sm text-xs">
                                                                {product.categoryIcon} {product.categoryName}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-5 flex flex-col flex-1">
                                                    <div className="mb-2">
                                                        <h3 className="text-base font-bold text-white truncate font-mono uppercase tracking-tight">{product.name}</h3>
                                                    </div>

                                                    <p className="text-neutral-400 text-xs line-clamp-2 mb-6 flex-1 font-light leading-relaxed">
                                                        {product.description}
                                                    </p>

                                                    <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto gap-3">
                                                        <div>
                                                            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-0.5">Price</span>
                                                            <span className="text-base font-bold text-white tracking-tight">{mistToSui(product.price).toFixed(2)} SUI</span>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => handleQuickAddToCart(e, product)}
                                                            disabled={isInCart || product.stock === 0}
                                                            className={`
                                                                h-8 text-[10px] font-bold uppercase tracking-wider transition-all cut-corner-bottom-right rounded-none
                                                                ${isInCart || product.stock === 0
                                                                    ? 'bg-neutral-800 text-neutral-500 hover:bg-neutral-800 border-neutral-700'
                                                                    : 'bg-white text-black hover:bg-blue-500 hover:text-white border-none'
                                                                }
                                                            `}
                                                        >
                                                            <ShoppingCart className="w-3 h-3 mr-2" />
                                                            {isInCart ? 'Added' : product.stock === 0 ? 'Sold Out' : 'Add'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
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
