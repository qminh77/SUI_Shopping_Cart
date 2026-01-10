'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navigation />
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Terms of Service</CardTitle>
                        <p className="text-muted-foreground">Last updated: January 10, 2026</p>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using this marketplace, you accept and agree to be bound by
                            the terms and provision of this agreement.
                        </p>

                        <h2>2. Use of Service</h2>
                        <p>
                            You agree to use this service only for lawful purposes and in accordance with
                            these Terms of Service.
                        </p>

                        <h2>3. Seller Responsibilities</h2>
                        <p>
                            If you register as a seller, you agree to:
                        </p>
                        <ul>
                            <li>Provide accurate and complete shop information</li>
                            <li>List only legitimate products for sale</li>
                            <li>Honor all sales and deliver products as described</li>
                            <li>Comply with all applicable laws and regulations</li>
                        </ul>

                        <h2>4. Buyer Responsibilities</h2>
                        <p>
                            As a buyer, you agree to:
                        </p>
                        <ul>
                            <li>Make purchases in good faith</li>
                            <li>Pay for items you purchase</li>
                            <li>Provide accurate shipping information</li>
                        </ul>

                        <h2>5. Blockchain Transactions</h2>
                        <p>
                            All transactions are executed on the SUI blockchain and are irreversible.
                            Once a transaction is confirmed, it cannot be undone.
                        </p>

                        <h2>6. Limitation of Liability</h2>
                        <p>
                            This platform facilitates peer-to-peer transactions. We are not responsible
                            for disputes between buyers and sellers, product quality, or delivery issues.
                        </p>

                        <h2>7. Modifications to Terms</h2>
                        <p>
                            We reserve the right to modify these terms at any time. Continued use of the
                            service constitutes acceptance of modified terms.
                        </p>

                        <h2>8. Contact</h2>
                        <p>
                            For questions about these Terms of Service, please contact our support team.
                        </p>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
