'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { formatAddress, mistToSui } from '@/lib/sui-utils';
import { Loader2, Package, Truck, CheckCircle, XCircle, ShoppingBag, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// Map status to badge variant and label
const getStatusConfig = (status: string) => {
    switch (status) {
        case 'PAID':
            return { variant: 'default' as const, label: 'Đã thanh toán', icon: CheckCircle, color: 'text-primary' };
        case 'SHIPPING':
            return { variant: 'secondary' as const, label: 'Đang giao', icon: Truck, color: 'text-blue-500' };
        case 'DELIVERED':
            return { variant: 'default' as const, label: 'Đã giao', icon: CheckCircle, color: 'text-green-500' };
        case 'CANCELLED':
            return { variant: 'destructive' as const, label: 'Đã hủy', icon: XCircle, color: 'text-destructive' };
        default:
            return { variant: 'outline' as const, label: status, icon: Package, color: 'text-muted-foreground' };
    }
};

export default function OrderHistoryPage() {
    const account = useCurrentAccount();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (account?.address) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [account?.address]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/orders?role=buyer&wallet=${account!.address}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setOrders(data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = (status: string) => {
        if (status === 'ALL') return orders;
        return orders.filter(order => order.status === status);
    };

    const OrderSkeleton = () => (
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/10 pb-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-md" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-32" />
                </div>
            </CardContent>
        </Card>
    );

    const OrderList = ({ status }: { status: string }) => {
        const filtered = filterOrders(status).filter(order =>
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.items.some((item: any) => item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (loading) {
            return <div className="space-y-4">{[1, 2, 3].map(i => <OrderSkeleton key={i} />)}</div>;
        }

        if (filtered.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Không có đơn hàng nào</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Bạn chưa có đơn hàng nào trong trạng thái này.
                    </p>
                    {status === 'ALL' && (
                        <Button className="mt-6" asChild>
                            <Link href="/shop">Khám phá sản phẩm</Link>
                        </Button>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-4 animate-in fade-in-50 duration-500">
                {filtered.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                        <Card key={order.id} className="overflow-hidden border-muted transition-all hover:border-primary/30 hover:shadow-md">
                            <CardHeader className="bg-muted/10 py-3 px-4 sm:px-6">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold uppercase text-muted-foreground">Shop</span>
                                            <Link href={`/shops/${order.seller_wallet}`} className="font-medium hover:text-primary transition-colors flex items-center gap-1">
                                                {formatAddress(order.seller_wallet)}
                                            </Link>
                                        </div>
                                        <Separator orientation="vertical" className="h-8" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold uppercase text-muted-foreground">Order ID</span>
                                            <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                    <Badge variant={statusConfig.variant} className="w-fit gap-1.5 pl-1.5 pr-2.5 py-1">
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {statusConfig.label}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-6">
                                <div className="space-y-4">
                                    {order.items.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="flex gap-4 group"
                                        >
                                            <div className="h-16 w-16 bg-secondary/30 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden">
                                                {/* Placeholder for item image if available in future */}
                                                <Package className="w-6 h-6 text-muted-foreground/30" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                                            {item.product_name}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            x{item.quantity}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-medium text-sm">
                                                            {mistToSui(item.price)} SUI
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="my-5" />

                                <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                                    <div className="text-xs text-muted-foreground">
                                        Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
                                        <span className="text-base font-medium">Tổng thanh toán:</span>
                                        <span className="text-xl font-bold text-primary">
                                            {mistToSui(order.total_price)} SUI
                                        </span>
                                    </div>
                                </div>
                            </CardContent>

                            {/* Actions / Footer (Optional) */}
                            {/* <CardFooter className="bg-muted/5 py-3 px-6 flex justify-end gap-2 border-t">
                                <Button variant="outline" size="sm">Xem chi tiết</Button>
                                <Button size="sm">Mua lại</Button>
                            </CardFooter> */}
                        </Card>
                    );
                })}
            </div>
        );
    };

    if (!account) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navigation />
                <main className="flex-1 container mx-auto py-16 px-4 max-w-5xl flex items-center justify-center">
                    <Card className="w-full max-w-md text-center p-8">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Vui lòng kết nối ví</h2>
                        <p className="text-muted-foreground mb-8">
                            Bạn cần kết nối ví SUI của mình để xem lịch sử đơn hàng.
                        </p>
                        {/* Connect Button is in Navigation, maybe guide user there */}
                        <div className="p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
                            Nhấn nút <b>Connect Wallet</b> ở góc trên bên phải
                        </div>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navigation />

            <main className="flex-1 container mx-auto py-8 px-4 max-w-4xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
                            <Package className="w-7 h-7 text-primary hidden md:block" />
                            Đơn Mua Của Tôi
                        </h1>
                        <p className="text-muted-foreground">
                            Quản lý và theo dõi quá trình vận chuyển
                        </p>
                    </div>
                </div>

                {/* Filter / Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo Tên sản phẩm hoặc Mã đơn hàng..."
                            className="pl-9 bg-card"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="ALL" className="w-full space-y-6">
                    <TabsList className="w-full flex h-auto p-1 bg-muted/30 border rounded-xl overflow-x-auto scrollbar-none justify-start sm:justify-between">
                        <TabsTrigger value="ALL" className="flex-1 min-w-[80px]">Tất cả</TabsTrigger>
                        <TabsTrigger value="PAID" className="flex-1 min-w-[80px]">Đã thanh toán</TabsTrigger>
                        <TabsTrigger value="SHIPPING" className="flex-1 min-w-[80px]">Đang giao</TabsTrigger>
                        <TabsTrigger value="DELIVERED" className="flex-1 min-w-[80px]">Đã giao</TabsTrigger>
                        <TabsTrigger value="CANCELLED" className="flex-1 min-w-[80px]">Đã hủy</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ALL" className="mt-0"><OrderList status="ALL" /></TabsContent>
                    <TabsContent value="PAID" className="mt-0"><OrderList status="PAID" /></TabsContent>
                    <TabsContent value="SHIPPING" className="mt-0"><OrderList status="SHIPPING" /></TabsContent>
                    <TabsContent value="DELIVERED" className="mt-0"><OrderList status="DELIVERED" /></TabsContent>
                    <TabsContent value="CANCELLED" className="mt-0"><OrderList status="CANCELLED" /></TabsContent>
                </Tabs>
            </main>

            <Footer />
        </div>
    );
}
