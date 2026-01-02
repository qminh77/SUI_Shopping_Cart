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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Product, mistToSui, formatAddress } from '@/lib/sui-utils';
import { useCart } from '@/contexts/CartContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useProducts } from '@/hooks/useProducts';
import { useKiosk } from '@/hooks/useKiosk';
import { ShoppingCart, Clock, Package, Share2, ShieldCheck, ExternalLink } from 'lucide-react';
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductDetailDialogProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kioskId?: string;
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
                                NFT Asset
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
                                        <div className="flex items-center gap-2 text-neutral-400 group cursor-pointer hover:text-white transition-colors">
                                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-mono uppercase tracking-wider">
                                                Seller: {formatAddress(product.creator)}
                                            </span>
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
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
                                            <span className={cn("w-2 h-2 rounded-full", product.listed ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")}></span>
                                            <span className="text-sm font-bold text-white uppercase tracking-tight">
                                                {product.listed ? 'Listed for Sale' : 'Private'}
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
                                    disabled={!account || isPurchasing || !product.listed}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-none uppercase font-bold tracking-widest h-14 cut-corner-bottom-right shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all duration-300"
                                >
                                    {isPurchasing ? 'Processing...' : !account ? 'Connect Wallet' : 'Purchase Now'}
                                </Button>

                                <Button
                                    onClick={handleAddToCart}
                                    disabled={isInCart || !product.listed}
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
