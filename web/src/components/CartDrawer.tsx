'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useProducts } from '@/hooks/useProducts';
import { useKiosk } from '@/hooks/useKiosk';
import { mistToSui } from '@/lib/sui-utils';
import { ShoppingCart, X, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useState } from 'react';

export function CartDrawer() {
    const { items, removeFromCart, clearCart, getTotalItems, getTotalPrice } = useCart();
    const account = useCurrentAccount();
    const { purchaseProduct, isPurchasing: isLegacyPurchasing } = useProducts();
    const { purchaseFromKiosk, isPurchasing: isKioskPurchasing } = useKiosk(account?.address);
    const [open, setOpen] = useState(false);

    const isPurchasing = isLegacyPurchasing || isKioskPurchasing;

    const handleCheckout = async () => {
        if (!account) {
            toast.error('Please connect your wallet');
            return;
        }

        if (items.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        try {
            // TODO: For Kiosk-based products, we need kioskId for each item
            // For now, use legacy purchase for all items
            // In a full implementation, we'd:
            // 1. Group items by kioskId
            // 2. Create batch transactions per kiosk
            // 3. Use Kiosk purchase for items in kiosks

            for (const item of items) {
                // If item has a Kiosk ID, use Kiosk purchase flow (generates receipt)
                if (item.kioskId) {
                    await purchaseFromKiosk({
                        kioskId: item.kioskId,
                        productId: item.id,
                        price: item.price,
                        productName: item.name,
                        seller: item.creator,
                    });
                } else {
                    // Legacy purchase (works for non-Kiosk products)
                    await purchaseProduct({
                        productId: item.id,
                        price: item.price,
                        seller: item.creator,
                    });
                }
            }

            clearCart();
            setOpen(false);
            toast.success('All items purchased successfully!');
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Failed to complete checkout');
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                    <ShoppingCart className="h-4 w-4" />
                    {getTotalItems() > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {getTotalItems()}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="flex items-center justify-between">
                        <span>Shopping Cart ({getTotalItems()})</span>
                        {items.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCart}
                                className="text-destructive hover:text-destructive"
                            >
                                Clear All
                            </Button>
                        )}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full pt-6">
                    {/* Cart Items */}
                    {items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold mb-2">Your cart is empty</h3>
                            <p className="text-sm text-muted-foreground">
                                Add some products to your cart to get started
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-3 border rounded-lg">
                                        {/* Thumbnail */}
                                        <div className="relative w-20 h-20 rounded overflow-hidden bg-secondary/20 flex-shrink-0">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm line-clamp-1 mb-1">
                                                {item.name}
                                            </h4>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                {item.description}
                                            </p>
                                            <p className="font-bold text-sm">
                                                {mistToSui(item.price)} SUI
                                            </p>
                                        </div>

                                        {/* Remove */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFromCart(item.id)}
                                            className="flex-shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            {/* Total */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>{mistToSui(getTotalPrice())} SUI</span>
                                </div>

                                <Button
                                    onClick={handleCheckout}
                                    disabled={!account || isPurchasing}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isPurchasing ? 'Processing...' : !account ? 'Connect Wallet' : 'Checkout'}
                                </Button>

                                {!account && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        Please connect your wallet to checkout
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
