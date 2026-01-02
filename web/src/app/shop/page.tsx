'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ProductDetailDialog } from '@/components/ProductDetailDialog';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { mistToSui, Product } from '@/lib/sui-utils';
import { ShoppingCart, Package } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ShopPage() {
    const account = useCurrentAccount();
    const { products, isLoading } = useProducts();
    const { addToCart, items: cartItems } = useCart();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const listedProducts = products || [];

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
        <div className="min-h-screen flex flex-col bg-transparent text-white font-sans selection:bg-blue-500/30 selection:text-blue-200">
            <Navigation />

            {/* Hero Section */}
            <div className="relative py-24 px-6 border-b border-white/5 overflow-hidden">
                <div className="relative z-10 flex flex-col items-center text-center">
                    <Badge variant="outline" className="mb-6 px-4 py-1 border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest bg-black/50 backdrop-blur-sm rounded-none">
                        Verified Marketplace
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 uppercase">
                        Discover <span className="text-blue-500">NFT Products</span>
                    </h1>
                    <p className="max-w-xl text-neutral-400 text-lg leading-relaxed font-light">
                        Browse and purchase digital assets from verified creators.
                        Secured by the Sui blockchain.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
                {/* Loading State */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="w-full h-[400px] bg-white/[0.02] border border-white/5 animate-pulse cut-corner" />
                        ))}
                    </div>
                ) : listedProducts.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-neutral-500">
                        <Package className="w-12 h-12 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium font-mono uppercase tracking-widest">No Listings Found</h3>
                    </div>
                ) : (
                    <>
                        {/* Results Meta */}
                        <div className="flex justify-between items-center mb-8 px-2">
                            <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                                <span className="text-blue-500 font-bold">{listedProducts.length}</span> Items Found
                            </span>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {listedProducts.map((product) => {
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

                                            {/* Badge */}
                                            <div className="absolute top-0 right-0 bg-blue-600/90 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider backdrop-blur-md cut-corner-bottom-right">
                                                NFT
                                            </div>
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
                                                    <span className="text-base font-bold text-white tracking-tight">{mistToSui(product.price)} SUI</span>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    onClick={(e) => handleQuickAddToCart(e, product)}
                                                    disabled={isInCart}
                                                    className={`
                                                        h-8 text-[10px] font-bold uppercase tracking-wider transition-all cut-corner-bottom-right rounded-none
                                                        ${isInCart
                                                            ? 'bg-neutral-800 text-neutral-500 hover:bg-neutral-800 border-neutral-700'
                                                            : 'bg-white text-black hover:bg-blue-500 hover:text-white border-none'
                                                        }
                                                    `}
                                                >
                                                    <ShoppingCart className="w-3 h-3 mr-2" />
                                                    {isInCart ? 'Added' : 'Add'}
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
