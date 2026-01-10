'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useShop } from '@/hooks/useShop'
import { Loader2, Store } from 'lucide-react'

const shopFormSchema = z.object({
    shop_name: z.string().min(3, 'At least 3 characters').max(80),
    shop_description: z.string().min(20, 'At least 20 characters').max(500),
    business_type: z.enum(['PERSONAL', 'BUSINESS']),
    tax_code: z.string().optional(),
    established_year: z.coerce.number().min(1900).max(new Date().getFullYear()),
    contact_email: z.string().email(),
    contact_phone: z.string().min(9).max(11),
    address_city: z.string().min(1, 'Required'),
    address_detail: z.string().min(1, 'Required'),
    website: z.string().url().optional().or(z.literal('')),
    logo_url: z.string().url().optional().or(z.literal('')),
    facebook_url: z.string().url().optional().or(z.literal('')),
    instagram_url: z.string().url().optional().or(z.literal('')),
    support_policy: z.string().optional(),
    return_policy: z.string().optional(),
    warranty_policy: z.string().optional(),
})

type ShopFormValues = z.infer<typeof shopFormSchema>

export default function CreateShopForm() {
    const { createShop } = useShop()

    const form = useForm<ShopFormValues>({
        resolver: zodResolver(shopFormSchema) as any,
        defaultValues: {
            shop_name: '',
            shop_description: '',
            business_type: 'PERSONAL',
            established_year: new Date().getFullYear(),
            contact_email: '',
            contact_phone: '',
            address_city: '',
            address_detail: '',
            tax_code: '',
            website: '',
            logo_url: '',
            facebook_url: '',
            instagram_url: '',
        },
    })

    const businessType = form.watch('business_type')

    async function onSubmit(data: ShopFormValues) {
        if (data.business_type === 'BUSINESS' && !data.tax_code) {
            form.setError('tax_code', { message: 'Required for Business' })
            return
        }

        const cleanData = Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v])
        )

        try {
            await createShop.mutateAsync(cleanData)
        } catch (error) {
            // Handled by hook
        }
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center space-y-3 pb-6">
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Store className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Register Your Shop</h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Fill in the details below to start selling on the marketplace
                        </p>
                    </div>

                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Required information about your shop</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="shop_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Shop Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="My Awesome Store" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="shop_description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell us about your shop..."
                                                rows={4}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="business_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PERSONAL">Personal (Individual)</SelectItem>
                                                    <SelectItem value="BUSINESS">Business (Enterprise)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="established_year"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Established Year</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>How customers can reach you</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contact_email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="contact@shop.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contact_phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0901234567" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address_city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City/Province</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ho Chi Minh City" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address_detail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Detailed Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Street Name, District 1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Legal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Legal Information</CardTitle>
                            <CardDescription>Tax and business registration details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="tax_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Tax Code {businessType === 'BUSINESS' && <span className="text-destructive">*</span>}
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tax ID" {...field} />
                                        </FormControl>
                                        <FormDescription>Required for Business accounts</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Branding & Socials */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Branding & Social Media</CardTitle>
                            <CardDescription>Optional - Help customers find you online</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://myshop.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="facebook_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Facebook</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://facebook.com/myshop" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="instagram_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Instagram</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://instagram.com/myshop" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Policies */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shop Policies</CardTitle>
                            <CardDescription>Optional - Set clear expectations with customers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="return_policy"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Return Policy</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="30 days return..." rows={3} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={createShop.isPending}
                    >
                        {createShop.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Registration
                    </Button>
                </form>
            </Form>
        </div>
    )
}
