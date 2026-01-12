import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * API Route: Get Seller's Products
 * 
 * GET /api/seller/products?wallet=0x...
 * 
 * Fetches all products belonging to the shop owned by the given wallet.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();

        // Query products by seller_wallet (not shop_id, which is now the on-chain shop object ID)
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
                *,
                categories (
                    id,
                    name,
                    icon
                )
            `)
            .eq('seller_wallet', wallet)
            .order('created_at', { ascending: false });

        if (productsError) {
            console.error('Error fetching seller products:', productsError);
            return NextResponse.json(
                { error: 'Failed to fetch products' },
                { status: 500 }
            );
        }

        // Transform to match the frontend expected format if needed
        // The frontend currently expects:
        // { id, name, description, imageUrl, price, stock, shopId, creator, status }

        const formattedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            imageUrl: p.image_url,
            price: Number(p.price),
            stock: p.stock,
            shopId: p.shop_id,
            status: 'RETAIL', // Assuming retail for now as per previous logic
            createdAt: p.created_at,
            category: p.categories ? {
                id: p.categories.id,
                name: p.categories.name,
                icon: p.categories.icon
            } : null
        }));

        return NextResponse.json(formattedProducts);

    } catch (error) {
        console.error('Seller products API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/seller/products
 * Updates product metadata in Supabase
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, description, price, stock, imageUrl, categoryId } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();

        // Update product
        const { error } = await supabase
            .from('products')
            .update({
                name,
                description,
                price,
                stock,
                image_url: imageUrl,
                category_id: categoryId,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating product:', error);
            return NextResponse.json(
                { error: 'Failed to update product' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update product API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/seller/products
 * 删除 product from Supabase (or soft delete)
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();

        // Delete product
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting product:', error);
            return NextResponse.json(
                { error: 'Failed to delete product' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete product API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
