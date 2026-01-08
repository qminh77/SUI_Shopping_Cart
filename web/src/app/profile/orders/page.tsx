'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { formatAddress, mistToSui } from '@/lib/sui-utils';
import { Loader2, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

// Helper to format currency
const formatPrice = (mist: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(mistToSui(mist) * 25000 * 100); // Rough conversion SUI to VND? Or just show SUI
    // Let's show SUI for now
    // return `${mistToSui(mist).toFixed(2)} SUI`;
};

// Map status to icon/color
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'PAID': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Đã thanh toán</span>;
        case 'SHIPPING': return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Truck size={12} /> Đang giao</span>;
        case 'DELIVERED': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Đã giao</span>;
        case 'CANCELLED': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12} /> Đã hủy</span>;
        default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
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

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (!account) return <div className="text-center p-8">Vui lòng kết nối ví để xem đơn hàng.</div>;

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Package className="w-6 h-6" /> Đơn Mua Của Tôi
            </h1>

            {orders.length === 0 ? (
                <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow">
                    Chưa có đơn hàng nào. Hãy mua sắm ngay!
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg shadow p-4 border hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start mb-4 pb-2 border-b">
                                <div>
                                    <div className="text-sm text-gray-500">Mã đơn: {order.id.slice(0, 8)}...</div>
                                    <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('vi-VN')}</div>
                                </div>
                                <div>{getStatusBadge(order.status)}</div>
                            </div>

                            <div className="space-y-3">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                        <div className="flex items-center gap-3">
                                            {/* Placeholder image if we don't store it in items, normally we should */}
                                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">IMG</div>
                                            <div>
                                                <div className="font-medium">{item.product_name}</div>
                                                <div className="text-sm text-gray-500">x{item.quantity}</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-blue-600">
                                            {mistToSui(item.price)} SUI
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-2 border-t flex justify-end items-center gap-4">
                                <div className="text-sm text-gray-500">Tổng tiền:</div>
                                <div className="text-xl font-bold text-red-600">
                                    {mistToSui(order.total_price)} SUI
                                </div>
                            </div>

                            <div className="mt-2 text-xs text-gray-400 text-right">
                                Shop: {formatAddress(order.seller_wallet)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
