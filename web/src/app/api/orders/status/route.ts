import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/services/order.service';

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, status, sellerWallet } = body;

        if (!orderId || !status || !sellerWallet) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const success = await updateOrderStatus(orderId, status, sellerWallet);
        return NextResponse.json({ success });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update order status' },
            { status: 500 }
        );
    }
}
