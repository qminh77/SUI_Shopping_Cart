import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getBuyerOrders, getSellerOrders } from '@/services/order.service';

/**
 * Helper function to safely convert BigInt to Number
 * Prevents JSON serialization errors
 */
function sanitizeOrderData(data: any) {
    return {
        ...data,
        total_price: typeof data.total_price === 'bigint'
            ? Number(data.total_price)
            : data.total_price,
        items: data.items?.map((item: any) => ({
            ...item,
            price: typeof item.price === 'bigint' ? Number(item.price) : item.price
        }))
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Sanitize BigInt values before passing to service
        const sanitizedData = sanitizeOrderData(body);

        const order = await createOrder(sanitizedData);
        return NextResponse.json(order);
    } catch (error: any) {
        console.error('[API /orders POST] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create order' },
            { status: 500 }
        );
    }
}


export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role'); // 'buyer' or 'seller'
        const wallet = searchParams.get('wallet');

        if (!wallet || !role) {
            return NextResponse.json({ error: 'Missing wallet or role parameter' }, { status: 400 });
        }

        let orders;
        try {
            if (role === 'buyer') {
                orders = await getBuyerOrders(wallet);
            } else if (role === 'seller') {
                orders = await getSellerOrders(wallet);
            } else {
                return NextResponse.json({ error: 'Invalid role. Must be "buyer" or "seller"' }, { status: 400 });
            }
        } catch (dbError: any) {
            console.error('[API /orders GET] Database error:', dbError);

            // Handle RLS policy violations specifically
            if (dbError.code === 'PGRST301' || dbError.message?.includes('RLS')) {
                return NextResponse.json(
                    { error: 'Permission denied. Please ensure your wallet is connected correctly.' },
                    { status: 403 }
                );
            }

            throw dbError; // Re-throw to be caught by outer catch
        }

        return NextResponse.json(orders);
    } catch (error: any) {
        console.error('[API /orders GET] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
