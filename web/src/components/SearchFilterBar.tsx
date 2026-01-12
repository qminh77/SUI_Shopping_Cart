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
import { Card, CardContent } from '@/components/ui/card';
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
        <Card>
            <CardContent className="p-4 space-y-4">
                {/* Search Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('shop.searchPlaceholder')}
                            value={filters.searchQuery}
                            onChange={(e) =>
                                onFiltersChange({ ...filters, searchQuery: e.target.value })
                            }
                            className="pl-9"
                        />
                    </div>
                    <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" size="icon">
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                        </CollapsibleTrigger>
                    </Collapsible>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="icon" onClick={onClearFilters}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Advanced Filters */}
                <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <CollapsibleContent className="space-y-4 pt-2">
                        {/* Sort */}
                        <div className="space-y-2">
                            <Label htmlFor="sort">{t('shop.sortBy')}</Label>
                            <Select
                                value={filters.sortBy}
                                onValueChange={(value: any) =>
                                    onFiltersChange({ ...filters, sortBy: value })
                                }
                            >
                                <SelectTrigger id="sort">
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priceMin">{t('shop.minPrice')} (SUI)</Label>
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priceMax">{t('shop.maxPrice')} (SUI)</Label>
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
                                />
                            </div>
                        </div>

                        {/* Creator Filter */}
                        <div className="space-y-2">
                            <Label htmlFor="creator">{t('shop.creator')}</Label>
                            <Input
                                id="creator"
                                placeholder="0x..."
                                value={filters.creatorAddress}
                                onChange={(e) =>
                                    onFiltersChange({ ...filters, creatorAddress: e.target.value })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('shop.creatorDesc')}
                            </p>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                        <span className="font-medium">{t('shop.activeFilters')}:</span>
                        {filters.searchQuery && (
                            <span className="bg-muted px-2 py-1 rounded">
                                {t('shop.search')}: "{filters.searchQuery}"
                            </span>
                        )}
                        {filters.priceMin && (
                            <span className="bg-muted px-2 py-1 rounded">
                                {t('shop.minPrice')}: {filters.priceMin} SUI
                            </span>
                        )}
                        {filters.priceMax && (
                            <span className="bg-muted px-2 py-1 rounded">
                                {t('shop.maxPrice')}: {filters.priceMax} SUI
                            </span>
                        )}
                        {filters.creatorAddress && (
                            <span className="bg-muted px-2 py-1 rounded">
                                {t('shop.categories')}: {filters.creatorAddress.slice(0, 8)}...
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
