'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navigation />
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Privacy Policy</CardTitle>
                        <p className="text-muted-foreground">Last updated: January 10, 2026</p>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                        <h2>1. Information We Collect</h2>
                        <p>
                            We collect information that you provide directly to us, including:
                        </p>
                        <ul>
                            <li>Wallet addresses when you connect to our platform</li>
                            <li>Transaction data on the SUI blockchain</li>
                            <li>Shop information when you register as a seller</li>
                        </ul>

                        <h2>2. How We Use Your Information</h2>
                        <p>
                            We use the information we collect to:
                        </p>
                        <ul>
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process transactions and send related information</li>
                            <li>Send you technical notices and support messages</li>
                        </ul>

                        <h2>3. Data Security</h2>
                        <p>
                            We implement appropriate security measures to protect your personal information.
                            However, no method of transmission over the Internet is 100% secure.
                        </p>

                        <h2>4. Blockchain Data</h2>
                        <p>
                            Transactions on the SUI blockchain are public and permanent. Your wallet address
                            and transaction history are publicly visible on the blockchain.
                        </p>

                        <h2>5. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us through
                            our support channels.
                        </p>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
