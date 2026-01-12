
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface LowStockAlertProps {
    products: any[];
}

export function LowStockAlert({ products }: LowStockAlertProps) {
    const queryClient = useQueryClient();
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const lowStockProducts = products?.filter((p: any) => parseInt(p.stock) < 10) || [];

    if (lowStockProducts.length === 0) return null;

    const handleRestock = async (product: any) => {
        setUpdatingId(product.id);
        try {
            const newStock = parseInt(product.stock) + 10;

            // Call API to update stock
            const res = await fetch('/api/seller/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: product.id,
                    stock: newStock,
                    // Send other required fields unchanged to valid schema if strict
                    name: product.name,
                    description: product.description,
                    imageUrl: product.imageUrl,
                    price: product.price, // MIST
                    categoryId: product.categoryId
                })
            });

            if (!res.ok) throw new Error('Failed to restock');

            toast.success(`Đã thêm 10 sản phẩm vào kho cho ${product.name}`);
            queryClient.invalidateQueries({ queryKey: ['my-retail-products'] });
        } catch (error) {
            console.error('Restock error:', error);
            toast.error('Không thể cập nhật tồn kho');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <Card className="border-yellow-500/50 bg-yellow-50/10 dark:bg-yellow-950/10">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                    <AlertTriangle className="w-5 h-5" />
                    Cảnh báo tồn kho thấp
                </CardTitle>
                <CardDescription>
                    Các sản phẩm sau đang sắp hết hàng (dưới 10).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {lowStockProducts.map((product: any) => (
                        <div key={product.id} className="flex items-center justify-between bg-background/50 p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md bg-muted overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={product.imageUrl || '/placeholder.png'} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">Hiện có: <span className="font-bold text-red-500">{product.stock}</span></p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1"
                                onClick={() => handleRestock(product)}
                                disabled={updatingId === product.id}
                            >
                                {updatingId === product.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Plus className="w-3 h-3" />
                                )}
                                Nhập 10
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
