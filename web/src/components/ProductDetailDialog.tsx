'use client';

import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/lib/sui-utils';
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Product, mistToSui } from '@/lib/sui-utils';
import { useCart } from '@/contexts/CartContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useKiosk } from '@/hooks/useKiosk';
import { ShoppingCart, Clock, Package } from 'lucide-react';
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SellerInfoPopover } from './SellerInfoPopover';

interface ProductDetailDialogProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kioskId?: string;
}

export function ProductDetailDialog({ product, open, onOpenChange, kioskId }: ProductDetailDialogProps) {
    const { addToCart, items } = useCart();
    const account = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const { purchaseFromKiosk, isPurchasing: isKioskPurchasing } = useKiosk(account?.address);
    const [quantity, setQuantity] = useState(1);
    const [isBuying, setIsBuying] = useState(false);

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

        setIsBuying(true);

        try {
            // Path 1: Legacy Kiosk Purchase (Unique NFT)
            if (kioskId) {
                await purchaseFromKiosk({
                    kioskId,
                    productId: product.id,
                    price: product.price,
                    productName: product.name,
                    seller: product.creator,
                });
                onOpenChange(false);
                return;
            }

            // Path 2: Shared Object Purchase (E-commerce Inventory)
            const tx = new Transaction();
            const totalAmount = BigInt(product.price) * BigInt(quantity);

            // Split coins for payment
            const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(totalAmount)]);

            // Call purchase::buy
            tx.moveCall({
                target: `${PACKAGE_ID}::purchase::buy`,
                arguments: [
                    tx.object(product.id),
                    tx.pure.u64(quantity),
                    payment,
                ],
            });

            await signAndExecute({
                transaction: tx,
            }, {
                onSuccess: () => {
                    toast.success('Purchase successful! Receipt sent to your wallet.');
                    onOpenChange(false);
                },
                onError: (err) => {
                    console.error('Purchase failed', err);
                    toast.error('Purchase failed: ' + err.message);
                }
            });

        } catch (error: any) {
            console.error('Purchase structure error:', error);
            toast.error(error.message || 'Purchase failed');
        } finally {
            setIsBuying(false);
        }
    };

    const isProcessing = isKioskPurchasing || isBuying;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[90vw] w-full h-[85vh] bg-black/95 border border-white/10 p-0 overflow-hidden gap-0 sm:rounded-none flex flex-col md:flex-row shadow-2xl shadow-blue-500/10" aria-describedby="product-dialog-description">
                <div className="flex flex-col md:flex-row w-full h-full">
                    {/* Left details - Image (55%) */}
                    <div className="relative w-full md:w-[55%] h-1/2 md:h-full bg-neutral-900 border-b md:border-b-0 md:border-r border-white/10 group">
                        {product.imageUrl ? (
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-950">
                                <Package className="w-32 h-32 text-neutral-800" />
                            </div>
                        )}

                        <div className="absolute top-8 left-8 z-10">
                            <Badge variant="secondary" className="bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 rounded-none uppercase tracking-[0.2em] text-xs px-4 py-2 font-bold shadow-xl">
                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                        </div>
                    </div>

                    {/* Right details - Info (45%) */}
                    <div className="w-full md:w-[45%] flex flex-col h-full bg-black/50 relative">
                        {/* Scrollable Content Area */}

                        <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-8 md:p-10">
                            <div className="space-y-8">
                                {/* Header */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <SellerInfoPopover sellerAddress={product.creator} />
                                        <Badge variant="outline" className={cn("rounded-none uppercase tracking-wider text-[10px] border-white/10 text-neutral-400")}>
                                            ID: {product.id.slice(0, 6)}...
                                        </Badge>
                                    </div>


                                    <div className="space-y-2">
                                        <DialogTitle className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-[1.1] uppercase font-sans">
                                            {product.name}
                                        </DialogTitle>
                                        <div className="flex items-baseline gap-3 pt-2">
                                            <span className="text-3xl font-bold text-blue-500 font-mono tracking-tighter">
                                                {mistToSui(product.price)}
                                            </span>
                                            <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest">SUI Token</span>
                                        </div>

                                        {/* Quantity Selector */}
                                        <div className="space-y-2 pt-4">
                                            <span className="text-xs uppercase tracking-wider text-neutral-500">Quantity</span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="h-8 w-8 p-0 rounded-none border-white/20"
                                                    variant="outline"
                                                    disabled={isProcessing}
                                                >
                                                    -
                                                </Button>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={product.stock}
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                                                    className="h-8 w-16 text-center bg-black/40 border-white/20 rounded-none text-white"
                                                    disabled={isProcessing}
                                                />
                                                <Button
                                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                                    className="h-8 w-8 p-0 rounded-none border-white/20"
                                                    variant="outline"
                                                    disabled={isProcessing}
                                                >
                                                    +
                                                </Button>
                                                <span className="text-xs text-neutral-500 ml-2">of {product.stock} available</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-white/10" />

                                {/* Description */}
                                <div className="space-y-4" id="product-dialog-description">
                                    <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 flex items-center gap-2">
                                        Description
                                    </h4>
                                    <p className="text-neutral-300 leading-relaxed text-sm font-light whitespace-pre-wrap">
                                        {product.description}
                                    </p>
                                </div>

                                <Separator className="bg-white/10" />

                                {/* Meta Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/[0.02] border border-white/5 p-4 hover:border-white/10 transition-colors">
                                        <span className="text-[10px] uppercase text-neutral-500 block mb-2 tracking-wider">Status</span>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("w-2 h-2 rounded-full", product.stock > 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")}></span>
                                            <span className="text-sm font-bold text-white uppercase tracking-tight">
                                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 p-4 hover:border-white/10 transition-colors">
                                        <span className="text-[10px] uppercase text-neutral-500 block mb-2 tracking-wider">Minted Date</span>
                                        <div className="flex items-center gap-2 text-white">
                                            <Clock className="w-3 h-3 text-neutral-500" />
                                            <span className="text-sm font-mono">
                                                {new Date(product.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-6 border-t border-white/10 bg-black/80 backdrop-blur-xl z-20 mt-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={handleBuyNow}
                                    disabled={!account || isProcessing || product.stock <= 0}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-none uppercase font-bold tracking-widest h-14 cut-corner-bottom-right shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all duration-300"
                                >
                                    {isProcessing ? 'Processing...' : !account ? 'Connect Wallet' : product.stock <= 0 ? 'Out of Stock' : 'Purchase Now'}
                                </Button>

                                <Button
                                    onClick={handleAddToCart}
                                    disabled={isInCart || product.stock <= 0}
                                    variant="outline"
                                    className="w-full border-white/10 hover:bg-white/5 text-white rounded-none uppercase font-bold tracking-widest h-14 hover:text-blue-400 hover:border-blue-400/30 transition-all duration-300"
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    {isInCart ? 'In Cart' : 'Add to Cart'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
