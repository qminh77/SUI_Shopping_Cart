'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TermsPage() {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navigation />
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{t('terms.title')}</CardTitle>
                        <p className="text-muted-foreground">{t('terms.lastUpdated')}</p>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                        <h2>{t('terms.sections.acceptance.title')}</h2>
                        <p>
                            {t('terms.sections.acceptance.content')}
                        </p>

                        <h2>{t('terms.sections.useOfService.title')}</h2>
                        <p>
                            {t('terms.sections.useOfService.content')}
                        </p>

                        <h2>{t('terms.sections.seller.title')}</h2>
                        <p>
                            {t('terms.sections.seller.content')}
                        </p>
                        <ul>
                            <li>{t('terms.sections.seller.list.0')}</li>
                            <li>{t('terms.sections.seller.list.1')}</li>
                            <li>{t('terms.sections.seller.list.2')}</li>
                            <li>{t('terms.sections.seller.list.3')}</li>
                        </ul>

                        <h2>{t('terms.sections.buyer.title')}</h2>
                        <p>
                            {t('terms.sections.buyer.content')}
                        </p>
                        <ul>
                            <li>{t('terms.sections.buyer.list.0')}</li>
                            <li>{t('terms.sections.buyer.list.1')}</li>
                            <li>{t('terms.sections.buyer.list.2')}</li>
                        </ul>

                        <h2>{t('terms.sections.blockchain.title')}</h2>
                        <p>
                            {t('terms.sections.blockchain.content')}
                        </p>

                        <h2>{t('terms.sections.liability.title')}</h2>
                        <p>
                            {t('terms.sections.liability.content')}
                        </p>

                        <h2>{t('terms.sections.modifications.title')}</h2>
                        <p>
                            {t('terms.sections.modifications.content')}
                        </p>

                        <h2>{t('terms.sections.contact.title')}</h2>
                        <p>
                            {t('terms.sections.contact.content')}
                        </p>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
