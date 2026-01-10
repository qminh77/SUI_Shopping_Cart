'use client';

import { use } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CategoryNav } from '@/components/CategoryNav';
import { CategoryBreadcrumb } from '@/components/CategoryBreadcrumb';
import { SearchBar } from '@/components/SearchBar';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ProductDetailDialog } from '@/components/ProductDetailDialog';
import { useCategoryBySlug } from '@/hooks/useCategories';
import { useProductsByCategory } from '@/hooks/useSearch';
import { useCart } from '@/contexts/CartContext';
import { mistToSui, Product } from '@/lib/sui-utils';
import { ShoppingCart, Package, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import Link from 'next/link';

interface CategoryPageProps {
    params: Promise<{
        categorySlug: string;
    }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
    const { categorySlug } = use(params);
    const { data: category, isLoading: categoryLoading } = useCategoryBySlug(categorySlug);
    const { data: products = [], isLoading: productsLoading } = useProductsByCategory(
        category?.id || null,
        true // Include subcategories
    );
    const { addToCart, items: cartItems } = useCart();

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter products by search query
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

    if (categoryLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-transparent text-white">
                <Navigation />
                <CategoryNav />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
                <Footer />
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen flex flex-col bg-transparent text-white">
                <Navigation />
                <CategoryNav />
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <Package className="w-16 h-16 text-white/20 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Category Not Found</h2>
                    <p className="text-white/60 mb-6">The category you're looking for doesn't exist.</p>
                    <Link href="/shop">
                        <Button className="bg-blue-500 hover:bg-blue-600">
                            Back to Shop
                        </Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-transparent text-white font-sans selection:bg-blue-500/30 selection:text-blue-200">
            <Navigation />
            <CategoryNav />

            {/* Category Header */}
            <div className="relative py-12 px-6 border-b border-white/5">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumb */}
                    <CategoryBreadcrumb
                        categoryId={category.id}
                        productCount={filteredProducts.length}
                    />

                    {/* Category Info */}
                    <div className="flex items-center gap-4 mb-8">
                        {category.icon && (
                            <div className="text-5xl">{category.icon}</div>
                        )}
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight uppercase">
                                {category.name}
                            </h1>
                            {category.description && (
                                <p className="text-white/60 mt-2">{category.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl">
                        <SearchBar
                            onSearch={setSearchQuery}
                            placeholder={`Search in ${category.name}...`}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 relative z-10">
                {productsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="w-full h-[400px] bg-card border border-border animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground">
                        <Package className="w-16 h-16 mb-4 opacity-30" />
                        <h3 className="text-xl font-semibold mb-2">
                            No Products Found
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            {searchQuery
                                ? `No products match "${searchQuery}" in this category`
                                : `No products available in ${category.name}`
                            }
                        </p>
                        <Link href="/shop">
                            <Button variant="outline">
                                Browse All Products
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Results Meta */}
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
                            </p>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredProducts.map((product) => {
                                const isInCart = cartItems.some(item => item.id === product.id);

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => handleProductClick(product)}
                                        className="group relative bg-card border border-border hover:border-primary/50 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/5 flex flex-col"
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-square w-full bg-muted overflow-hidden">
                                            {product.imageUrl ? (
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                                    <Package className="w-12 h-12 text-muted-foreground/20" />
                                                </div>
                                            )}

                                            {/* Stock Badge */}
                                            <Badge
                                                variant={product.stock > 0 ? "default" : "destructive"}
                                                className="absolute top-3 right-3 text-xs font-semibold"
                                            >
                                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                            </Badge>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 flex flex-col flex-1">
                                            <div className="mb-2">
                                                <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                                                    {product.name}
                                                </h3>
                                            </div>

                                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                                                {product.description}
                                            </p>

                                            <div className="pt-4 border-t border-border flex items-center justify-between mt-auto gap-3">
                                                <div>
                                                    <span className="text-xs text-muted-foreground block mb-0.5">Price</span>
                                                    <span className="text-lg font-bold text-primary">{mistToSui(product.price).toFixed(2)} SUI</span>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    onClick={(e) => handleQuickAddToCart(e, product)}
                                                    disabled={isInCart || product.stock === 0}
                                                    className="h-9"
                                                >
                                                    <ShoppingCart className="w-4 h-4 mr-2" />
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
