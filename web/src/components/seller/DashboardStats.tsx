
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, ShoppingBag, AlertTriangle } from 'lucide-react';
import { mistToSui } from '@/lib/sui-utils';
import { useMemo } from 'react';

interface DashboardStatsProps {
    orders: any[];
    products: any[];
}

export function DashboardStats({ orders, products }: DashboardStatsProps) {
    const stats = useMemo(() => {
        const totalRevenue = orders?.reduce((acc, order) => acc + Number(mistToSui(order.total_price)), 0) || 0;
        const totalOrders = orders?.length || 0;
        const totalProducts = products?.length || 0;
        const lowStockItems = products?.filter((p: any) => parseInt(p.stock) < 10).length || 0;

        return {
            totalRevenue,
            totalOrders,
            totalProducts,
            lowStockItems
        };
    }, [orders, products]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} SUI</div>
                    <p className="text-xs text-muted-foreground">+0% from last month</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Đơn hàng</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">+0 from last month</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sản phẩm</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProducts}</div>
                    <p className="text-xs text-muted-foreground">{stats.totalProducts} active products</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cảnh báo tồn kho</CardTitle>
                    <AlertTriangle className={`h-4 w-4 ${stats.lowStockItems > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.lowStockItems}</div>
                    <p className="text-xs text-muted-foreground">Sản phẩm sắp hết hàng</p>
                </CardContent>
            </Card>
        </div>
    );
}
