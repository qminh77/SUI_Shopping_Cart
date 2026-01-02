'use client';

import { WalletConnection } from '@/components/WalletConnection';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary" />
              <span className="text-xl font-semibold">Sui Commerce</span>
            </div>
            <WalletConnection />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6">
        <div className="py-24 text-center max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="mb-4">
              Powered by Sui Blockchain
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Web3 E-commerce
              <br />
              <span className="text-muted-foreground">Redefined</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A decentralized marketplace where products are NFTs, ownership is transparent,
              and transactions are secured on-chain.
            </p>
          </div>

          {/* Connection Status */}
          {account ? (
            <div className="max-w-md mx-auto space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="font-medium">Connected</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {account.address}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Link href="/shop">
                  <Button className="w-full" size="lg">
                    Browse Marketplace
                  </Button>
                </Link>

                <Link href="/seller">
                  <Button variant="outline" className="w-full" size="lg">
                    Sell Products
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  Connect your Sui wallet to access the marketplace
                </p>
              </CardContent>
            </Card>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <CardTitle className="text-lg">Verifiable Ownership</CardTitle>
                <CardDescription>
                  Every product is an NFT with cryptographically proven ownership on Sui blockchain
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <CardTitle className="text-lg">Instant Settlement</CardTitle>
                <CardDescription>
                  Sub-second transaction finality with minimal gas fees on Sui network
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <CardTitle className="text-lg">NFT Receipts</CardTitle>
                <CardDescription>
                  Immutable proof of purchase stored as NFTs for every transaction
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Built with Sui Move • Next.js • Shadcn UI
          </p>
        </div>
      </footer>
    </div>
  );
}
