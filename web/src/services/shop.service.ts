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
        .maybeSingle() // Use maybeSingle() instead of single() to avoid throwing on not found

    // Only throw on actual database errors, not on "not found"
    if (error) {
        console.error('[getShopByWallet] Error:', error)
        throw error
    }

    return data // Will be null if not found, which is fine
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

    // ✨ NEW: Protect on_chain_shop_id from being cleared
    // Only allow updating on_chain_shop_id if:
    // 1. Current value is null/empty AND new value is provided, OR
    // 2. New value is explicitly provided and not empty
    const updateData: any = { ...data }

    if ('on_chain_shop_id' in updateData) {
        // If trying to clear the field (set to null/empty)
        if (!updateData.on_chain_shop_id && currentShop.on_chain_shop_id) {
            console.warn('[updateShop] Preventing on_chain_shop_id from being cleared')
            delete updateData.on_chain_shop_id // Remove from update to preserve existing value
        }
        // If setting a new value, validate it's a proper hex string
        else if (updateData.on_chain_shop_id) {
            if (!updateData.on_chain_shop_id.startsWith('0x') || updateData.on_chain_shop_id.length !== 66) {
                throw new Error('Invalid on_chain_shop_id format. Must be a 66-character hex string starting with 0x')
            }
        }
    }

    const { data: updated, error } = await supabase
        .from('shops')
        .update({
            ...updateData,
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

    // ✨ NEW: If approving a shop, verify it has on_chain_shop_id
    if (newStatus === 'ACTIVE' && currentStatus === 'PENDING') {
        const { data: shop } = await supabase
            .from('shops')
            .select('on_chain_shop_id, owner_wallet')
            .eq('id', shopId)
            .single()

        if (!shop?.on_chain_shop_id) {
            console.warn(`[updateShopStatus] Shop ${shopId} is being approved but has no on_chain_shop_id`)
            console.warn(`[updateShopStatus] Seller will need to use "Sync Shop to Blockchain" button`)
            // We allow approval to proceed, but log warning
            // The seller can manually sync from their dashboard
        }
    }

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
