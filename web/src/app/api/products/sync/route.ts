import { NextRequest, NextResponse } from 'next/server';
import { SuiClient } from '@mysten/sui/client';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { parseProduct, PACKAGE_ID } from '@/lib/sui-utils';

/**
 * API Route: Sync product from blockchain to Supabase
 * 
 * POST /api/products/sync
 * Body: { productId: string, categoryId?: string }
 * 
 * This endpoint fetches a product from the SUI blockchain and saves/updates
 * it in the Supabase database for fast querying and search.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productId, categoryId } = body;

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        // Initialize SUI client
        const suiClient = new SuiClient({
            url: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443'
        });

        // Fetch product from blockchain
        const productObj = await suiClient.getObject({
            id: productId,
            options: {
                showContent: true,
                showOwner: true
            }
        });

        // Parse product data
        const product = parseProduct(productObj);

        if (!product) {
            return NextResponse.json(
                { error: 'Failed to parse product from blockchain' },
                { status: 404 }
            );
        }

        // Initialize Supabase client (with service role key for RLS bypass)
        const supabase = await createSupabaseServerClient();

        // Prepare product data for Supabase
        const productData = {
            id: product.id,
            shop_id: product.shopId,
            creator_wallet: product.creator, // NEW: Store creator wallet
            seller_wallet: product.creator,  // NEW: Store seller wallet (same as creator for retail products)
            name: product.name,
            description: product.description || '',
            image_url: product.imageUrl || '',
            price: product.price,
            stock: product.stock,
            category_id: categoryId || null,
            on_chain_created_at: product.createdAt,
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced'
        };

        // Upsert product to Supabase (insert or update if exists)
        const { data, error } = await supabase
            .from('products')
            .upsert(productData, {
                onConflict: 'id',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase upsert error:', error);
            return NextResponse.json(
                { error: 'Failed to sync product to database', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Product synced successfully',
            product: data
        });

    } catch (error) {
        console.error('Product sync error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
