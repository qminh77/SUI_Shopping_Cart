'use client';

import Link from 'next/link';
import { useCategoryBreadcrumb } from '@/hooks/useCategories';
import { ChevronRight, Home } from 'lucide-react';

interface CategoryBreadcrumbProps {
    categoryId: string | null;
    productCount?: number;
}

export function CategoryBreadcrumb({ categoryId, productCount }: CategoryBreadcrumbProps) {
    const { data: breadcrumb = [], isLoading } = useCategoryBreadcrumb(categoryId);

    if (!categoryId || isLoading) return null;

    return (
        <div className="flex items-center gap-2 text-sm text-white/60 mb-6">
            <Link
                href="/shop"
                className="flex items-center gap-1 hover:text-white transition-colors"
            >
                <Home className="w-4 h-4" />
                <span>Shop</span>
            </Link>

            {breadcrumb.map((category, index) => {
                const isLast = index === breadcrumb.length - 1;

                return (
                    <div key={category.id} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        {isLast ? (
                            <span className="text-white font-medium flex items-center gap-2">
                                {category.icon && <span>{category.icon}</span>}
                                {category.name}
                                {productCount !== undefined && (
                                    <span className="text-blue-400 text-xs">
                                        ({productCount} {productCount === 1 ? 'product' : 'products'})
                                    </span>
                                )}
                            </span>
                        ) : (
                            <Link
                                href={`/shop/${category.slug}`}
                                className="hover:text-white transition-colors flex items-center gap-1"
                            >
                                {category.icon && <span>{category.icon}</span>}
                                {category.name}
                            </Link>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
