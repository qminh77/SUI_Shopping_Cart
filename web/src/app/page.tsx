'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ShoppingCart, Shield, Zap, ArrowRight, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-transparent text-white font-sans selection:bg-blue-500/30 selection:text-blue-200">

      {/* Background is provided by layout (Background3D) */}

      <Navigation />

      <main className="flex-1 relative z-10">

        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 text-center py-20">

          {/* Tech Badge */}
          <div className="mb-8 animate-in fade-in zoom-in duration-1000">
            <Badge variant="outline" className="px-6 py-2 bg-black/50 backdrop-blur border-blue-500/30 text-blue-400 font-mono tracking-[0.2em] uppercase rounded-none text-xs gap-2 hover:bg-blue-500/10 transition-colors">
              <span className="w-1.5 h-1.5 bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
              Powered by Sui Network
            </Badge>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 text-white drop-shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            THE FUTURE OF <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-white">DECENTRALIZED COMMERCE</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-400 mb-10 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            Experience the speed of Sui. Buy and sell verifiable digital assets with instant settlement, zero-knowledge security, and sub-second finality.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <Link href="/shop">
              <Button size="lg" className="h-14 px-8 text-sm font-bold bg-white text-black hover:bg-blue-500 hover:text-white transition-all duration-300 cut-corner-bottom-right uppercase tracking-widest border-none shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(77,162,255,0.4)]">
                Explore Market
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            {account && (
              <Link href="/seller">
                <Button variant="outline" size="lg" className="h-14 px-8 text-sm font-bold text-white border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300 cut-corner-bottom-right uppercase tracking-widest backdrop-blur-sm">
                  Seller Dashboard
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-blue-400" />}
              title="VERIFIED SELLERS"
              desc="Every seller is verified on-chain with transparent transaction history and reputation tracking."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-blue-400" />}
              title="INSTANT SETTLEMENT"
              desc="Sub-second transaction finality means you never have to wait. Speed is the new standard."
            />
            <FeatureCard
              icon={<Box className="w-6 h-6 text-blue-400" />}
              title="DIGITAL RECEIPTS"
              desc="Permanent proof of purchase stored on-chain for warranty claims and order verification."
            />
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="group relative p-8 bg-black/40 border border-white/5 hover:border-blue-500/30 transition-all duration-500 cut-corner backdrop-blur-sm">
      {/* Icon */}
      <div className="mb-6 w-12 h-12 flex items-center justify-center bg-blue-500/5 border border-blue-500/20 group-hover:bg-blue-500/10 group-hover:scale-110 transition-all duration-500">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-white mb-3 tracking-widest font-mono">{title}</h3>
      <p className="text-neutral-500 leading-relaxed text-sm group-hover:text-neutral-400 transition-colors duration-300">{desc}</p>
    </div>
  );
}
