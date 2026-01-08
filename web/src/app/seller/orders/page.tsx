'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { OrderStatus } from '@/services/order.service';
import { mistToSui } from '@/lib/sui-utils';
import { Loader2, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function SellerOrdersPage() {
    const account = useCurrentAccount();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (account?.address) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [account?.address]);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`/api/orders?role=seller&wallet=${account!.address}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setOrders(data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/orders/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    status: newStatus,
                    sellerWallet: account!.address
                })
            });

            if (!res.ok) throw new Error('Failed to update');

            toast.success(`Updated order status to ${newStatus}`);
            fetchOrders(); // Refresh list
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (!account) return <div className="text-center p-8">Vui lòng kết nối ví để xem đơn hàng.</div>;

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Package className="w-6 h-6" /> Quản Lý Đơn Hàng (Seller)
            </h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-sm">Mã đơn</th>
                            <th className="p-4 font-semibold text-sm">Ngày đặt</th>
                            <th className="p-4 font-semibold text-sm">Người mua</th>
                            <th className="p-4 font-semibold text-sm">Sản phẩm</th>
                            <th className="p-4 font-semibold text-sm">Tổng tiền</th>
                            <th className="p-4 font-semibold text-sm">Trạng thái</th>
                            <th className="p-4 font-semibold text-sm">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="p-4 text-sm font-mono text-gray-500">{order.id.slice(0, 8)}...</td>
                                <td className="p-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                                <td className="p-4 text-sm text-gray-500 font-mono">{order.buyer_wallet.slice(0, 6)}...{order.buyer_wallet.slice(-4)}</td>
                                <td className="p-4 text-sm">
                                    <div className="space-y-1">
                                        {order.items.map((item: any) => (
                                            <div key={item.id}>
                                                {item.product_name} <span className="text-gray-500">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4 text-sm font-bold text-red-600">
                                    {mistToSui(order.total_price)} SUI
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'SHIPPING' ? 'bg-orange-100 text-orange-800' :
                                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        {order.status === 'PAID' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                disabled={updating === order.id}
                                                onClick={() => handleStatusUpdate(order.id, 'SHIPPING')}
                                            >
                                                {updating === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Giao hàng'}
                                            </Button>
                                        )}
                                        {order.status === 'SHIPPING' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                disabled={updating === order.id}
                                                onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                                            >
                                                {updating === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hoàn thành'}
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-8 text-center text-gray-500">Chưa có đơn hàng nào.</div>
                )}
            </div>
        </div>
    );
}
