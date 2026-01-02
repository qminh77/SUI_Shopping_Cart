'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Product, mistToSui, formatAddress } from '@/lib/sui-utils';
import { useCart } from '@/contexts/CartContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useProducts } from '@/hooks/useProducts';
import { useKiosk } from '@/hooks/useKiosk';
import Image from 'next/image';
import { ShoppingCart, Store, Package, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductDetailDialogProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kioskId?: string; // Optional: Kiosk ID where product is listed
}

export function ProductDetailDialog({ product, open, onOpenChange, kioskId }: ProductDetailDialogProps) {
    const { addToCart, items } = useCart();
    const account = useCurrentAccount();
    const { purchaseProduct, isPurchasing: isLegacyPurchasing } = useProducts();
    const { purchaseFromKiosk, isPurchasing: isKioskPurchasing } = useKiosk(account?.address);

    const isPurchasing = isLegacyPurchasing || isKioskPurchasing;

    if (!product) return null;

    const isInCart = items.some(item => item.id === product.id);

    const handleAddToCart = () => {
        addToCart(product);
        toast.success('Added to cart!');
    };

    const handleBuyNow = async () => {
        if (!account) {
            toast.error('Please connect your wallet');
            return;
        }

        try {
            // TODO: In a full Kiosk implementation, we need to:
            // 1. Query which Kiosk contains this product
            // 2. Use that Kiosk ID for purchase
            // For now, we fall back to legacy purchase if no kioskId

            if (kioskId) {
                await purchaseFromKiosk({
                    kioskId,
                    productId: product.id,
                    price: product.price,
                    productName: product.name,
                    seller: product.creator,
                });
            } else {
                // Legacy purchase (for products not in Kiosk)
                await purchaseProduct({
                    productId: product.id,
                    price: product.price,
                    seller: product.creator,
                });
            }
            onOpenChange(false);
        } catch (error) {
            console.error('Purchase error:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-background">
                <DialogHeader className="sr-only">
                    <DialogTitle>{product.name}</DialogTitle>
                    <DialogDescription>Product details for {product.name}</DialogDescription>
                </DialogHeader>

                {/* NOTE: Just a quick way to verify receipts page */}
                {/* In production this should be in header */}

                <div className="grid md:grid-cols-2 lg:grid-cols-5 h-full max-h-[90vh] overflow-y-auto md:overflow-hidden">
                    {/* Product Image - Left/Top Side */}
                    <div className="lg:col-span-3 relative aspect-video md:aspect-auto md:h-full bg-muted flex items-center justify-center overflow-hidden">
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute top-4 left-4 z-10">
                            <Badge variant="secondary" className="backdrop-blur-md bg-background/50 border-white/20 shadow-sm">
                                NFT Product
                            </Badge>
                        </div>
                    </div>

                    {/* Product Details - Right/Bottom Side */}
                    <div className="lg:col-span-2 flex flex-col p-6 md:p-8 gap-6 md:max-h-[85vh] md:overflow-y-auto">
                        {/* Header Info */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Store className="h-4 w-4" />
                                    {formatAddress(product.creator)}
                                </div>
                                <Badge variant={product.listed ? 'outline' : 'secondary'} className="font-normal">
                                    {product.listed ? 'Status: Listed' : 'Status: Unlisted'}
                                </Badge>
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                                {product.name}
                            </h2>

                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-primary">
                                    {mistToSui(product.price)}
                                </span>
                                <span className="text-lg font-medium text-muted-foreground">SUI</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Description */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">About this Item</h3>
                            <p className="text-sm leading-relaxed text-foreground/90">
                                {product.description}
                            </p>
                        </div>

                        {/* Product Meta */}
                        <div className="grid grid-cols-2 gap-4 py-4 rounded-lg bg-muted/40 p-4 border">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Package className="h-3 w-3" /> Product ID
                                </span>
                                <p className="font-mono text-xs truncate bg-background p-1 rounded border">
                                    {formatAddress(product.id, 8)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3" /> Created
                                </span>
                                <p className="text-xs pt-1">
                                    {new Date(product.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto pt-4 space-y-3">
                            <Button
                                onClick={handleBuyNow}
                                disabled={!account || isPurchasing || !product.listed}
                                className="w-full h-12 text-base shadow-md"
                                size="lg"
                            >
                                {isPurchasing ? 'Processing Transaction...' : !account ? 'Connect Wallet to Purchase' : 'Buy Now'}
                            </Button>

                            <Button
                                onClick={handleAddToCart}
                                disabled={isInCart || !product.listed}
                                variant="outline"
                                className="w-full h-12 text-base hover:bg-muted/50 transition-colors"
                                size="lg"
                            >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                {isInCart ? 'Item in Cart' : 'Add to Cart'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
