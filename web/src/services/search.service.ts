import { supabase } from './categories.service';
import { Product, SearchParams, SearchResult, suiToMist, mistToSui } from '@/lib/sui-utils';

/**
 * Search products using Supabase full-text search
 */
export async function searchProducts(params: SearchParams): Promise<SearchResult> {
    const {
        query = '',
        categoryId,
        minPrice,
        maxPrice,
        sortBy = 'newest',
        inStockOnly = true,
        limit = 50,
        offset = 0
    } = params;

    try {
        // Use Supabase RPC function for full-text search
        const { data, error } = await supabase.rpc('search_products', {
            search_query: query || null,
            category_filter: categoryId || null,
            min_price: minPrice || null,
            max_price: maxPrice || null,
            result_limit: limit
        });

        if (error) {
            console.error('Search error:', error);
            return {
                products: [],
                total: 0,
                hasMore: false,
                filters: params
            };
        }

        // Transform database results to Product type
        const products: Product[] = (data || []).map((item: any) => ({
            id: item.id,
            shopId: item.shop_id || '',
            name: item.name,
            description: item.description || '',
            imageUrl: item.image_url || '',
            price: Number(item.price),
            stock: Number(item.stock),
            creator: item.shop_id || '', // Using shop_id as creator
            listed: true,
            createdAt: new Date(item.created_at).getTime(),
            categoryId: item.category_id,
            categoryName: item.category_name,
            categorySlug: item.category_slug,
            categoryIcon: item.category_icon
        }));

        // Apply client-side sorting if needed
        const sortedProducts = applySorting(products, sortBy);

        // Apply pagination
        const paginatedProducts = sortedProducts.slice(offset, offset + limit);

        return {
            products: paginatedProducts,
            total: sortedProducts.length,
            hasMore: sortedProducts.length > offset + limit,
            filters: params
        };

    } catch (error) {
        console.error('Search service error:', error);
        return {
            products: [],
            total: 0,
            hasMore: false,
            filters: params
        };
    }
}

/**
 * Get search suggestions based on query
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
        const { data, error } = await supabase
            .from('products')
            .select('name')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .gt('stock', 0)
            .limit(limit);

        if (error) {
            console.error('Suggestions error:', error);
            return [];
        }

        return data.map(p => p.name);
    } catch (error) {
        console.error('Suggestions service error:', error);
        return [];
    }
}

/**
 * Get products by category (including subcategories)
 */
export async function getProductsByCategory(
    categoryId: string,
    includeSubcategories: boolean = true
): Promise<Product[]> {
    try {
        const { data, error } = await supabase.rpc('get_category_products', {
            p_category_id: categoryId,
            include_subcategories: includeSubcategories
        });

        if (error) {
            console.error('Get category products error:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            shopId: item.shop_id || '',
            name: item.name,
            description: item.description || '',
            imageUrl: item.image_url || '',
            price: Number(item.price),
            stock: Number(item.stock),
            creator: item.shop_id || '',
            listed: true,
            createdAt: new Date(item.created_at).getTime()
        }));

    } catch (error) {
        console.error('Category products service error:', error);
        return [];
    }
}

/**
 * Get products with category information
 */
export async function getProductsWithCategory(limit: number = 50): Promise<Product[]> {
    try {
        const { data, error } = await supabase
            .from('products_with_category')
            .select('*')
            .limit(limit);

        if (error) {
            console.error('Get products with category error:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            shopId: item.shop_id,
            name: item.name,
            description: item.description || '',
            imageUrl: item.image_url || '',
            price: Number(item.price),
            stock: Number(item.stock),
            creator: item.shop_id,
            listed: true,
            createdAt: new Date(item.created_at).getTime(),
            categoryId: item.category_id,
            categoryName: item.category_name,
            categorySlug: item.category_slug,
            categoryIcon: item.category_icon
        }));

    } catch (error) {
        console.error('Products with category service error:', error);
        return [];
    }
}

/**
 * Apply sorting to products array
 */
function applySorting(products: Product[], sortBy: SearchParams['sortBy']): Product[] {
    const sorted = [...products];

    switch (sortBy) {
        case 'price_asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price_desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'newest':
        default:
            return sorted.sort((a, b) => b.createdAt - a.createdAt);
    }
}

/**
 * Get filter options (price range, categories)
 */
export async function getFilterOptions() {
    try {
        // Get price range
        const { data: priceData, error: priceError } = await supabase
            .from('products')
            .select('price')
            .gt('stock', 0);

        if (priceError) throw priceError;

        const prices = (priceData || []).map(p => Number(p.price));
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 10000000000; // 10 SUI in MIST

        return {
            priceRange: {
                min: minPrice,
                max: maxPrice,
                minSui: mistToSui(minPrice),
                maxSui: mistToSui(maxPrice)
            }
        };

    } catch (error) {
        console.error('Get filter options error:', error);
        return {
            priceRange: {
                min: 0,
                max: 10000000000,
                minSui: 0,
                maxSui: 10
            }
        };
    }
}
