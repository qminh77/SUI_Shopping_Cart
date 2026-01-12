import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/services/order.service';

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, status, sellerWallet } = body;

        if (!orderId || !status || !sellerWallet) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId, status, and sellerWallet are required' },
                { status: 400 }
            );
        }

        // Validate status enum
        const validStatuses = ['PAID', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        let success;
        try {
            success = await updateOrderStatus(orderId, status, sellerWallet);
        } catch (dbError: any) {
            console.error('[API /orders/status PUT] Database error:', dbError);

            // Handle RLS policy violations
            if (dbError.code === 'PGRST301' || dbError.message?.includes('RLS')) {
                return NextResponse.json(
                    { error: 'Permission denied. You can only update orders from your own shop.' },
                    { status: 403 }
                );
            }

            throw dbError;
        }

        return NextResponse.json({ success });
    } catch (error: any) {
        console.error('[API /orders/status PUT] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update order status' },
            { status: 500 }
        );
    }
}
