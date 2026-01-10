'use client';

import Link from 'next/link';
import { useTopLevelCategories, useCategoryTree } from '@/hooks/useCategories';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function CategoryNav() {
    const { data: topCategories, isLoading } = useTopLevelCategories();
    const { data: categoryTree } = useCategoryTree();
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                </div>
            </div>
        );
    }

    if (!topCategories || topCategories.length === 0) {
        return null;
    }

    return (
        <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-md">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center overflow-x-auto scrollbar-hide">
                    {/* All Products Link */}
                    <Link
                        href="/shop"
                        className="flex-shrink-0 px-6 py-4 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors border-r border-white/5"
                    >
                        All Products
                    </Link>

                    {/* Category Links */}
                    {topCategories.map(category => {
                        const treeNode = categoryTree?.find(t => t.id === category.id);
                        const hasSubcategories = treeNode && treeNode.children.length > 0;

                        return (
                            <div
                                key={category.id}
                                className="relative"
                                onMouseEnter={() => setHoveredCategory(category.id)}
                                onMouseLeave={() => setHoveredCategory(null)}
                            >
                                <Link
                                    href={`/shop/${category.slug}`}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-r border-white/5",
                                        hoveredCategory === category.id
                                            ? "text-white bg-white/10"
                                            : "text-white/70 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {category.icon && (
                                        <span className="text-lg">{category.icon}</span>
                                    )}
                                    <span>{category.name}</span>
                                    {treeNode && treeNode.product_count > 0 && (
                                        <Badge variant="secondary" className="ml-1 bg-blue-500/20 text-blue-300 text-xs">
                                            {treeNode.product_count}
                                        </Badge>
                                    )}
                                    {hasSubcategories && (
                                        <ChevronDown className="w-3 h-3 opacity-50" />
                                    )}
                                </Link>

                                {/* Mega Menu Dropdown for Subcategories */}
                                {hasSubcategories && hoveredCategory === category.id && (
                                    <div className="absolute top-full left-0 min-w-[250px] bg-black/95 backdrop-blur-md border border-white/10 shadow-2xl z-50">
                                        <div className="p-4">
                                            <div className="space-y-1">
                                                {treeNode.children.map(subcat => (
                                                    <Link
                                                        key={subcat.id}
                                                        href={`/shop/${subcat.slug}`}
                                                        className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="flex items-center gap-2">
                                                                {subcat.icon && (
                                                                    <span className="text-base">{subcat.icon}</span>
                                                                )}
                                                                {subcat.name}
                                                            </span>
                                                            {subcat.product_count > 0 && (
                                                                <span className="text-xs text-blue-400">
                                                                    {subcat.product_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>

                                            <Link
                                                href={`/shop/${category.slug}`}
                                                className="block mt-3 pt-3 border-t border-white/10 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                View All {category.name} →
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </nav>
    );
}
