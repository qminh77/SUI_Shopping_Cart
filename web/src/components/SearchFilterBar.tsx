'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FilterState {
    searchQuery: string;
    priceMin: string;
    priceMax: string;
    creatorAddress: string;
    sortBy: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
}

interface SearchFilterBarProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    onClearFilters: () => void;
}

export function SearchFilterBar({ filters, onFiltersChange, onClearFilters }: SearchFilterBarProps) {
    const { t } = useLanguage();
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const hasActiveFilters =
        filters.searchQuery ||
        filters.priceMin ||
        filters.priceMax ||
        filters.creatorAddress ||
        filters.sortBy !== 'name-asc';

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            {/* Search Bar - Minimalist Line Style */}
            <div className="relative flex items-center gap-4 group">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <Input
                    placeholder={t('shop.searchPlaceholder')}
                    value={filters.searchQuery}
                    onChange={(e) =>
                        onFiltersChange({ ...filters, searchQuery: e.target.value })
                    }
                    className="flex-1 h-12 bg-transparent border-0 border-b border-border rounded-none px-0 text-lg focus-visible:ring-0 focus-visible:border-foreground placeholder:text-muted-foreground/50 transition-all font-light"
                />

                <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-10 w-10 hover:bg-transparent hover:text-foreground transition-colors ${isFilterOpen ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                            <SlidersHorizontal className="h-5 w-5" />
                        </Button>
                    </CollapsibleTrigger>
                </Collapsible>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClearFilters}
                        className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Advanced Filters */}
            <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <CollapsibleContent className="pt-6 pb-2 animate-accordion-down">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Sort */}
                        <div className="space-y-3">
                            <Label htmlFor="sort" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t('shop.sortBy')}</Label>
                            <Select
                                value={filters.sortBy}
                                onValueChange={(value: any) =>
                                    onFiltersChange({ ...filters, sortBy: value })
                                }
                            >
                                <SelectTrigger id="sort" className="w-full h-10 border-0 border-b border-border rounded-none px-0 focus:ring-0 text-sm bg-transparent">
                                    <SelectValue placeholder={t('shop.sortBy') + "..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name-asc">{t('shop.nameAsc')}</SelectItem>
                                    <SelectItem value="name-desc">{t('shop.nameDesc')}</SelectItem>
                                    <SelectItem value="price-asc">{t('shop.priceLowHigh')}</SelectItem>
                                    <SelectItem value="price-desc">{t('shop.priceHighLow')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Price Range */}
                        <div className="space-y-3">
                            <Label htmlFor="priceMin" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t('shop.minPrice')}</Label>
                            <div className="flex items-center">
                                <span className="text-sm mr-2 text-muted-foreground">SUI</span>
                                <Input
                                    id="priceMin"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    placeholder="0.0"
                                    value={filters.priceMin}
                                    onChange={(e) =>
                                        onFiltersChange({ ...filters, priceMin: e.target.value })
                                    }
                                    className="h-10 border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground bg-transparent"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="priceMax" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t('shop.maxPrice')}</Label>
                            <div className="flex items-center">
                                <span className="text-sm mr-2 text-muted-foreground">SUI</span>
                                <Input
                                    id="priceMax"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    placeholder="Any"
                                    value={filters.priceMax}
                                    onChange={(e) =>
                                        onFiltersChange({ ...filters, priceMax: e.target.value })
                                    }
                                    className="h-10 border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground bg-transparent"
                                />
                            </div>
                        </div>

                        {/* Creator Filter */}
                        <div className="space-y-3">
                            <Label htmlFor="creator" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t('shop.creator')}</Label>
                            <Input
                                id="creator"
                                placeholder={t('shop.creatorDesc')}
                                value={filters.creatorAddress}
                                onChange={(e) =>
                                    onFiltersChange({ ...filters, creatorAddress: e.target.value })
                                }
                                className="h-10 border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground bg-transparent"
                            />
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                    {filters.searchQuery && (
                        <div className="text-xs bg-foreground text-background px-3 py-1 rounded-full flex items-center gap-2">
                            {filters.searchQuery}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, searchQuery: '' })} />
                        </div>
                    )}
                    {(filters.priceMin || filters.priceMax) && (
                        <div className="text-xs border border-border px-3 py-1 rounded-full flex items-center gap-2">
                            {filters.priceMin || '0'} - {filters.priceMax || '∞'} SUI
                            <X className="w-3 h-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, priceMin: '', priceMax: '' })} />
                        </div>
                    )}
                    {filters.creatorAddress && (
                        <div className="text-xs border border-border px-3 py-1 rounded-full flex items-center gap-2">
                            Creator: {filters.creatorAddress.slice(0, 6)}...
                            <X className="w-3 h-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, creatorAddress: '' })} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
