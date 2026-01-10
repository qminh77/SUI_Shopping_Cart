'use client';

import { useQuery } from '@tanstack/react-query';
import {
    getAllCategories,
    getCategoryBySlug,
    getCategoryById,
    getTopLevelCategories,
    getSubcategories,
    getCategoriesWithCounts,
    getCategoryTree,
    getCategoryOptions,
    getCategoryBreadcrumb,
    getCategoryWithDescendants
} from '@/services/categories.service';
import { Category, CategoryTree, CategoryOption } from '@/lib/sui-utils';

/**
 * Hook to fetch all categories
 */
export function useCategories() {
    return useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: getAllCategories,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Hook to fetch top-level categories
 */
export function useTopLevelCategories() {
    return useQuery<Category[]>({
        queryKey: ['categories', 'top-level'],
        queryFn: getTopLevelCategories,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch category by slug
 */
export function useCategoryBySlug(slug: string | null) {
    return useQuery<Category | null>({
        queryKey: ['category', 'slug', slug],
        queryFn: () => (slug ? getCategoryBySlug(slug) : Promise.resolve(null)),
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch category by ID
 */
export function useCategoryById(id: string | null) {
    return useQuery<Category | null>({
        queryKey: ['category', 'id', id],
        queryFn: () => (id ? getCategoryById(id) : Promise.resolve(null)),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch subcategories
 */
export function useSubcategories(parentId: string | null) {
    return useQuery<Category[]>({
        queryKey: ['categories', 'subcategories', parentId],
        queryFn: () => (parentId ? getSubcategories(parentId) : Promise.resolve([])),
        enabled: !!parentId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch categories with counts
 */
export function useCategoriesWithCounts() {
    return useQuery({
        queryKey: ['categories', 'with-counts'],
        queryFn: getCategoriesWithCounts,
        staleTime: 3 * 60 * 1000, // 3 minutes (product counts may change)
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch category tree
 */
export function useCategoryTree() {
    return useQuery<CategoryTree[]>({
        queryKey: ['categories', 'tree'],
        queryFn: getCategoryTree,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch category options for dropdowns
 */
export function useCategoryOptions() {
    return useQuery<CategoryOption[]>({
        queryKey: ['categories', 'options'],
        queryFn: getCategoryOptions,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch category breadcrumb
 */
export function useCategoryBreadcrumb(categoryId: string | null) {
    return useQuery<Category[]>({
        queryKey: ['category', 'breadcrumb', categoryId],
        queryFn: () => (categoryId ? getCategoryBreadcrumb(categoryId) : Promise.resolve([])),
        enabled: !!categoryId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch category with descendants (for filtering)
 */
export function useCategoryWithDescendants(categoryId: string | null) {
    return useQuery<string[]>({
        queryKey: ['category', 'descendants', categoryId],
        queryFn: () => (categoryId ? getCategoryWithDescendants(categoryId) : Promise.resolve([])),
        enabled: !!categoryId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
