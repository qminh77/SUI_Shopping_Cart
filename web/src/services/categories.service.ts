import { createClient } from '@supabase/supabase-js';
import { Category, CategoryTree, CategoryOption } from '@/lib/sui-utils';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get all active categories (flat list)
 */
export async function getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data || [];
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error fetching category by slug:', error);
        return null;
    }

    return data;
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error fetching category by ID:', error);
        return null;
    }

    return data;
}

/**
 * Get top-level categories (no parent)
 */
export async function getTopLevelCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching top-level categories:', error);
        return [];
    }

    return data || [];
}

/**
 * Get subcategories for a parent category
 */
export async function getSubcategories(parentId: string): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching subcategories:', error);
        return [];
    }

    return data || [];
}

/**
 * Get categories with product counts (uses view)
 */
export async function getCategoriesWithCounts() {
    const { data, error } = await supabase
        .from('categories_with_counts')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching categories with counts:', error);
        return [];
    }

    return data || [];
}

/**
 * Build hierarchical category tree
 */
export async function getCategoryTree(): Promise<CategoryTree[]> {
    const allCategories = await getAllCategories();
    const countsData = await getCategoriesWithCounts();

    // Create a map for quick lookup of counts
    const countsMap = new Map(
        countsData.map(c => [c.id, { product_count: c.product_count || 0, subcategory_count: c.subcategory_count || 0 }])
    );

    // Build tree structure
    const categoryMap = new Map<string, CategoryTree>();
    const rootCategories: CategoryTree[] = [];

    // First pass: create all category tree nodes
    allCategories.forEach(cat => {
        const counts = countsMap.get(cat.id) || { product_count: 0, subcategory_count: 0 };
        categoryMap.set(cat.id, {
            ...cat,
            children: [],
            product_count: counts.product_count,
            subcategory_count: counts.subcategory_count
        });
    });

    // Second pass: build parent-child relationships
    allCategories.forEach(cat => {
        const treeNode = categoryMap.get(cat.id)!;

        if (cat.parent_id) {
            const parent = categoryMap.get(cat.parent_id);
            if (parent) {
                parent.children.push(treeNode);
            }
        } else {
            rootCategories.push(treeNode);
        }
    });

    return rootCategories;
}

/**
 * Get categories as options for dropdowns/selects
 */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
    const categories = await getAllCategories();
    const countsData = await getCategoriesWithCounts();

    const countsMap = new Map(
        countsData.map(c => [c.id, c.product_count || 0])
    );

    return categories.map(cat => ({
        value: cat.id,
        label: cat.name,
        icon: cat.icon,
        count: countsMap.get(cat.id) || 0
    }));
}

/**
 * Get breadcrumb trail for a category (from root to current)
 */
export async function getCategoryBreadcrumb(categoryId: string): Promise<Category[]> {
    const breadcrumb: Category[] = [];
    let currentId: string | undefined = categoryId;

    while (currentId) {
        const category = await getCategoryById(currentId);
        if (!category) break;

        breadcrumb.unshift(category); // Add to beginning
        currentId = category.parent_id || undefined;
    }

    return breadcrumb;
}

/**
 * Get all category IDs including subcategories (for filtering)
 */
export async function getCategoryWithDescendants(categoryId: string): Promise<string[]> {
    const ids: string[] = [categoryId];
    const subcategories = await getSubcategories(categoryId);

    for (const sub of subcategories) {
        const subIds = await getCategoryWithDescendants(sub.id);
        ids.push(...subIds);
    }

    return ids;
}
