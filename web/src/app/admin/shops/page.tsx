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
import { Eye, Search, Filter, Loader2, Store } from 'lucide-react'

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

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'default'
        case 'PENDING': return 'secondary'
        case 'SUSPENDED': return 'destructive'
        default: return 'outline'
    }
}

const AdminShopsContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const page = parseInt(searchParams.get('page') || '1')
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    const [debouncedSearch, setDebouncedSearch] = useState(search)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    const { data, isLoading, isError } = useQuery<ShopsResponse>({
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
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Shop Management</h1>
                            <p className="text-sm text-muted-foreground">Manage seller applications</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search shops..."
                                    className="pl-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex h-60 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : isError ? (
                            <div className="text-center text-destructive py-10">
                                Failed to load shops
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Shop Name</TableHead>
                                                <TableHead>Owner Wallet</TableHead>
                                                <TableHead>Est. Year</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Registered</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data?.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                                        No shops found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                data?.data.map((shop) => (
                                                    <TableRow key={shop.id}>
                                                        <TableCell className="font-semibold">{shop.shop_name}</TableCell>
                                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                                            {shop.owner_wallet.slice(0, 6)}...{shop.owner_wallet.slice(-4)}
                                                        </TableCell>
                                                        <TableCell className="text-sm">{shop.established_year}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={getStatusVariant(shop.status)}>
                                                                {shop.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(shop.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="sm" asChild>
                                                                <Link href={`/admin/shops/${shop.id}`}>
                                                                    <Eye className="h-4 w-4 mr-2" />
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

                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y">
                                    {data?.data.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No shops found
                                        </div>
                                    ) : (
                                        data?.data.map((shop) => (
                                            <div key={shop.id} className="p-4 space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold truncate">{shop.shop_name}</h3>
                                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                                            {shop.owner_wallet.slice(0, 10)}...{shop.owner_wallet.slice(-6)}
                                                        </p>
                                                    </div>
                                                    <Badge variant={getStatusVariant(shop.status)} className="shrink-0">
                                                        {shop.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Est. {shop.established_year}</span>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/admin/shops/${shop.id}`}>
                                                            <Eye className="h-3 w-3 mr-1.5" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t">
                    <span>Total: {data?.count || 0} shops</span>
                    <span>Page {page}</span>
                </div>
            </div>
        </div>
    )
}

export default function AdminShopsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        }>
            <AdminShopsContent />
        </Suspense>
    )
}
