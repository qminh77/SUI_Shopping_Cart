import { createSupabaseServerClient } from '@/lib/supabase-server'
import { logShopAction, ShopAction } from './audit.service'

export type ShopStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'

export interface CreateShopInput {
    owner_wallet: string
    shop_name: string
    shop_description: string
    business_type: 'PERSONAL' | 'BUSINESS'
    tax_code?: string
    established_year: number
    website?: string
    contact_email: string
    contact_phone: string
    address_city: string
    address_detail: string
    logo_url?: string
    facebook_url?: string
    instagram_url?: string
    support_policy?: string
    return_policy?: string
    warranty_policy?: string
    legal_docs_urls?: string[]
}

export interface UpdateShopInput extends Partial<CreateShopInput> { }

export async function createShop(data: CreateShopInput) {
    const supabase = await createSupabaseServerClient()

    // Check if owner already has a shop
    const { data: existing } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_wallet', data.owner_wallet)
        .single()

    if (existing) {
        throw new Error('User already has a shop')
    }

    const { data: shop, error } = await supabase
        .from('shops')
        .insert({
            ...data,
            status: 'PENDING'
        })
        .select()
        .single()

    if (error) throw error

    // Log creation
    await logShopAction(shop.id, 'SELLER_CREATE', 'SELLER')

    return shop
}

export async function getShopByWallet(wallet: string) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_wallet', wallet)
        .single()

    if (error && error.code !== 'PGRST116') throw error // Ignore 'Row not found'
    return data
}

export async function updateShop(wallet: string, data: UpdateShopInput) {
    const supabase = await createSupabaseServerClient()

    // Get current shop to check status
    const currentShop = await getShopByWallet(wallet)
    if (!currentShop) throw new Error('Shop not found')

    if (currentShop.status === 'ACTIVE') {
        // Prompt: "Nếu ACTIVE -> chặn sửa các field quan trọng"
        // For MVP, blocking critical fields logic here.
        // We'll allow non-critical updates.
        // Critical: tax_code, business_type
        if (data.tax_code || data.business_type) {
            throw new Error('Cannot update Tax Code or Business Type while Shop is ACTIVE')
        }
    }

    const { data: updated, error } = await supabase
        .from('shops')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('owner_wallet', wallet)
        .select()
        .single()

    if (error) throw error

    await logShopAction(updated.id, 'SELLER_UPDATE', 'SELLER')

    return updated
}

// ADMIN FUNCTIONS

export async function getShops(
    page: number = 1,
    limit: number = 20,
    status?: string,
    search?: string
) {
    const supabase = await createSupabaseServerClient()
    let query = supabase.from('shops').select('*', { count: 'exact' })

    if (status) {
        query = query.eq('status', status)
    }

    if (search) {
        // Search by shop_name, tax_code, or owner_wallet
        query = query.or(`shop_name.ilike.%${search}%,tax_code.ilike.%${search}%,owner_wallet.ilike.%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false })

    if (error) throw error

    return { data, count, page, limit }
}

export async function getShopById(id: string) {
    const supabase = await createSupabaseServerClient()
    const { data: shop, error } = await supabase.from('shops').select('*').eq('id', id).single()
    if (error) throw error

    const { data: logs } = await supabase
        .from('shop_audit_logs')
        .select('*')
        .eq('shop_id', id)
        .order('created_at', { ascending: false })

    return { shop, logs }
}

export async function updateShopStatus(
    shopId: string,
    newStatus: ShopStatus,
    adminWallet: string,
    reason?: string,
    currentStatus?: string
) {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
        .from('shops')
        .update({ status: newStatus, admin_note: reason, updated_at: new Date().toISOString() })
        .eq('id', shopId)

    if (error) throw error

    // Log logic based on status change
    let action: ShopAction = 'UPDATE_NOTE'
    if (newStatus === 'ACTIVE' && currentStatus === 'PENDING') action = 'APPROVE'
    else if (newStatus === 'ACTIVE' && currentStatus === 'SUSPENDED') action = 'UNSUSPEND'
    else if (newStatus === 'SUSPENDED') action = 'SUSPEND'

    await logShopAction(shopId, action, adminWallet, reason, currentStatus, newStatus)
}
