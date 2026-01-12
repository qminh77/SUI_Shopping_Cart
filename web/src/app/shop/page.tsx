'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CategoryNav } from '@/components/CategoryNav';
import { SearchFilterBar, FilterState } from '@/components/SearchFilterBar';
import { ProductDetailDialog } from '@/components/ProductDetailDialog';
import { useSearch } from '@/hooks/useSearch';
import { useCart } from '@/contexts/CartContext';
import { mistToSui, Product } from '@/lib/sui-utils';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product/ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ShopPage() {
    const { t } = useLanguage();
    // Advanced Search Hook
    const {
        products,
        isLoading,
        params,
        updateFilters,
        clearFilters
    } = useSearch({
        limit: 100,
        sortBy: 'newest'
    });

    const { addToCart, items: cartItems } = useCart();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Map useSearch params to FilterState for the component
    const filters: FilterState = {
        searchQuery: params.query || '',
        priceMin: params.minPrice?.toString() || '',
        priceMax: params.maxPrice?.toString() || '',
        creatorAddress: '', // Add this to hook params if needed, currently not in hook
        sortBy: (params.sortBy === 'newest' ? 'name-asc' : params.sortBy) as any // simplistic mapping, might need refinement
    };

    const handleFiltersChange = (newFilters: FilterState) => {
        updateFilters({
            query: newFilters.searchQuery,
            minPrice: newFilters.priceMin ? Number(newFilters.priceMin) : undefined,
            maxPrice: newFilters.priceMax ? Number(newFilters.priceMax) : undefined,
            sortBy: newFilters.sortBy as any
        });
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailOpen(true);
    };

    const handleQuickAddToCart = (e: React.MouseEvent<HTMLButtonElement>, product: Product) => {
        e.stopPropagation();
        const isInCart = cartItems.some(item => item.id === product.id);

        if (isInCart) {
            toast.warning(t('toast.alreadyInCart'));
            return;
        }

        addToCart(product);
        toast.success(t('toast.addedToCart'));
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground animate-fadeIn relative">
            <Navigation />
            <CategoryNav />

            {/* Compact Header Section */}
            <div className="relative pt-8 pb-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <SearchFilterBar
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                            onClearFilters={clearFilters}
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
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground py-12">
                        <div className="h-24 w-24 rounded-full bg-muted/10 flex items-center justify-center mb-6">
                            <Package className="w-10 h-10 opacity-30" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-foreground">{t('shop.noProducts')}</h3>
                        <p className="text-muted-foreground">{t('shop.tryAdjusting')}</p>
                    </div>
                ) : (
                    <>
                        {/* Results Meta */}
                        <div className="flex justify-between items-center mb-8 border-b border-border/50 pb-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                {t('shop.showingResultsCount', { count: products.length })}
                            </p>
                        </div>

                        {/* Products Grid - Consistent Alignment */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {products.map((product) => {
                                const isInCart = cartItems.some(item => item.id === product.id);

                                return (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        isInCart={isInCart}
                                        onAddToCart={handleQuickAddToCart}
                                        onClick={handleProductClick}
                                    />
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
