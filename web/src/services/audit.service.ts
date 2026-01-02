import { createSupabaseServerClient } from '@/lib/supabase-server'

export type ShopAction =
    | 'APPROVE'
    | 'SUSPEND'
    | 'UNSUSPEND'
    | 'UPDATE_NOTE'
    | 'SELLER_CREATE'
    | 'SELLER_UPDATE'

export async function logShopAction(
    shopId: string,
    action: ShopAction,
    adminWallet: string,
    note?: string,
    fromStatus?: string,
    toStatus?: string
) {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.from('shop_audit_logs').insert({
        shop_id: shopId,
        action,
        admin_wallet: adminWallet,
        note,
        from_status: fromStatus,
        to_status: toStatus
    })

    if (error) {
        console.error('Failed to write audit log:', error)
    }
}
