import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, mistToSui, formatAddress } from '@/lib/sui-utils';
import { Receipt as ReceiptIcon, ExternalLink, Calendar, User, DollarSign, Package } from 'lucide-react';

interface ReceiptCardProps {
    receipt: Receipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
    const formattedDate = new Date(receipt.purchaseDate * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ReceiptIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg line-clamp-1">{receipt.productName}</CardTitle>
                            <p className="text-xs text-muted-foreground">Receipt #{receipt.id.slice(0, 8)}...</p>
                        </div>
                    </div>
                    <Badge variant="secondary">Purchase Receipt</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* Quantity & Unit Price */}
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Quantity</p>
                            <p className="font-semibold">{receipt.quantity} Unit{receipt.quantity > 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Total Paid</p>
                            <p className="font-semibold text-blue-500">{mistToSui(receipt.totalPaid)} SUI</p>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Purchase Date</p>
                            <p className="font-medium text-xs">{formattedDate}</p>
                        </div>
                    </div>

                    {/* Seller */}
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Seller</p>
                            <p className="font-mono text-xs truncate w-24">{formatAddress(receipt.seller)}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-3 border-t">
                    <a
                        href={`https://testnet.suivision.xyz/txblock/${receipt.transactionDigest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary hover:underline group"
                    >
                        <span>View on Explorer</span>
                        <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}
