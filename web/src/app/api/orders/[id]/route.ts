
import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/services/order.service';

/**
 * Helper function to safely convert BigInt to Number
 * Prevents JSON serialization errors
 */
function sanitizeOrderData(data: any) {
    if (!data) return null;

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

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;

        if (!id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const order = await getOrderById(id);

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const sanitizedOrder = sanitizeOrderData(order);

        return NextResponse.json(sanitizedOrder);
    } catch (error: any) {
        console.error(`[API /orders/[id] GET] Error:`, error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch order details' },
            { status: 500 }
        );
    }
}
