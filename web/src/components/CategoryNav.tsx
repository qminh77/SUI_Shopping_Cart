'use client';

import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Package, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MatrixText } from '@/components/ui/matrix-text';

export function CategoryNav() {
    const { data: categories = [], isLoading } = useCategories();

    if (isLoading) {
        return (
            <div className="border-b border-border bg-card/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-2 py-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-10 w-28" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (categories.length === 0) {
        return null;
    }

    const topLevelCategories = categories.filter(cat => !cat.parent_id);

    return (
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-40 hidden md:block">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                <NavigationMenu className="py-2">
                    <NavigationMenuList className="space-x-1">
                        {/* All Products */}
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "uppercase tracking-wider font-bold text-xs hover:text-foreground text-muted-foreground cursor-pointer")}>
                                <Link href="/shop">
                                    <LayoutGrid className="h-4 w-4 mr-2" />
                                    <MatrixText text="All Products" speed={20} />
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>

                        {/* Categories Dropdown */}
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="uppercase tracking-wider font-bold text-xs text-muted-foreground hover:text-foreground">
                                <Package className="h-4 w-4 mr-2" />
                                <MatrixText text="Categories" speed={20} />
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <div className="grid gap-4 p-6 w-[800px] grid-cols-3 lg:grid-cols-4">
                                    {topLevelCategories.map((category) => {
                                        const subcategories = categories.filter(
                                            cat => cat.parent_id === category.id
                                        );

                                        return (
                                            <div key={category.id} className="flex flex-col gap-2 p-2 hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                                <Link
                                                    href={`/shop/${category.slug}`}
                                                    className="group block select-none space-y-1 no-underline outline-none"
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {category.icon && (
                                                            <span className="text-xl shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                                                                {category.icon}
                                                            </span>
                                                        )}
                                                        <div className="font-bold text-sm leading-none group-hover:text-foreground text-foreground/80 transition-colors uppercase tracking-tight">
                                                            <MatrixText text={category.name} speed={15} />
                                                        </div>
                                                    </div>
                                                    {category.description && (
                                                        <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground group-hover:text-muted-foreground/80">
                                                            {category.description}
                                                        </p>
                                                    )}
                                                </Link>

                                                {/* Subcategories */}
                                                {subcategories.length > 0 && (
                                                    <div className="pl-3 border-l border-border space-y-1 mt-auto">
                                                        {subcategories.map((subcat) => (
                                                            <Link
                                                                key={subcat.id}
                                                                href={`/shop/${subcat.slug}`}
                                                                className="block select-none py-1 text-[11px] leading-none no-underline outline-none text-muted-foreground hover:text-foreground transition-colors truncate"
                                                            >
                                                                {subcat.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        {/* Quick Links */}
                        {topLevelCategories.slice(0, 5).map((category) => (
                            <NavigationMenuItem key={category.id}>
                                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "uppercase tracking-wider font-bold text-xs text-muted-foreground hover:text-foreground cursor-pointer")}>
                                    <Link href={`/shop/${category.slug}`}>
                                        <MatrixText text={category.name} speed={20} />
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </div>
    );
}
