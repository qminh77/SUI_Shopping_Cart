import { createSupabaseServerClient } from '@/lib/supabase-server'
import { logShopAction } from './audit.service'

export type OrderStatus = 'PAID' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

export interface CreateOrderInput {
    transaction_digest: string
    buyer_wallet: string
    seller_wallet: string
    total_price: number
    shipping_address: {
        fullName: string
        phone: string
        address: string
        city: string
    }
    items: {
        product_id: string
        product_name: string
        quantity: number
        price: number
    }[]
}

export async function createOrder(data: CreateOrderInput) {
    const supabase = await createSupabaseServerClient()

    // 1. Create Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            transaction_digest: data.transaction_digest,
            buyer_wallet: data.buyer_wallet,
            seller_wallet: data.seller_wallet,
            total_price: data.total_price,
            shipping_address: data.shipping_address,
            status: 'PAID'
        })
        .select()
        .single()

    if (orderError) {
        console.error('Error creating order:', orderError)
        throw orderError
    }

    // 2. Create Order Items
    const items = data.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items)

    if (itemsError) {
        console.error('Error creating order items:', itemsError)
        // Ideally we should rollback here, but Supabase HTTP client doesn't support transactions easily without RPC.
        // For MVP, we log error.
        throw itemsError
    }

    return order
}

export async function getBuyerOrders(wallet: string) {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .eq('buyer_wallet', wallet)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function getSellerOrders(wallet: string) {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .eq('seller_wallet', wallet)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, sellerWallet: string) {
    const supabase = await createSupabaseServerClient()

    // Verify seller owns this order
    const { data: order } = await supabase
        .from('orders')
        .select('seller_wallet')
        .eq('id', orderId)
        .single()

    if (!order || order.seller_wallet !== sellerWallet) {
        throw new Error('Unauthorized or Order not found')
    }

    const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

    if (error) throw error

    return true
}
