import { NextRequest, NextResponse } from 'next/server'
import { createShop } from '@/services/shop.service'
import { z, ZodError } from 'zod'

// Basic schema for validation
const shopSchema = z.object({
    owner_wallet: z.string(),
    shop_name: z.string().min(3).max(80),
    shop_description: z.string().min(20).max(500),
    business_type: z.enum(['PERSONAL', 'BUSINESS']),
    tax_code: z.string().optional(),
    established_year: z.number().int().min(1900).max(new Date().getFullYear()),
    contact_email: z.string().email(),
    contact_phone: z.string().min(9).max(11),
    address_city: z.string(),
    address_detail: z.string(),
    website: z.string().url().optional().or(z.literal('')),
    logo_url: z.string().url().optional().or(z.literal('')),
    facebook_url: z.string().url().optional().or(z.literal('')),
    instagram_url: z.string().url().optional().or(z.literal('')),
    support_policy: z.string().optional(),
    return_policy: z.string().optional(),
    warranty_policy: z.string().optional(),
    legal_docs_urls: z.array(z.string().url()).optional(),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log('Received shop creation request:', JSON.stringify(body, null, 2))

        // Validate input
        const validatedData = shopSchema.parse(body)

        // Business rule: Tax code required if BUSINESS
        if (validatedData.business_type === 'BUSINESS' && !validatedData.tax_code) {
            return NextResponse.json({ error: 'Tax code is required for Business type' }, { status: 400 })
        }

        const shop = await createShop(validatedData)
        return NextResponse.json(shop, { status: 201 })
    } catch (error) {
        if (error instanceof ZodError) {
            console.error('Validation error:', error.issues)
            return NextResponse.json({
                error: 'Validation Error',
                details: error.issues,
                message: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            }, { status: 400 })
        }
        console.error('Create shop error:', error)
        const message = error instanceof Error ? error.message : 'Failed to create shop'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
