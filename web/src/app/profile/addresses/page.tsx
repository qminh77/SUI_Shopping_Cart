'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AddressList } from '@/components/addresses/AddressList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { MapPin, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AddressesPage() {
    const account = useCurrentAccount();
    const { t } = useLanguage();

    if (!account) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navigation />
                <main className="flex-1 flex items-center justify-center px-4">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 px-8">
                            <MapPin className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">{t('profile.addresses.connectWallet')}</h2>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                {t('profile.addresses.connectWalletDesc')}
                            </p>
                            <Button asChild>
                                <Link href="/shop">
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    {t('profile.addresses.goToShop')}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navigation />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        <MapPin className="w-8 h-8 text-primary" />
                        {t('profile.addresses.title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('profile.addresses.subtitle')}
                    </p>
                </div>

                {/* Address List Component */}
                <AddressList />
            </main>

            <Footer />
        </div>
    );
}
