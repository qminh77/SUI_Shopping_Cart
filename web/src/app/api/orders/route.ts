import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getBuyerOrders, getSellerOrders } from '@/services/order.service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const order = await createOrder(body);
        return NextResponse.json(order);
    } catch (error: any) {
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
            return NextResponse.json({ error: 'Missing wallet or role' }, { status: 400 });
        }

        let orders;
        if (role === 'buyer') {
            orders = await getBuyerOrders(wallet);
        } else if (role === 'seller') {
            orders = await getSellerOrders(wallet);
        } else {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        return NextResponse.json(orders);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
