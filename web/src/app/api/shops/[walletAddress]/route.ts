import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * API Route: Get shop information by wallet address
 * 
 * GET /api/shops/[walletAddress]
 * 
 * Returns shop details from Supabase database including:
 * - Shop name, description, logo
 * - Contact information
 * - Policies (support, return, warranty)
 * - Status and metadata
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ walletAddress: string }> }
) {
    try {
        const { walletAddress } = await params;

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Validate wallet address format (basic check)
        if (!walletAddress.startsWith('0x') || walletAddress.length !== 66) {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        // Initialize Supabase client
        const supabase = await createSupabaseServerClient();

        console.log(`[API /api/shops/${walletAddress}] Fetching shop for wallet:`, walletAddress);

        // Fetch shop from database by owner_wallet
        // Use maybeSingle to avoid throwing error when not found
        const { data: shop, error } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_wallet', walletAddress)
            .maybeSingle();

        if (error) {
            console.error('[API /api/shops] Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch shop data', details: error.message },
                { status: 500 }
            );
        }

        // If shop not found in database, return 404 with helpful message
        if (!shop) {
            console.log(`[API /api/shops] Shop not found for wallet: ${walletAddress}`);
            return NextResponse.json(
                {
                    error: 'Shop not found',
                    message: 'This seller has not registered a shop yet. They may be selling as an individual.',
                    wallet: walletAddress
                },
                { status: 404 }
            );
        }

        // Return shop data
        return NextResponse.json({
            success: true,
            shop: shop
        });

    } catch (error) {
        console.error('Shop fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
