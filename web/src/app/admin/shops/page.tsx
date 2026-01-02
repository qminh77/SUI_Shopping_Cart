'use client'
import { cn } from '@/lib/utils'
export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Eye, Search, Filter, Loader2 } from 'lucide-react'

// Types
interface Shop {
    id: string
    shop_name: string
    owner_wallet: string
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
    established_year: number
    tax_code?: string
    created_at: string
}

interface ShopsResponse {
    data: Shop[]
    count: number
}

// Helper for status colors
const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'default'
        case 'PENDING': return 'warning' // Requires custom variant or class
        case 'SUSPENDED': return 'destructive'
        default: return 'secondary'
    }
}

// Since Shadcn default badge might not have 'warning', we use classes
const getBadgeClass = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'bg-green-500 hover:bg-green-600'
        case 'PENDING': return 'bg-yellow-500 hover:bg-yellow-600'
        case 'SUSPENDED': return 'bg-red-500 hover:bg-red-600'
        default: return ''
    }
}

const AdminShopsContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const page = parseInt(searchParams.get('page') || '1')
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    // Fetch Shops
    const { data, isLoading, isError, refetch } = useQuery<ShopsResponse>({
        queryKey: ['admin-shops', page, filterStatus, debouncedSearch],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString()
            })
            if (filterStatus !== 'all') params.append('status', filterStatus)
            if (debouncedSearch) params.append('q', debouncedSearch)

            const res = await fetch(`/api/admin/shops?${params}`)

            if (res.status === 401) {
                window.location.href = '/admin/login'
                throw new Error('Unauthorized')
            }

            if (!res.ok) throw new Error('Failed')
            return res.json()
        }
    })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-1">SHOPS DIRECTORY</h2>
                    <p className="text-neutral-400 text-xs uppercase tracking-widest">Manage seller applications</p>
                </div>
            </div>

            <div className="bg-black/40 border border-white/10 backdrop-blur-md cut-corner p-6 relative">
                <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                    <div className="w-16 h-16 border-t-2 border-r-2 border-blue-500 rounded-tr-[20px]"></div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                        <Input
                            placeholder="SEARCH SHOPS..."
                            className="pl-10 h-10 bg-black/40 border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-blue-500/50 cut-corner-bottom-right rounded-none font-mono text-xs tracking-wider"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-neutral-500" />
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px] h-10 bg-black/40 border-white/10 text-white cut-corner-bottom-right rounded-none font-mono text-xs tracking-wider">
                                <SelectValue placeholder="STATUS" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-white/10 text-white cursor-pointer rounded-none">
                                <SelectItem value="all">ALL STATUS</SelectItem>
                                <SelectItem value="PENDING">PENDING</SelectItem>
                                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex h-60 items-center justify-center border border-white/5 bg-white/[0.02]">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : isError ? (
                    <div className="text-center text-red-500 py-10 border border-red-500/20 bg-red-500/5 cut-corner">FAILED TO LOAD SHOPS</div>
                ) : (
                    <div className="border border-white/5 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5 hover:bg-white/5">
                                    <TableHead className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest h-10">Shop Name</TableHead>
                                    <TableHead className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest h-10">Owner Wallet</TableHead>
                                    <TableHead className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest h-10">Est. Year</TableHead>
                                    <TableHead className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest h-10">Status</TableHead>
                                    <TableHead className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest h-10">Registered</TableHead>
                                    <TableHead className="text-right text-neutral-500 font-mono text-[10px] uppercase tracking-widest h-10">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.data.length === 0 ? (
                                    <TableRow className="border-white/5 hover:bg-white/5">
                                        <TableCell colSpan={6} className="h-32 text-center text-neutral-500 font-mono text-xs">
                                            NO DATA FOUND
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data.map((shop) => (
                                        <TableRow key={shop.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                            <TableCell className="font-bold text-white tracking-wide">{shop.shop_name}</TableCell>
                                            <TableCell className="font-mono text-xs text-neutral-400 group-hover:text-blue-400 transition-colors">
                                                {shop.owner_wallet.slice(0, 6)}...{shop.owner_wallet.slice(-4)}
                                            </TableCell>
                                            <TableCell className="text-neutral-300 font-mono text-xs">{shop.established_year}</TableCell>
                                            <TableCell>
                                                <Badge className={cn("border-none rounded-none px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider", getBadgeClass(shop.status))}>
                                                    {shop.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-neutral-400 text-xs font-mono">{new Date(shop.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild className="text-neutral-400 hover:text-white hover:bg-blue-500/10 hover:border-blue-500/50 border border-transparent cut-corner-bottom-right transition-all rounded-none h-8 text-xs font-mono">
                                                    <Link href={`/admin/shops/${shop.id}`}>
                                                        <Eye className="h-3 w-3 mr-2" />
                                                        VIEW
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-[10px] text-neutral-600 pt-8 font-mono uppercase tracking-widest border-t border-white/5 mt-auto">
                <span>SYSTEM STATUS: ONLINE</span>
                <span>SECURE CONNECTION</span>
            </div>
        </div>
    )
}

export default function AdminShopsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <AdminShopsContent />
        </Suspense>
    )
}
