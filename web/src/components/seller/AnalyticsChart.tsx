
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { mistToSui } from '@/lib/sui-utils';

interface AnalyticsChartProps {
    orders: any[];
}

export function AnalyticsChart({ orders }: AnalyticsChartProps) {
    const data = useMemo(() => {
        if (!orders || orders.length === 0) return [];

        // Group orders by date (last 7 days or all available)
        const grouped = orders.reduce((acc: any, order: any) => {
            const date = new Date(order.created_at).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = { date, revenue: 0, orders: 0 };
            }
            acc[date].revenue += Number(mistToSui(order.total_price));
            acc[date].orders += 1;
            return acc;
        }, {});

        // Convert to array and sort by date
        return Object.values(grouped).sort((a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }, [orders]);

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Doanh thu</CardTitle>
                <CardDescription>Biểu đồ doanh thu theo ngày</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value} SUI`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            formatter={(value: number) => [`${value.toFixed(2)} SUI`, 'Revenue']}
                        />
                        <Bar
                            dataKey="revenue"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                            name="Revenue"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
