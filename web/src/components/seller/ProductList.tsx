
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Package, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { mistToSui } from '@/lib/sui-utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductListProps {
    products: any[];
    isLoading: boolean;
    onEdit: (product: any) => void;
    onDelete: (id: string) => void;
}

export function ProductList({ products, isLoading, onEdit, onDelete }: ProductListProps) {
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t('seller.products.list.empty')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {products.map((product: any) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow group relative">
                    <CardContent className="p-4">
                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1.5 rounded-md border border-border shadow-sm z-10">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => onEdit(product)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => onDelete(product.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-20 h-20 shrink-0 bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <Package className="w-8 h-8 text-muted-foreground/50" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-lg truncate pr-20">{product.name}</h4>
                                    <Badge variant={parseInt(product.stock) < 10 ? "destructive" : "outline"}>
                                        {t('seller.products.form.stock')}: {product.stock}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-primary font-bold text-lg">
                                        {mistToSui(product.price).toFixed(2)} SUI
                                    </div>
                                    {product.category && (
                                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                            {// Render icon if available, safely
                                                product.category.icon && <span>{product.category.icon}</span>
                                            }
                                            {product.category.name}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-sm line-clamp-2">
                                    {product.description}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
