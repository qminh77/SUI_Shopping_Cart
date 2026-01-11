import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/contexts/CartContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useCheckout } from '@/hooks/useCheckout';
import { mistToSui, Product } from '@/lib/sui-utils';
import { validateCartStock } from '@/lib/cart-utils';
import { MapPin, ShoppingCart, X, Trash2, Plus, Minus, Loader2, ChevronRight, PlusCircle, ArrowRight, Package } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAddresses } from '@/hooks/useAddresses';
import { Address } from '@/lib/sui-utils';
import { AddressCard } from '@/components/addresses/AddressCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    const { checkout, isProcessing } = useCheckout();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    // ✨ Address Management
    const { addresses, isLoading: isLoadingAddresses } = useAddresses();
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

    // Auto-select default address
    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses.find(a => a.is_default);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id);
            } else {
                setSelectedAddressId(addresses[0].id);
            }
        }
    }, [addresses, selectedAddressId]);

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

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

        if (!selectedAddress) {
            toast.error('Please select a shipping address');
            return;
        }

        try {
            setIsValidating(true);

            console.log('[CartDrawer] Validating stock for', selectedItemsList.length, 'items');

            const freshProducts = await queryClient.fetchQuery<Product[]>({
                queryKey: ['products', 'with-category', 50],
            });

            const validation = validateCartStock(selectedItemsList, freshProducts);

            if (!validation.valid) {
                console.warn('[CartDrawer] Stock validation failed');

                if (validation.outOfStock.length > 0) {
                    for (const item of validation.outOfStock) {
                        removeFromCart(item.id);
                        toast.error(`"${item.name}" is out of stock and has been removed from cart`, {
                            duration: 5000
                        });
                    }
                }

                if (validation.insufficientStock.length > 0) {
                    for (const issue of validation.insufficientStock) {
                        updateQuantity(issue.product.id, issue.available);
                        toast.warning(
                            `"${issue.product.name}": Only ${issue.available} available. Quantity updated from ${issue.requested} to ${issue.available}`,
                            { duration: 5000 }
                        );
                    }
                }

                toast.error('Some items were out of stock. Please review your cart and try again.', {
                    duration: 6000
                });

                setIsValidating(false);
                return;
            }

            console.log('[CartDrawer] Stock validation passed ✓');

            const shippingStart = {
                fullName: selectedAddress.full_name,
                phone: selectedAddress.phone,
                address: `${selectedAddress.address_line1}${selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''}`,
                city: `${selectedAddress.city}, ${selectedAddress.country}`
            };

            const checkoutResult = await checkout({
                items: selectedItemsList,
                shippingAddress: shippingStart
            });

            if (checkoutResult.blockchainSuccess && checkoutResult.dbSuccess) {
                removeSelectedItems();
                setOpen(false);
            } else if (checkoutResult.blockchainSuccess && !checkoutResult.dbSuccess) {
                console.warn('[CartDrawer] Keeping cart items - DB save failed');
            } else {
                console.error('[CartDrawer] Checkout failed completely');
            }
        } catch (error) {
            console.error('[CartDrawer] Checkout error:', error);
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative h-10 w-10 p-0 rounded-full border-input bg-background hover:bg-accent hover:text-accent-foreground">
                    <ShoppingCart className="h-5 w-5" />
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

            <SheetContent className="w-full sm:max-w-xl flex flex-col p-0 gap-0">
                <SheetHeader className="px-6 py-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
                    <SheetTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold tracking-tight">Shopping Cart</span>
                            <Badge variant="secondary" className="rounded-full px-3 font-normal">
                                {getTotalItems()} items
                            </Badge>
                        </div>
                        {items.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCart}
                                className="text-muted-foreground hover:text-destructive text-xs h-8 px-2"
                            >
                                <Trash2 className="w-3 h-3 mr-1.5" />
                                Clear
                            </Button>
                        )}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-none">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in-50 duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <div className="w-32 h-32 rounded-full bg-secondary/30 flex items-center justify-center relative">
                                    <ShoppingCart className="w-12 h-12 text-muted-foreground/50" />
                                </div>
                            </div>
                            <div className="space-y-2 max-w-xs mx-auto">
                                <h3 className="font-semibold text-xl">Your cart is empty</h3>
                                <p className="text-sm text-muted-foreground">
                                    Looks like you haven't added anything to your cart yet.
                                </p>
                            </div>
                            <Button
                                onClick={() => setOpen(false)}
                                className="min-w-[140px]"
                            >
                                Start Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8 pb-32">
                            {/* Address Section */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Shipping Address
                                </h3>

                                {!account ? (
                                    <div className="p-4 rounded-xl border-dashed border bg-muted/30 text-center text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                                        Connect wallet to set shipping address
                                    </div>
                                ) : isLoadingAddresses ? (
                                    <div className="flex justify-center p-6 rounded-xl border bg-card/50">
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : addresses.length === 0 ? (
                                    <div className="p-6 rounded-xl border border-dashed text-center space-y-3 bg-card/50">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">No addresses found</p>
                                            <p className="text-xs text-muted-foreground">Add an address to proceed with checkout</p>
                                        </div>
                                        <Link href="/profile/addresses" onClick={() => setOpen(false)}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                <PlusCircle className="w-3 h-3 mr-2" />
                                                Add New Address
                                            </Button>
                                        </Link>
                                    </div>
                                ) : selectedAddress ? (
                                    <div className="group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">{selectedAddress.full_name}</span>
                                                    <Separator orientation="vertical" className="h-3" />
                                                    <span className="text-xs text-muted-foreground">{selectedAddress.phone}</span>
                                                    {selectedAddress.is_default && (
                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-auto">Default</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed pr-10">
                                                    {selectedAddress.address_line1}
                                                    {selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}
                                                    <br />
                                                    {selectedAddress.city}, {selectedAddress.country}
                                                </p>
                                            </div>

                                            <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Change
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Select Shipping Address</DialogTitle>
                                                    </DialogHeader>
                                                    <ScrollArea className="h-[400px] -mr-4 pr-4">
                                                        <div className="space-y-3 pt-2">
                                                            {addresses.map((addr) => (
                                                                <div
                                                                    key={addr.id}
                                                                    onClick={() => {
                                                                        setSelectedAddressId(addr.id);
                                                                        setIsAddressDialogOpen(false);
                                                                    }}
                                                                    className={cn(
                                                                        "cursor-pointer border rounded-xl p-4 transition-all hover:bg-muted/50",
                                                                        selectedAddressId === addr.id && "border-primary bg-primary/5 ring-1 ring-primary"
                                                                    )}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={cn(
                                                                            "mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                                                                            selectedAddressId === addr.id ? "border-primary" : "border-muted-foreground"
                                                                        )}>
                                                                            {selectedAddressId === addr.id && (
                                                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="font-medium text-sm">{addr.full_name}</span>
                                                                                <span className="text-xs text-muted-foreground">{addr.phone}</span>
                                                                                {addr.is_default && (
                                                                                    <Badge variant="secondary" className="text-[10px]">Default</Badge>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                                                {addr.address_line1}, {addr.city}, {addr.country}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                    <div className="pt-4 border-t mt-2">
                                                        <Link href="/profile/addresses" onClick={() => {
                                                            setIsAddressDialogOpen(false);
                                                            setOpen(false);
                                                        }}>
                                                            <Button className="w-full" variant="outline">
                                                                <PlusCircle className="w-4 h-4 mr-2" />
                                                                Add New Address
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                ) : (
                                    <Button variant="outline" className="w-full h-auto py-4 border-dashed" onClick={() => setIsAddressDialogOpen(true)}>
                                        <PlusCircle className="w-4 h-4 mr-2" />
                                        Select Shipping Address
                                    </Button>
                                )}
                            </div>

                            {/* Cart Items */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Package className="w-3 h-3" /> Items ({items.length})
                                    </h3>
                                    {items.length > 0 && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={selectedItems.size === items.length ? deselectAll : selectAll}
                                            className="h-auto p-0 text-xs text-primary"
                                        >
                                            {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
                                        </Button>
                                    )}
                                </div>

                                {items.map((item) => (
                                    <div key={item.id} className="group relative flex gap-4 p-3 rounded-2xl border bg-card hover:border-primary/30 transition-all hover:shadow-sm">
                                        <div className="flex items-center">
                                            <Checkbox
                                                checked={selectedItems.has(item.id)}
                                                onCheckedChange={() => toggleSelection(item.id)}
                                                className="h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                                            />
                                        </div>

                                        <div className="relative aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border bg-secondary/20">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>

                                        <div className="flex flex-1 flex-col justify-between py-1 min-w-0">
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-2">
                                                    <h4 className="font-medium text-sm leading-snug line-clamp-2" title={item.name}>
                                                        {item.name}
                                                    </h4>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-muted-foreground/50 hover:text-destructive transition-colors -mt-1 -mr-1 p-1"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Unit Price: {mistToSui(item.price)} SUI
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <p className="font-bold text-primary">
                                                    {mistToSui(item.price * item.quantity)} SUI
                                                </p>

                                                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5 border">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-md hover:bg-background"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-8 text-center text-xs font-semibold tabular-nums">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-md hover:bg-background"
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
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="border-t bg-background/90 p-6 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-muted-foreground text-sm">
                                    <span>Subtotal ({selectedCount} items)</span>
                                    <span>{mistToSui(selectedTotal)} SUI</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-2xl font-bold text-primary">{mistToSui(selectedTotal)} SUI</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleCheckout}
                                disabled={
                                    !account ||
                                    isProcessing ||
                                    isValidating ||
                                    selectedItemsList.length === 0 ||
                                    !selectedAddress
                                }
                                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all rounded-xl"
                                size="lg"
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Validating...
                                    </>
                                ) : isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : !account ? (
                                    'Connect Wallet to Checkout'
                                ) : selectedItemsList.length === 0 ? (
                                    'Select Items to Checkout'
                                ) : !selectedAddress ? (
                                    'Select Shipping Address'
                                ) : (
                                    <span className="flex items-center">
                                        Checkout Now <ArrowRight className="ml-2 h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
