import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/contexts/CartContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useCheckout } from '@/hooks/useCheckout';
import { mistToSui, Product } from '@/lib/sui-utils';
import { validateCartStock } from '@/lib/cart-utils';
import { MapPin, ShoppingCart, X, Trash2, Plus, Minus, Loader2, ChevronRight, PlusCircle } from 'lucide-react';
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

            // ✨ PHASE 2: Validate stock before checkout
            console.log('[CartDrawer] Validating stock for', selectedItemsList.length, 'items');

            // Fetch fresh product data from server
            const freshProducts = await queryClient.fetchQuery<Product[]>({
                queryKey: ['products', 'with-category', 50],
            });

            // Validate cart against fresh stock
            const validation = validateCartStock(selectedItemsList, freshProducts);

            if (!validation.valid) {
                console.warn('[CartDrawer] Stock validation failed');

                // Handle out-of-stock items
                if (validation.outOfStock.length > 0) {
                    for (const item of validation.outOfStock) {
                        removeFromCart(item.id);
                        toast.error(`"${item.name}" is out of stock and has been removed from cart`, {
                            duration: 5000
                        });
                    }
                }

                // Handle insufficient stock
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
                return; // Don't proceed with checkout
            }

            console.log('[CartDrawer] Stock validation passed ✓');

            // ✨ Use real selected address
            const shippingStart = {
                fullName: selectedAddress.full_name,
                phone: selectedAddress.phone,
                address: `${selectedAddress.address_line1}${selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''}`,
                city: `${selectedAddress.city}, ${selectedAddress.country}`
            };

            // Stock OK - proceed with checkout
            const checkoutResult = await checkout({
                items: selectedItemsList,
                shippingAddress: shippingStart
            });

            // ✨ PHASE 3: Only clear cart on full success
            if (checkoutResult.blockchainSuccess && checkoutResult.dbSuccess) {
                // Full success - safe to clear cart
                removeSelectedItems();
                setOpen(false);
            } else if (checkoutResult.blockchainSuccess && !checkoutResult.dbSuccess) {
                // Partial success - keep cart for user reference
                console.warn('[CartDrawer] Keeping cart items - DB save failed');
                // Don't close drawer, let user see their items
            } else {
                // Complete failure - keep cart
                console.error('[CartDrawer] Checkout failed completely');
            }
        } catch (error) {
            // Error is handled in hook (toast)
            console.error('[CartDrawer] Checkout error:', error);
        } finally {
            setIsValidating(false);
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
                    {/* ✨ Shipping Address Section */}
                    {items.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                                Shipping Address
                            </h3>

                            {!account ? (
                                <div className="p-4 rounded-lg border bg-muted/50 text-center text-sm text-muted-foreground">
                                    Connect wallet to manage addresses
                                </div>
                            ) : isLoadingAddresses ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : addresses.length === 0 ? (
                                <div className="p-4 rounded-lg border border-dashed text-center space-y-3">
                                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
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
                                <div className="space-y-3">
                                    <div className="p-4 rounded-xl border bg-card/50 hover:bg-accent/50 transition-colors group relative">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-primary/10 p-2 rounded-full shrink-0">
                                                <MapPin className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-sm truncate">
                                                        {selectedAddress.full_name}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs border-l pl-2">
                                                        {selectedAddress.phone}
                                                    </span>
                                                    {selectedAddress.is_default && (
                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1">Default</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {selectedAddress.address_line1}
                                                    {selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}
                                                    <br />
                                                    {selectedAddress.city}, {selectedAddress.country}
                                                </p>
                                            </div>

                                            <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Change
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Select Shipping Address</DialogTitle>
                                                    </DialogHeader>
                                                    <ScrollArea className="h-[400px] pr-4">
                                                        <div className="space-y-3 pt-2">
                                                            {addresses.map((addr) => (
                                                                <div
                                                                    key={addr.id}
                                                                    onClick={() => {
                                                                        setSelectedAddressId(addr.id);
                                                                        setIsAddressDialogOpen(false);
                                                                    }}
                                                                    className={`cursor-pointer border rounded-xl p-3 transition-all ${selectedAddressId === addr.id
                                                                        ? 'border-primary ring-1 ring-primary bg-primary/5'
                                                                        : 'hover:border-primary/50 hover:bg-secondary/50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedAddressId === addr.id
                                                                            ? 'border-primary'
                                                                            : 'border-muted-foreground'
                                                                            }`}>
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
                                                    <div className="pt-4 mt-2 border-t">
                                                        <Link href="/profile/addresses" onClick={() => {
                                                            setIsAddressDialogOpen(false);
                                                            setOpen(false);
                                                        }}>
                                                            <Button className="w-full" variant="outline">
                                                                <PlusCircle className="w-4 h-4 mr-2" />
                                                                Manage / Add New Address
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="outline" className="w-full" onClick={() => setIsAddressDialogOpen(true)}>
                                    Select Address
                                </Button>
                            )}
                        </div>
                    )}

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
                                disabled={
                                    !account ||
                                    isProcessing ||
                                    isValidating ||
                                    selectedItemsList.length === 0 ||
                                    !selectedAddress
                                }
                                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                size="lg"
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Validating Stock...
                                    </>
                                ) : isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing Order...
                                    </>
                                ) : !account ? (
                                    'Connect Wallet to Checkout'
                                ) : selectedItemsList.length === 0 ? (
                                    'Select Items to Buy'
                                ) : !selectedAddress ? (
                                    'Add Shipping Address'
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
        </Sheet >
    );
}
