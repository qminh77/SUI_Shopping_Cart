'use client'

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

function AdminShopsContent() {
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
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Shops</h2>
                    <p className="text-muted-foreground">Manage seller applications and active shops.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search shops..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="PENDING">Pending Approval</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : isError ? (
                        <div className="text-center text-red-500 py-10">Failed to load shops</div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Shop Name</TableHead>
                                        <TableHead>Owner Wallet</TableHead>
                                        <TableHead>Tax Code</TableHead>
                                        <TableHead>Est. Year</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Registered</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No shops found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data.map((shop) => (
                                            <TableRow key={shop.id}>
                                                <TableCell className="font-medium">{shop.shop_name}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {shop.owner_wallet.slice(0, 6)}...{shop.owner_wallet.slice(-4)}
                                                </TableCell>
                                                <TableCell>{shop.tax_code || '-'}</TableCell>
                                                <TableCell>{shop.established_year}</TableCell>
                                                <TableCell>
                                                    <Badge className={getBadgeClass(shop.status)}>
                                                        {shop.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(shop.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/admin/shops/${shop.id}`}>
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
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
                </CardContent>
            </Card>

            {/* Pagination Actions would go here */}
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
