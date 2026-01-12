'use client';

import React from 'react';
import Image from 'next/image';
import { ShoppingCart, Package } from 'lucide-react';
import { mistToSui, Product } from '@/lib/sui-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatrixText } from '@/components/ui/matrix-text';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductCardProps {
    product: Product;
    isInCart: boolean;
    onAddToCart: (e: React.MouseEvent<HTMLButtonElement>, product: Product) => void;
    onClick: (product: Product) => void;
}

export function ProductCard({ product, isInCart, onAddToCart, onClick }: ProductCardProps) {
    const { t } = useLanguage();

    return (
        <SpotlightCard
            onClick={() => onClick(product)}
            spotlightColor="rgba(255, 255, 255, 0.15)"
            className="group cursor-pointer flex flex-col h-full rounded-none overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5 border-border/50"
        >
            {/* Image Area - Aspect Ratio 1:1 for consistency and compactness */}
            <div className="relative aspect-square w-full bg-muted/5 overflow-hidden border-b border-border/50">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/10">
                        <Package className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                )}

                {/* Status Badges - Absolute positioned */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 pointer-events-none">
                    {product.stock === 0 && (
                        <Badge variant="outline" className="font-bold uppercase tracking-wider text-[10px] h-5 px-1.5 rounded-sm bg-background/80 backdrop-blur-sm border-foreground text-foreground">
                            {t('product.outOfStock')}
                        </Badge>
                    )}
                    {product.stock > 0 && product.stock < 5 && (
                        <Badge variant="secondary" className="font-bold text-[10px] bg-background/80 backdrop-blur-sm border border-border/50 h-5 px-1.5 rounded-sm text-foreground">
                            {t('product.lowStock')}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content Area - Compact padding */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
                <div className="flex-1 min-h-0">
                    <h3 className="font-bold text-sm text-foreground truncate group-hover:text-foreground/70 transition-colors tracking-tight uppercase mb-1">
                        <MatrixText text={product.name} hover={true} speed={40} />
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-8">
                        {product.description}
                    </p>
                </div>

                {/* Price and Action */}
                <div className="pt-3 mt-auto flex items-center justify-between gap-2 border-t border-border/50">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t('product.price')}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-foreground font-mono">
                                {mistToSui(product.price).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">SUI</span>
                        </div>
                    </div>

                    <Button
                        size="icon"
                        variant={isInCart ? "secondary" : "default"}
                        onClick={(e) => onAddToCart(e, product)}
                        disabled={isInCart || product.stock === 0}
                        className={`h-8 w-8 shrink-0 rounded-sm transition-all shadow-sm ${isInCart
                            ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            : 'bg-foreground text-background hover:bg-foreground/90'
                            }`}
                        title={isInCart ? t('product.added') : t('product.addToCart')}
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </SpotlightCard>
    );
}
