'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCategoryTree } from '@/hooks/useCategories';
import { SearchParams, mistToSui, suiToMist } from '@/lib/sui-utils';

interface FilterSidebarProps {
    filters: SearchParams;
    onFiltersChange: (filters: Partial<SearchParams>) => void;
    onClearFilters: () => void;
    className?: string;
}

export function FilterSidebar({
    filters,
    onFiltersChange,
    onClearFilters,
    className
}: FilterSidebarProps) {
    const { data: categoryTree = [] } = useCategoryTree();
    const [expandedSections, setExpandedSections] = useState({
        categories: true,
        price: true,
        sort: true,
        availability: true
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Price range in SUI for display
    const priceMin = filters.minPrice !== undefined ? mistToSui(filters.minPrice) : 0;
    const priceMax = filters.maxPrice !== undefined ? mistToSui(filters.maxPrice) : 100;

    const handlePriceChange = (values: number[]) => {
        onFiltersChange({
            minPrice: values[0] > 0 ? suiToMist(values[0]) : undefined,
            maxPrice: values[1] < 100 ? suiToMist(values[1]) : undefined
        });
    };

    const handleCategoryToggle = (categoryId: string) => {
        onFiltersChange({
            categoryId: filters.categoryId === categoryId ? undefined : categoryId
        });
    };

    const hasActiveFilters = !!(
        filters.categoryId ||
        filters.minPrice ||
        filters.maxPrice ||
        filters.sortBy !== 'newest' ||
        !filters.inStockOnly
    );

    return (
        <aside className={cn(
            "w-full lg:w-64 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg",
            className
        )}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-white">Filters</h3>
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="text-xs text-blue-400 hover:text-blue-300 h-auto p-1"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            <div className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">

                {/* Categories Filter */}
                <div>
                    <button
                        onClick={() => toggleSection('categories')}
                        className="w-full flex items-center justify-between mb-3 text-white hover:text-blue-400 transition-colors"
                    >
                        <span className="font-medium text-sm">Categories</span>
                        {expandedSections.categories ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>

                    {expandedSections.categories && (
                        <div className="space-y-2">
                            {categoryTree.map(category => (
                                <div key={category.id} className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`category-${category.id}`}
                                            checked={filters.categoryId === category.id}
                                            onCheckedChange={() => handleCategoryToggle(category.id)}
                                            className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                        />
                                        <Label
                                            htmlFor={`category-${category.id}`}
                                            className="text-sm text-white/70 hover:text-white cursor-pointer flex items-center gap-2 flex-1"
                                        >
                                            {category.icon && <span>{category.icon}</span>}
                                            <span>{category.name}</span>
                                            {category.product_count > 0 && (
                                                <span className="text-xs text-white/40">
                                                    ({category.product_count})
                                                </span>
                                            )}
                                        </Label>
                                    </div>

                                    {/* Subcategories */}
                                    {category.children.length > 0 && (
                                        <div className="ml-6 space-y-1 mt-1">
                                            {category.children.map(subcat => (
                                                <div key={subcat.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`category-${subcat.id}`}
                                                        checked={filters.categoryId === subcat.id}
                                                        onCheckedChange={() => handleCategoryToggle(subcat.id)}
                                                        className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                                    />
                                                    <Label
                                                        htmlFor={`category-${subcat.id}`}
                                                        className="text-xs text-white/60 hover:text-white cursor-pointer flex items-center gap-2 flex-1"
                                                    >
                                                        {subcat.icon && <span>{subcat.icon}</span>}
                                                        <span>{subcat.name}</span>
                                                        {subcat.product_count > 0 && (
                                                            <span className="text-xs text-white/40">
                                                                ({subcat.product_count})
                                                            </span>
                                                        )}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Price Range Filter */}
                <div>
                    <button
                        onClick={() => toggleSection('price')}
                        className="w-full flex items-center justify-between mb-3 text-white hover:text-blue-400 transition-colors"
                    >
                        <span className="font-medium text-sm">Price Range</span>
                        {expandedSections.price ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>

                    {expandedSections.price && (
                        <div className="space-y-4">
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[priceMin, priceMax]}
                                onValueChange={handlePriceChange}
                                className="w-full"
                            />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-white/60">
                                    {priceMin.toFixed(1)} SUI
                                </span>
                                <span className="text-white/60">
                                    {priceMax.toFixed(1)} SUI
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sort By */}
                <div>
                    <button
                        onClick={() => toggleSection('sort')}
                        className="w-full flex items-center justify-between mb-3 text-white hover:text-blue-400 transition-colors"
                    >
                        <span className="font-medium text-sm">Sort By</span>
                        {expandedSections.sort ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>

                    {expandedSections.sort && (
                        <Select
                            value={filters.sortBy || 'newest'}
                            onValueChange={(value) => onFiltersChange({ sortBy: value as SearchParams['sortBy'] })}
                        >
                            <SelectTrigger className="w-full bg-black/40 border-white/20 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black/95 backdrop-blur-md border-white/20">
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                <SelectItem value="name">Name: A to Z</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Availability */}
                <div>
                    <button
                        onClick={() => toggleSection('availability')}
                        className="w-full flex items-center justify-between mb-3 text-white hover:text-blue-400 transition-colors"
                    >
                        <span className="font-medium text-sm">Availability</span>
                        {expandedSections.availability ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>

                    {expandedSections.availability && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="in-stock"
                                checked={filters.inStockOnly}
                                onCheckedChange={(checked) => onFiltersChange({ inStockOnly: !!checked })}
                                className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                            <Label
                                htmlFor="in-stock"
                                className="text-sm text-white/70 hover:text-white cursor-pointer"
                            >
                                In Stock Only
                            </Label>
                        </div>
                    )}
                </div>

            </div>
        </aside>
    );
}
