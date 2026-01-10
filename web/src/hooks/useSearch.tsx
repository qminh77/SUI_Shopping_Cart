'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchProducts, getSearchSuggestions, getProductsByCategory, getProductsWithCategory } from '@/services/search.service';
import { Product, SearchParams, SearchResult } from '@/lib/sui-utils';

/**
 * Hook for product search and filtering
 */
export function useSearch(initialParams: SearchParams = {}) {
    const [params, setParams] = useState<SearchParams>({
        query: '',
        categoryId: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        sortBy: 'newest',
        inStockOnly: true,
        limit: 50,
        offset: 0,
        ...initialParams
    });

    // Main search query
    const { data: searchResult, isLoading, error, refetch } = useQuery<SearchResult>({
        queryKey: ['search', params],
        queryFn: () => searchProducts(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000,
    });

    // Search suggestions
    const { data: suggestions = [] } = useQuery<string[]>({
        queryKey: ['search-suggestions', params.query],
        queryFn: () => getSearchSuggestions(params.query || '', 5),
        enabled: !!params.query && params.query.length >= 2,
        staleTime: 5 * 60 * 1000,
    });

    // Update search query
    const updateSearch = useCallback((query: string) => {
        setParams(prev => ({ ...prev, query, offset: 0 }));
    }, []);

    // Update filters
    const updateFilters = useCallback((newFilters: Partial<SearchParams>) => {
        setParams(prev => ({ ...prev, ...newFilters, offset: 0 }));
    }, []);

    // Update category filter
    const updateCategory = useCallback((categoryId: string | undefined) => {
        setParams(prev => ({ ...prev, categoryId, offset: 0 }));
    }, []);

    // Update price range
    const updatePriceRange = useCallback((minPrice: number | undefined, maxPrice: number | undefined) => {
        setParams(prev => ({ ...prev, minPrice, maxPrice, offset: 0 }));
    }, []);

    // Update sort
    const updateSort = useCallback((sortBy: SearchParams['sortBy']) => {
        setParams(prev => ({ ...prev, sortBy, offset: 0 }));
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setParams({
            query: '',
            categoryId: undefined,
            minPrice: undefined,
            maxPrice: undefined,
            sortBy: 'newest',
            inStockOnly: true,
            limit: 50,
            offset: 0
        });
    }, []);

    // Load more (pagination)
    const loadMore = useCallback(() => {
        setParams(prev => ({
            ...prev,
            offset: (prev.offset || 0) + (prev.limit || 50)
        }));
    }, []);

    // Reset to first page
    const resetPagination = useCallback(() => {
        setParams(prev => ({ ...prev, offset: 0 }));
    }, []);

    return {
        // Data
        products: searchResult?.products || [],
        total: searchResult?.total || 0,
        hasMore: searchResult?.hasMore || false,
        suggestions,

        // State
        params,
        isLoading,
        error,

        // Actions
        updateSearch,
        updateFilters,
        updateCategory,
        updatePriceRange,
        updateSort,
        clearFilters,
        loadMore,
        resetPagination,
        refetch
    };
}

/**
 * Hook to search with debouncing
 */
export function useDebouncedSearch(initialQuery: string = '', delay: number = 300) {
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const [query, setQuery] = useState(initialQuery);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, delay);

        return () => clearTimeout(timer);
    }, [query, delay]);

    const search = useSearch({ query: debouncedQuery });

    return {
        ...search,
        query,
        setQuery,
        debouncedQuery
    };
}

/**
 * Hook to get products by category
 */
export function useProductsByCategory(categoryId: string | null, includeSubcategories: boolean = true) {
    return useQuery<Product[]>({
        queryKey: ['products', 'category', categoryId, includeSubcategories],
        queryFn: () => categoryId ? getProductsByCategory(categoryId, includeSubcategories) : Promise.resolve([]),
        enabled: !!categoryId,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to get products with category info
 */
export function useProductsWithCategory(limit: number = 50) {
    return useQuery<Product[]>({
        queryKey: ['products', 'with-category', limit],
        queryFn: () => getProductsWithCategory(limit),
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}
