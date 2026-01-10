'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { formatAddress, mistToSui } from '@/lib/sui-utils';
import { Loader2, Package, Truck, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Map status to badge variant and label
const getStatusConfig = (status: string) => {
    switch (status) {
        case 'PAID':
            return { variant: 'default' as const, label: 'Đã thanh toán', icon: CheckCircle };
        case 'SHIPPING':
            return { variant: 'secondary' as const, label: 'Đang giao', icon: Truck };
        case 'DELIVERED':
            return { variant: 'default' as const, label: 'Đã giao', icon: CheckCircle };
        case 'CANCELLED':
            return { variant: 'destructive' as const, label: 'Đã hủy', icon: XCircle };
        default:
            return { variant: 'outline' as const, label: status, icon: Package };
    }
};

export default function OrderHistoryPage() {
    const account = useCurrentAccount();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (account?.address) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [account?.address]);

    const fetchOrders = async () => {
        try {
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

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navigation />

            <main className="flex-1 container mx-auto py-8 px-4 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        <Package className="w-8 h-8 text-primary" />
                        Đơn Mua Của Tôi
                    </h1>
                    <p className="text-muted-foreground">
                        Xem và quản lý tất cả đơn hàng của bạn
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : !account ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <ShoppingBag className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Chưa kết nối ví</h3>
                            <p className="text-muted-foreground text-center mb-6">
                                Vui lòng kết nối ví của bạn để xem đơn hàng
                            </p>
                        </CardContent>
                    </Card>
                ) : orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Chưa có đơn hàng nào</h3>
                            <p className="text-muted-foreground text-center mb-6">
                                Hãy khám phá và mua sắm sản phẩm yêu thích của bạn!
                            </p>
                            <Button asChild>
                                <Link href="/shop">
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    Bắt đầu mua sắm
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const statusConfig = getStatusConfig(order.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <CardHeader className="bg-muted/50">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base font-semibold">
                                                    Mã đơn: {order.id.slice(0, 8)}...
                                                </CardTitle>
                                                <CardDescription>
                                                    {new Date(order.created_at).toLocaleString('vi-VN')}
                                                </CardDescription>
                                            </div>
                                            <Badge variant={statusConfig.variant} className="gap-1">
                                                <StatusIcon className="w-3 h-3" />
                                                {statusConfig.label}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-4">
                                        {/* Order Items */}
                                        <div className="space-y-3 mb-4">
                                            {order.items.map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    className="flex justify-between items-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                                            <Package className="w-6 h-6 text-muted-foreground/50" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">{item.product_name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Số lượng: x{item.quantity}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="font-semibold text-primary">
                                                        {mistToSui(item.price).toFixed(2)} SUI
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Separator className="my-4" />

                                        {/* Order Summary */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Người bán:</span>
                                                <span className="text-sm font-mono">{formatAddress(order.seller_wallet)}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-base font-semibold">Tổng tiền:</span>
                                                <span className="text-xl font-bold text-primary">
                                                    {mistToSui(order.total_price).toFixed(2)} SUI
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
