'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Copy, ExternalLink, Store, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSuiClient } from '@mysten/dapp-kit';
import { getUserShop } from '@/lib/sui-utils';
import { cn } from '@/lib/utils';

interface SellerInfoPopoverProps {
    sellerAddress: string;
    className?: string;
}

export function SellerInfoPopover({ sellerAddress, className }: SellerInfoPopoverProps) {
    const [copied, setCopied] = useState(false);
    const [shopName, setShopName] = useState<string | null>(null);
    const [shopDescription, setShopDescription] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const suiClient = useSuiClient();

    useEffect(() => {
        const fetchShopInfo = async () => {
            setLoading(true);
            try {
                const shop = await getUserShop(suiClient, sellerAddress);
                if (shop) {
                    setShopName(shop.name);
                    setShopDescription(shop.description);
                }
            } catch (error) {
                console.error('Error fetching shop info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchShopInfo();
    }, [sellerAddress, suiClient]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(sellerAddress);
            setCopied(true);
            toast.success('Address copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy address');
        }
    };

    const handleOpenExplorer = () => {
        window.open(`https://suiscan.xyz/testnet/account/${sellerAddress}`, '_blank');
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className={cn(
                    "flex items-center gap-2 text-neutral-400 cursor-pointer hover:text-white transition-colors group",
                    className
                )}>
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-mono uppercase tracking-wider">
                        Seller: {sellerAddress.slice(0, 6)}...{sellerAddress.slice(-4)}
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="w-96 bg-black/95 border border-white/10 p-0 rounded-none shadow-2xl shadow-blue-500/20"
                align="start"
            >
                <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                            Seller Information
                        </h3>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Shop Info (if available) */}
                    {loading ? (
                        <div className="bg-white/5 border border-white/5 p-4">
                            <div className="flex items-center gap-2 text-neutral-500 text-xs">
                                <Store className="w-4 h-4 animate-pulse" />
                                <span>Loading shop information...</span>
                            </div>
                        </div>
                    ) : shopName ? (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Store className="w-4 h-4 text-blue-400" />
                                <span className="text-xs uppercase text-blue-400 font-bold tracking-wider">
                                    Verified Shop Owner
                                </span>
                            </div>
                            <h4 className="text-base font-bold text-white">
                                {shopName}
                            </h4>
                            {shopDescription && (
                                <p className="text-xs text-neutral-300 leading-relaxed">
                                    {shopDescription}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/5 p-4">
                            <div className="flex items-center gap-2 text-neutral-500 text-xs">
                                <Store className="w-4 h-4" />
                                <span>Individual seller (no shop)</span>
                            </div>
                        </div>
                    )}

                    {/* Wallet Address */}
                    <div className="space-y-2">
                        <span className="text-[10px] uppercase text-neutral-500 tracking-wider">
                            Wallet Address
                        </span>
                        <div className="bg-white/5 border border-white/5 p-3 flex items-center justify-between gap-2">
                            <code className="text-xs font-mono text-blue-300 break-all flex-1">
                                {sellerAddress}
                            </code>
                            <Button
                                onClick={handleCopy}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-white/10 rounded-none"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-neutral-400" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Explorer Link */}
                    <Button
                        onClick={handleOpenExplorer}
                        variant="outline"
                        className="w-full border-white/10 hover:bg-white/5 text-white rounded-none uppercase font-bold tracking-wider h-10 hover:text-blue-400 hover:border-blue-400/30 transition-all"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Sui Explorer
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
