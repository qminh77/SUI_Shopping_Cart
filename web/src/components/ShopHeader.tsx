import React from 'react';
import Link from 'next/link';
import { Store, Mail, Phone, MapPin, Calendar, ExternalLink, Facebook, Instagram, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { formatAddress } from '@/lib/sui-utils';

interface ShopHeaderProps {
    shop: {
        id: string;
        owner_wallet: string;
        shop_name: string;
        shop_description: string;
        business_type: string;
        established_year: number;
        website?: string;
        contact_email: string;
        contact_phone: string;
        address_city: string;
        address_detail: string;
        logo_url?: string;
        facebook_url?: string;
        instagram_url?: string;
        support_policy?: string;
        return_policy?: string;
        warranty_policy?: string;
        status: string;
        created_at: string;
    };
    productCount: number;
}

export function ShopHeader({ shop, productCount }: ShopHeaderProps) {
    const isActive = shop.status === 'ACTIVE';

    return (
        <div className="border-b border-border bg-background/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Shop Info Card */}
                <Card className="border-border/50 bg-background/80 backdrop-blur-sm">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg border-2 border-border overflow-hidden bg-muted/10">
                                    {shop.logo_url ? (
                                        <img
                                            src={shop.logo_url}
                                            alt={shop.shop_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Store className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/30" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-4">
                                {/* Name & Status */}
                                <div className="space-y-2">
                                    <div className="flex items-start gap-3 flex-wrap">
                                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                            {shop.shop_name}
                                        </h1>
                                        <Badge
                                            variant={isActive ? "default" : "secondary"}
                                            className="mt-1"
                                        >
                                            {shop.status}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                        {shop.shop_description}
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Store className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-semibold">{productCount}</span>
                                        <span className="text-muted-foreground">Products</span>
                                    </div>
                                    <Separator orientation="vertical" className="h-5" />
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Since {shop.established_year}</span>
                                    </div>
                                    <Separator orientation="vertical" className="h-5" />
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {shop.business_type}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="flex flex-wrap gap-3 text-sm">
                                    <a
                                        href={`mailto:${shop.contact_email}`}
                                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        <span className="hover:underline">{shop.contact_email}</span>
                                    </a>
                                    <Separator orientation="vertical" className="h-5" />
                                    <a
                                        href={`tel:${shop.contact_phone}`}
                                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span className="hover:underline">{shop.contact_phone}</span>
                                    </a>
                                    <Separator orientation="vertical" className="h-5" />
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        <span>{shop.address_city}</span>
                                    </div>
                                </div>

                                {/* Social Links */}
                                {(shop.website || shop.facebook_url || shop.instagram_url) && (
                                    <div className="flex flex-wrap gap-2">
                                        {shop.website && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={shop.website} target="_blank" rel="noopener noreferrer">
                                                    <Globe className="w-4 h-4 mr-2" />
                                                    Website
                                                    <ExternalLink className="w-3 h-3 ml-2" />
                                                </a>
                                            </Button>
                                        )}
                                        {shop.facebook_url && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={shop.facebook_url} target="_blank" rel="noopener noreferrer">
                                                    <Facebook className="w-4 h-4 mr-2" />
                                                    Facebook
                                                </a>
                                            </Button>
                                        )}
                                        {shop.instagram_url && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={shop.instagram_url} target="_blank" rel="noopener noreferrer">
                                                    <Instagram className="w-4 h-4 mr-2" />
                                                    Instagram
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Wallet Address */}
                                <div className="pt-2">
                                    <p className="text-xs text-muted-foreground font-mono">
                                        Wallet: {formatAddress(shop.owner_wallet, 12)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Policies */}
                        {(shop.support_policy || shop.return_policy || shop.warranty_policy) && (
                            <div className="mt-6 pt-6 border-t border-border/50">
                                <Accordion type="single" collapsible className="w-full">
                                    {shop.support_policy && (
                                        <AccordionItem value="support" className="border-border/50">
                                            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                                Support Policy
                                            </AccordionTrigger>
                                            <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line">
                                                {shop.support_policy}
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}
                                    {shop.return_policy && (
                                        <AccordionItem value="return" className="border-border/50">
                                            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                                Return Policy
                                            </AccordionTrigger>
                                            <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line">
                                                {shop.return_policy}
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}
                                    {shop.warranty_policy && (
                                        <AccordionItem value="warranty" className="border-border/50">
                                            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                                Warranty Policy
                                            </AccordionTrigger>
                                            <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line">
                                                {shop.warranty_policy}
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}
                                </Accordion>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
