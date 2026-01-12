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
import { useLanguage } from '@/contexts/LanguageContext';

export function CartDrawer() {
    const { t } = useLanguage();
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
            toast.error(t('toast.connectWallet'));
            return;
        }

        if (selectedItemsList.length === 0) {
            toast.error(t('toast.selectItems'));
            return;
        }

        if (!selectedAddress) {
            toast.error(t('toast.selectAddress'));
            return;
        }

        try {
            setIsValidating(true);

            console.log('[CartDrawer] Validating stock for', selectedItemsList.length, 'items');

            // ✅ FIX H2: Add try-catch for stock validation query
            let freshProducts: Product[] = [];
            try {
                freshProducts = await queryClient.fetchQuery<Product[]>({
                    queryKey: ['products', 'with-category', 50],
                }) || [];

                if (freshProducts.length === 0) {
                    console.warn('[CartDrawer] No products found for validation - skipping stock check');
                    // Proceed without validation if no products available
                }
            } catch (queryError) {
                console.error('[CartDrawer] Failed to fetch products for validation:', queryError);
                toast.warning(t('toast.stockCheckSkipped'), {
                    duration: 3000
                });
                // Proceed without validation rather than blocking checkout
            }

            const validation = validateCartStock(selectedItemsList, freshProducts);

            if (!validation.valid) {
                console.warn('[CartDrawer] Stock validation failed');

                if (validation.outOfStock.length > 0) {
                    for (const item of validation.outOfStock) {
                        removeFromCart(item.id);
                        toast.error(t('toast.outOfStockRemoved', { name: item.name }), {
                            duration: 5000
                        });
                    }
                }

                if (validation.insufficientStock.length > 0) {
                    for (const issue of validation.insufficientStock) {
                        updateQuantity(issue.product.id, issue.available);
                        toast.warning(
                            t('toast.quantityAdjusted', {
                                name: issue.product.name,
                                available: issue.available,
                                requested: issue.requested
                            }),
                            { duration: 5000 }
                        );
                    }
                }

                toast.error(t('toast.stockValidationFailed'), {
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

            // ✅ Cart is now auto-cleared by useCheckout hook
            // Only handle UI state here
            if (checkoutResult.blockchainSuccess && checkoutResult.dbSuccess) {
                setOpen(false); // Close drawer on successful checkout
            } else if (checkoutResult.blockchainSuccess && !checkoutResult.dbSuccess) {
                console.warn('[CartDrawer] Keeping drawer open - DB save failed');
                // Keep drawer open so user can see the warning
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
                            <span className="text-xl font-bold tracking-tight">{t('cart.title')}</span>
                            <Badge variant="secondary" className="rounded-full px-3 font-normal">
                                {getTotalItems()} {t('cart.items')}
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
                                {t('cart.remove')}
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
                                <h3 className="font-semibold text-xl">{t('cart.empty')}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t('cart.emptyMessage')}
                                </p>
                            </div>
                            <Button
                                onClick={() => setOpen(false)}
                                className="min-w-[140px]"
                            >
                                {t('cart.startShopping')}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8 pb-32">
                            {/* Address Section */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> {t('checkout.shippingAddress')}
                                </h3>

                                {!account ? (
                                    <div className="p-4 rounded-xl border-dashed border bg-muted/30 text-center text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                                        {t('nav.connectWallet')}
                                    </div>
                                ) : isLoadingAddresses ? (
                                    <div className="flex justify-center p-6 rounded-xl border bg-card/50">
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : addresses.length === 0 ? (
                                    <div className="p-6 rounded-xl border border-dashed text-center space-y-3 bg-card/50">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">{t('checkout.noAddresses')}</p>
                                            <p className="text-xs text-muted-foreground">{t('checkout.addAddressToProceed')}</p>
                                        </div>
                                        <Link href="/profile/addresses" onClick={() => setOpen(false)}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                <PlusCircle className="w-3 h-3 mr-2" />
                                                {t('profile.addNewAddress')}
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
                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-auto">{t('profile.default')}</Badge>
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
                                                        {t('checkout.changeAddress')}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>{t('checkout.selectAddress')}</DialogTitle>
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
                                                                                    <Badge variant="secondary" className="text-[10px]">{t('profile.default')}</Badge>
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
                                                                {t('profile.addNewAddress')}
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
                                        {t('checkout.selectShipping')}
                                    </Button>
                                )}
                            </div>

                            {/* Cart Items */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Package className="w-3 h-3" /> {t('cart.items')} ({items.length})
                                    </h3>
                                    {items.length > 0 && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={selectedItems.size === items.length ? deselectAll : selectAll}
                                            className="h-auto p-0 text-xs text-primary"
                                        >
                                            {selectedItems.size === items.length ? t('cart.deselectAll') : t('cart.selectAll')}
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
                                                    {t('cart.unitPrice', { price: mistToSui(item.price) })}
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
                                    <span>{t('cart.subtotal')} ({selectedCount} {t('cart.items')})</span>
                                    <span>{mistToSui(selectedTotal)} SUI</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold">{t('cart.total')}</span>
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
                                        {t('cart.validating')}
                                    </>
                                ) : isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('checkout.processing')}
                                    </>
                                ) : !account ? (
                                    t('nav.connectWallet')
                                ) : selectedItemsList.length === 0 ? (
                                    t('cart.selectItems')
                                ) : !selectedAddress ? (
                                    t('checkout.selectAddress')
                                ) : (
                                    <span className="flex items-center">
                                        {t('cart.checkout')} <ArrowRight className="ml-2 h-4 w-4" />
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
