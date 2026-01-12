
'use client';

import { useEffect, useState, use } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { formatAddress, mistToSui } from '@/lib/sui-utils';
import { Loader2, Package, Truck, CheckCircle, XCircle, ArrowLeft, Store, MapPin, Phone, CreditCard, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'PAID':
            return { variant: 'default' as const, label: 'Đã thanh toán', icon: CheckCircle, color: 'text-primary' };
        case 'SHIPPING':
            return { variant: 'secondary' as const, label: 'Đang vận chuyển', icon: Truck, color: 'text-blue-500' };
        case 'DELIVERED':
            return { variant: 'default' as const, label: 'Đã giao hàng', icon: CheckCircle, color: 'text-green-500' };
        case 'CANCELLED':
            return { variant: 'destructive' as const, label: 'Đã hủy', icon: XCircle, color: 'text-destructive' };
        default:
            return { variant: 'outline' as const, label: status, icon: Package, color: 'text-muted-foreground' };
    }
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const { t } = useLanguage();
    const account = useCurrentAccount();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!account) {
            // router.push('/profile/orders'); // Optional redirect or show login msg
            setLoading(false);
            return;
        }
        fetchOrderDetails();
    }, [id, account]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/orders/${id}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('Order not found');
                throw new Error('Failed to fetch order details');
            }
            const data = await res.json();
            setOrder(data);
        } catch (err: any) {
            console.error('Error fetching order:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navigation />
                <main className="flex-1 container mx-auto py-16 px-4 flex items-center justify-center">
                    <Card className="max-w-md w-full text-center p-8">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Login Required</h2>
                        <p className="text-muted-foreground mb-6">Please connect your wallet to view order details.</p>
                        <Button asChild><Link href="/">Go Home</Link></Button>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navigation />
                <main className="flex-1 container mx-auto py-8 px-4 max-w-4xl space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-8 w-64" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Skeleton className="h-[200px] w-full rounded-xl" />
                            <Skeleton className="h-[150px] w-full rounded-xl" />
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-[150px] w-full rounded-xl" />
                            <Skeleton className="h-[150px] w-full rounded-xl" />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navigation />
                <main className="flex-1 container mx-auto py-16 px-4 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                            <XCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold">Error Loading Order</h2>
                        <p className="text-muted-foreground">{error || 'Order not found'}</p>
                        <Button onClick={() => router.back()} variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Orders
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const shippingAddress = order.shipping_address || {};

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navigation />

            <main className="flex-1 container mx-auto py-8 px-4 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
                                <Badge variant={statusConfig.variant} className="gap-1 px-2.5 py-0.5">
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {statusConfig.label}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm mt-1">
                                Order ID: <span className="font-mono">{order.id}</span>
                            </p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                Placed on {new Date(order.created_at).toLocaleString('vi-VN')}
                            </p>
                        </div>
                    </div>
                    {/* Optional: Add Action Buttons here like "Track Order" or "Contact Seller" */}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left Column: Items & Payment */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Package className="w-5 h-5 text-primary" />
                                    Items
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="h-20 w-20 bg-muted/50 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden">
                                            {/* Placeholder for now, replace with actual image if available */}
                                            <Package className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h3 className="font-medium line-clamp-2">{item.product_name}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Quantity: {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium">
                                                        {mistToSui(item.price)} SUI
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Total: {mistToSui(item.price * item.quantity)} SUI
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{mistToSui(order.total_price)} SUI</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping Fee</span>
                                        <span>0.0 SUI</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-primary">{mistToSui(order.total_price)} SUI</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Transaction Details (Optional) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    Payment Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b last:border-0">
                                    <span className="text-sm text-muted-foreground">Method</span>
                                    <span className="font-medium">SUI Wallet</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b last:border-0">
                                    <span className="text-sm text-muted-foreground">Transaction Digest</span>
                                    <a
                                        href={`https://suiscan.xyz/tx/${order.transaction_digest}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-mono text-primary hover:underline truncate max-w-[200px]"
                                    >
                                        {formatAddress(order.transaction_digest)}
                                    </a>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b last:border-0">
                                    <span className="text-sm text-muted-foreground">Payment Status</span>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Address & Shop */}
                    <div className="space-y-6">
                        {/* Shipping Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    Shipping Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                                <div>
                                    <p className="font-semibold">{shippingAddress.fullName || 'N/A'}</p>
                                    <p className="text-muted-foreground mt-1">{shippingAddress.phone || 'N/A'}</p>
                                    <p className="text-muted-foreground mt-1">
                                        {shippingAddress.address}, {shippingAddress.city}
                                    </p>
                                </div>
                                {order.tracking_code && (
                                    <div className="pt-3 border-t mt-3">
                                        <p className="font-medium text-xs text-muted-foreground uppercase mb-1">Tracking Info</p>
                                        <p className="font-semibold flex items-center gap-2">
                                            <Truck className="w-4 h-4" />
                                            {order.shipping_carrier}: {order.tracking_code}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Shop Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Store className="w-5 h-5 text-primary" />
                                    Shop Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    {order.shop?.logo_url ? (
                                        <img src={order.shop.logo_url} alt={order.shop.shop_name} className="w-12 h-12 rounded-full object-cover border" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Store className="w-6 h-6 text-primary" />
                                        </div>
                                    )}
                                    <div>
                                        <Link href={`/shops/${order.shop.owner_wallet}`} className="font-semibold hover:text-primary transition-colors">
                                            {order.shop?.shop_name || 'Unknown Shop'}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">
                                            {order.shop?.address_city || 'Vn'}
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    {order.shop?.contact_phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="w-4 h-4" />
                                            <span>{order.shop.contact_phone}</span>
                                        </div>
                                    )}
                                    <Button variant="outline" className="w-full h-8 text-xs" asChild>
                                        <Link href={`/shops/${order.shop.owner_wallet}`}>Visit Shop</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
