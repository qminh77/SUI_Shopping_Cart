'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Ban, History, Unlock, Loader2, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

// Types
type ShopDetail = {
    shop: any // Using any for speed, ideally interface
    logs: any[]
}

export default function AdminShopDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [suspendReason, setSuspendReason] = useState('')
    const [isSuspendOpen, setIsSuspendOpen] = useState(false)
    const [isLoadingAction, setIsLoadingAction] = useState(false)

    const { data, isLoading, isError } = useQuery<ShopDetail>({
        queryKey: ['admin-shop', id],
        queryFn: async () => {
            const res = await fetch(`/api/admin/shops/${id}`)
            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    // Actions
    const handleAction = async (action: 'approve' | 'suspend' | 'unsuspend', payload: any = {}) => {
        try {
            setIsLoadingAction(true)
            const res = await fetch(`/api/admin/shops/${id}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentStatus: data?.shop.status,
                    ...payload
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error)
            }

            toast.success(`Shop ${action} successful`)
            queryClient.invalidateQueries({ queryKey: ['admin-shop', id] })
            if (action === 'suspend') setIsSuspendOpen(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoadingAction(false)
        }
    }

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
    if (isError || !data) return <div className="text-center py-20">Shop not found</div>

    const { shop, logs } = data

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/shops"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">{shop.shop_name}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <span className="font-mono text-xs">{shop.id}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <Badge variant={shop.status === 'ACTIVE' ? 'default' : shop.status === 'SUSPENDED' ? 'destructive' : 'secondary'}>
                            {shop.status}
                        </Badge>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {shop.status === 'PENDING' && (
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction('approve')}
                            disabled={isLoadingAction}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Shop
                        </Button>
                    )}

                    {shop.status === 'ACTIVE' && (
                        <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    <Ban className="mr-2 h-4 w-4" />
                                    Suspend Shop
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Suspend Shop</DialogTitle>
                                    <DialogDescription>
                                        This will disable selling capabilities for this shop. Reasoning is required.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 py-4">
                                    <Label>Reason for suspension</Label>
                                    <Textarea
                                        placeholder="Violation of terms..."
                                        value={suspendReason}
                                        onChange={(e) => setSuspendReason(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsSuspendOpen(false)}>Cancel</Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleAction('suspend', { reason: suspendReason })}
                                        disabled={!suspendReason.trim() || isLoadingAction}
                                    >
                                        Suspend Confirmed
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {shop.status === 'SUSPENDED' && (
                        <Button
                            variant="default" // or a specific "unsuspend" color
                            onClick={() => handleAction('unsuspend')}
                            disabled={isLoadingAction}
                        >
                            <Unlock className="mr-2 h-4 w-4" />
                            Unsuspend Shop
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="info">Information</TabsTrigger>
                    <TabsTrigger value="history">History & Audit</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem label="Owner Wallet" value={shop.owner_wallet} mono />
                                <InfoItem label="Email" value={shop.contact_email} />
                                <InfoItem label="Phone" value={shop.contact_phone} />
                                <InfoItem label="Business Type" value={shop.business_type} />
                                <InfoItem label="Tax Code" value={shop.tax_code || 'N/A'} />
                                <InfoItem label="Established" value={shop.established_year} />
                                <InfoItem label="Address" value={`${shop.address_detail}, ${shop.address_city}`} className="md:col-span-2" />
                                <InfoItem label="Website" value={shop.website} isLink />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Policies & Socials</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem label="Facebook" value={shop.facebook_url} isLink />
                                <InfoItem label="Instagram" value={shop.instagram_url} isLink />
                                <InfoItem label="Support Policy" value={shop.support_policy} className="md:col-span-2" />
                                <InfoItem label="Return Policy" value={shop.return_policy} className="md:col-span-2" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Audit Logs</CardTitle>
                            <CardDescription>Record of administrative actions and shop updates.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l border-muted ml-2 space-y-6 pb-4">
                                {logs.length === 0 && <div className="pl-6 text-sm text-muted-foreground">No history recorded</div>}
                                {logs.map((log) => (
                                    <div key={log.id} className="relative pl-6">
                                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-primary bg-background ring-4 ring-background" />
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">{formatAction(log.action)}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                by <span className="font-mono text-xs text-primary">{log.admin_wallet === 'SELLER' ? 'Shop Owner' : 'Admin'}</span>
                                            </p>
                                            {log.note && (
                                                <div className="mt-1 rounded-md bg-muted p-2 text-xs italic">
                                                    "{log.note}"
                                                </div>
                                            )}
                                            {(log.from_status || log.to_status) && (
                                                <div className="flex items-center gap-2 text-xs mt-1">
                                                    <Badge variant="outline">{log.from_status || 'NONE'}</Badge>
                                                    <span>→</span>
                                                    <Badge variant="outline">{log.to_status}</Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function InfoItem({ label, value, className, mono, isLink }: { label: string, value?: string, className?: string, mono?: boolean, isLink?: boolean }) {
    if (!value) return null
    return (
        <div className={className}>
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <div className={`text-base ${mono ? 'font-mono text-sm break-all' : ''}`}>
                {isLink ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{value}</a> : value}
            </div>
        </div>
    )
}

function formatAction(action: string) {
    return action.replace(/_/g, ' ')
}
