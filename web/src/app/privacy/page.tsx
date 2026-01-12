'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPage() {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navigation />
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{t('privacy.title')}</CardTitle>
                        <p className="text-muted-foreground">{t('privacy.lastUpdated')}</p>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                        <h2>{t('privacy.sections.collection.title')}</h2>
                        <p>
                            {t('privacy.sections.collection.content')}
                        </p>
                        <ul>
                            <li>{t('privacy.sections.collection.list.0')}</li>
                            <li>{t('privacy.sections.collection.list.1')}</li>
                            <li>{t('privacy.sections.collection.list.2')}</li>
                        </ul>

                        <h2>{t('privacy.sections.usage.title')}</h2>
                        <p>
                            {t('privacy.sections.usage.content')}
                        </p>
                        <ul>
                            <li>{t('privacy.sections.usage.list.0')}</li>
                            <li>{t('privacy.sections.usage.list.1')}</li>
                            <li>{t('privacy.sections.usage.list.2')}</li>
                        </ul>

                        <h2>{t('privacy.sections.security.title')}</h2>
                        <p>
                            {t('privacy.sections.security.content')}
                        </p>

                        <h2>{t('privacy.sections.blockchain.title')}</h2>
                        <p>
                            {t('privacy.sections.blockchain.content')}
                        </p>

                        <h2>{t('privacy.sections.contact.title')}</h2>
                        <p>
                            {t('privacy.sections.contact.content')}
                        </p>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
