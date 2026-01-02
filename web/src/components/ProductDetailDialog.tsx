'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, mistToSui, formatAddress } from '@/lib/sui-utils';
import { useCart } from '@/contexts/CartContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useProducts } from '@/hooks/useProducts';
import { useKiosk } from '@/hooks/useKiosk';
import { ShoppingCart, Clock, Package, Share2, ShieldCheck } from 'lucide-react';
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
            toast.error('Purchase failed');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl bg-black/95 border border-white/10 p-0 overflow-hidden gap-0 sm:rounded-none">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left: Image Section */}
                    <div className="relative aspect-square md:aspect-auto h-full min-h-[400px] bg-neutral-900 border-b md:border-b-0 md:border-r border-white/10">
                        {product.imageUrl ? (
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-20 h-20 text-neutral-800" />
                            </div>
                        )}

                        <div className="absolute top-4 left-4">
                            <Badge variant="secondary" className="bg-black/60 backdrop-blur border-white/10 text-white hover:bg-black/70 rounded-none uppercase tracking-widest text-[10px]">
                                NFT Product
                            </Badge>
                        </div>
                    </div>

                    {/* Right: Details Section */}
                    <div className="p-8 flex flex-col h-full bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-opacity-5">
                        <DialogHeader className="mb-6 text-left">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-blue-500" />
                                    Seller: {formatAddress(product.creator)}
                                </span>
                                <Badge variant={product.listed ? "default" : "secondary"} className={cn("rounded-none uppercase tracking-wider text-[10px]", product.listed ? "bg-green-900/20 text-green-400 hover:bg-green-900/30 border-green-500/20" : "")}>
                                    {product.listed ? 'Listed' : 'Unlisted'}
                                </Badge>
                            </div>

                            <DialogTitle className="text-3xl font-bold tracking-tight text-white mb-2">{product.name}</DialogTitle>

                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-blue-400">{mistToSui(product.price)}</span>
                                <span className="text-sm font-mono text-neutral-500">SUI</span>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 flex-1">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Description</h4>
                                <DialogDescription className="text-neutral-300 leading-relaxed text-sm">
                                    {product.description}
                                </DialogDescription>
                            </div>

                            <div className="bg-white/5 border border-white/5 p-4 space-y-3">
                                <div>
                                    <span className="text-[10px] uppercase text-neutral-500 block mb-1">Product ID</span>
                                    <code className="text-xs font-mono text-blue-300 bg-blue-900/20 px-2 py-1 block w-full truncate border border-blue-500/20">
                                        {product.id}
                                    </code>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <Clock className="w-3 h-3" />
                                    <span>Created {new Date(product.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 mt-auto grid grid-cols-2 gap-4">
                            <Button
                                onClick={handleBuyNow}
                                disabled={!account || isPurchasing || !product.listed}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-none uppercase font-bold tracking-wider h-12 cut-corner-bottom-right"
                            >
                                {isPurchasing ? 'Processing...' : !account ? 'Connect Wallet' : 'Buy Now'}
                            </Button>

                            <Button
                                onClick={handleAddToCart}
                                disabled={isInCart || !product.listed}
                                variant="outline"
                                className="w-full border-white/10 hover:bg-white/5 text-white rounded-none uppercase font-bold tracking-wider h-12 hover:text-blue-400"
                            >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                {isInCart ? 'In Cart' : 'Add to Cart'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
