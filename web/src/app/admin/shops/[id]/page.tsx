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
import { cn } from '@/lib/utils'

// Types
type ShopDetail = {
    shop: any // Using any for speed, ideally interface
    logs: any[]
}

export default function AdminShopDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [suspendReason, setSuspendReason] = useState<string>('')
    const [isSuspendOpen, setIsSuspendOpen] = useState<boolean>(false)
    const [isLoadingAction, setIsLoadingAction] = useState<boolean>(false)

    const { data, isLoading, isError } = useQuery<ShopDetail>({
        queryKey: ['admin-shop', id],
        queryFn: async () => {
            const res = await fetch(`/api/admin/shops/${id}`)

            if (res.status === 401) {
                window.location.href = '/admin/login'
                throw new Error('Unauthorized')
            }

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

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-500 h-8 w-8" /></div>
    if (isError || !data) return <div className="text-center py-20 text-neutral-400">Shop not found or access denied</div>

    const { shop, logs } = data

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild className="border-white/10 bg-black/20 text-neutral-400 hover:text-white hover:bg-white/10">
                    <Link href="/admin/shops"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight text-white">{shop.shop_name}</h2>
                    <div className="flex items-center gap-2 text-neutral-400 mt-2">
                        <span className="font-mono text-xs bg-black/30 px-2 py-0.5 rounded border border-white/5">{shop.id}</span>
                        <Separator orientation="vertical" className="h-4 bg-white/10" />
                        <Badge
                            variant="outline"
                            className={cn(
                                "border-none",
                                shop.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                                    shop.status === 'SUSPENDED' ? 'bg-red-500/20 text-red-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                            )}
                        >
                            {shop.status}
                        </Badge>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {shop.status === 'PENDING' && (
                        <Button
                            className="bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 border-none"
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
                                <Button className="bg-red-900/50 text-red-400 border border-red-500/20 hover:bg-red-900/80 hover:text-red-300">
                                    <Ban className="mr-2 h-4 w-4" />
                                    Suspend Shop
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-neutral-900 border-white/10">
                                <DialogHeader>
                                    <DialogTitle className="text-white">Suspend Shop</DialogTitle>
                                    <DialogDescription className="text-neutral-400">
                                        This will disable selling capabilities for this shop. Reasoning is required.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 py-4">
                                    <Label className="text-white">Reason for suspension</Label>
                                    <Textarea
                                        placeholder="Violation of terms..."
                                        className="bg-black/30 border-white/10 text-white resize-none h-32"
                                        value={suspendReason}
                                        onChange={(e) => setSuspendReason(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsSuspendOpen(false)} className="text-neutral-400 hover:text-white">Cancel</Button>
                                    <Button
                                        className="bg-red-600 hover:bg-red-500 text-white border-none"
                                        onClick={() => handleAction('suspend', { reason: suspendReason })}
                                        disabled={!suspendReason.trim() || isLoadingAction}
                                    >
                                        Execute Suspension
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {shop.status === 'SUSPENDED' && (
                        <Button
                            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-none"
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
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-black/20 border border-white/5 p-1">
                    <TabsTrigger value="info" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-neutral-400">Information</TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-neutral-400">History & Audit</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6 mt-6">
                    <Card className="bg-neutral-900/50 border-white/10 backdrop-blur-md">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="text-white text-lg">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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

                    <Card className="bg-neutral-900/50 border-white/10 backdrop-blur-md">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="text-white text-lg">Policies & Socials</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <InfoItem label="Facebook" value={shop.facebook_url} isLink />
                                <InfoItem label="Instagram" value={shop.instagram_url} isLink />
                                <InfoItem label="Support Policy" value={shop.support_policy} className="md:col-span-2" />
                                <InfoItem label="Return Policy" value={shop.return_policy} className="md:col-span-2" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card className="bg-neutral-900/50 border-white/10 backdrop-blur-md">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="text-white text-lg">Audit Logs</CardTitle>
                            <CardDescription className="text-neutral-500">Record of administrative actions and shop updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="relative border-l border-white/10 ml-2 space-y-8 pb-4">
                                {logs.length === 0 && <div className="pl-8 text-sm text-neutral-500">No logs found.</div>}
                                {logs.map((log) => (
                                    <div key={log.id} className="relative pl-8">
                                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-blue-500/50 bg-neutral-900 ring-4 ring-neutral-900" />
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-sm text-white capitalize">{formatAction(log.action)}</span>
                                                <span className="text-xs text-neutral-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-neutral-400">
                                                By: <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded">{log.admin_wallet === 'SELLER' ? 'Shop Owner' : 'Admin'}</span>
                                            </p>
                                            {log.note && (
                                                <div className="mt-1 rounded-lg bg-white/5 border border-white/5 p-3 text-sm italic text-neutral-300">
                                                    "{log.note}"
                                                </div>
                                            )}
                                            {(log.from_status || log.to_status) && (
                                                <div className="flex items-center gap-2 text-xs mt-1">
                                                    <Badge variant="outline" className="border-white/10 text-neutral-400">{log.from_status || 'NONE'}</Badge>
                                                    <span className="text-neutral-600">→</span>
                                                    <Badge variant="outline" className="border-white/10 text-white">{log.to_status}</Badge>
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
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-sm text-neutral-200 ${mono ? 'font-mono text-xs break-all' : ''}`}>
                {isLink ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">{value}</a> : value}
            </div>
        </div>
    )
}

function formatAction(action: string) {
    return action.replace(/_/g, ' ')
}
