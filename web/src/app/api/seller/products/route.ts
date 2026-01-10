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

        // 2. Get Products for this Shop (shop_id in products table is the wallet address)
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', wallet)
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
            createdAt: p.created_at
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
