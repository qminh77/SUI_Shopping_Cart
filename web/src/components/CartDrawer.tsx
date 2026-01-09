import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/contexts/CartContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useCheckout } from '@/hooks/useCheckout';
import { mistToSui } from '@/lib/sui-utils';
import { ShoppingCart, X, Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useState } from 'react';

export function CartDrawer() {
    const {
        items,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        selectedItems,
        toggleSelection,
        selectAll,
        deselectAll,
        getSelectedItems,
        removeSelectedItems
    } = useCart();

    const account = useCurrentAccount();
    // Use the new Unified Checkout Hook
    const { checkout, isProcessing } = useCheckout();
    const [open, setOpen] = useState(false);

    // Selected items stats
    const selectedItemsList = getSelectedItems();
    const selectedTotal = selectedItemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const selectedCount = selectedItemsList.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = async () => {
        if (!account) {
            toast.error('Please connect your wallet');
            return;
        }

        if (selectedItemsList.length === 0) {
            toast.error('Please select items to purchase');
            return;
        }

        try {
            // Hardcoded shipping address for MVP (In real app, ask via Form/Dialog before checkout)
            const shippingStart = {
                fullName: 'Buyer Name',
                phone: '0123456789',
                address: '123 Blockchain Street',
                city: 'Sui City'
            };

            // Start checkout directly
            await checkout({
                items: selectedItemsList,
                shippingAddress: shippingStart
            });

            // Remove only the purchased (selected) items on success
            removeSelectedItems();
            setOpen(false);
        } catch (error) {
            // Error is handled in hook (toast)
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative h-9 w-9 p-0 rounded-full border-0 hover:bg-transparent">
                    <div className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors duration-200">
                        <ShoppingCart className="h-5 w-5 text-foreground" />
                    </div>
                    {getTotalItems() > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] ring-2 ring-background animate-in zoom-in-50"
                        >
                            {getTotalItems()}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xl">
                            <ShoppingCart className="h-5 w-5" />
                            My Cart
                            <Badge variant="secondary" className="ml-2">
                                {getTotalItems()} items
                            </Badge>
                        </div>

                        <div className="flex gap-2">
                            {items.length > 0 && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={selectedItems.size === items.length ? deselectAll : selectAll}
                                        className="text-xs"
                                    >
                                        {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearCart}
                                        className="text-muted-foreground hover:text-destructive text-xs"
                                    >
                                        Clear All
                                    </Button>
                                </>
                            )}
                        </div>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 -mr-6 pr-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
                                <ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Your cart is empty</h3>
                                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                                    Looks like you haven't added any items yet.
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => setOpen(false)}
                                className="mt-4"
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-4 border rounded-xl bg-card hover:border-primary/20 transition-colors group">
                                    {/* Checkbox */}
                                    <div className="flex items-center">
                                        <Checkbox
                                            checked={selectedItems.has(item.id)}
                                            onCheckedChange={() => toggleSelection(item.id)}
                                        />
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-secondary/20 flex-shrink-0 border">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-semibold text-base line-clamp-1">
                                                    {item.name}
                                                </h4>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className="flex items-end justify-between mt-2">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {mistToSui(item.price)} SUI / unit
                                                </p>
                                                <p className="font-bold text-lg text-primary">
                                                    {mistToSui(item.price * item.quantity)} SUI
                                                </p>
                                            </div>

                                            {/* Quantity Control */}
                                            <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md hover:bg-background shadow-sm"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center text-sm font-semibold tabular-nums">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md hover:bg-background shadow-sm"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.stock}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="pt-6 mt-auto border-t bg-background">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Selected Subtotal ({selectedCount} items)</span>
                                    <span>{mistToSui(selectedTotal)} SUI</span>
                                </div>
                                <div className="flex items-center justify-between text-xl font-bold">
                                    <span>Total</span>
                                    <span className="text-primary">{mistToSui(selectedTotal)} SUI</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleCheckout}
                                disabled={!account || isProcessing || selectedItemsList.length === 0}
                                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                size="lg"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing Order...
                                    </>
                                ) : !account ? (
                                    'Connect Wallet to Checkout'
                                ) : selectedItemsList.length === 0 ? (
                                    'Select Items to Buy'
                                ) : (
                                    `Checkout (${selectedCount})`
                                )}
                            </Button>

                            <p className="text-[10px] text-center text-muted-foreground/60">
                                Secure checkout powered by Sui Smart Contracts
                            </p>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
