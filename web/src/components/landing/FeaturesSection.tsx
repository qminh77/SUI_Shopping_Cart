'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldCheck, Zap, Globe, Wallet, Box, Layers } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
    {
        icon: <Zap className="h-8 w-8 text-yellow-400" />,
        title: 'Instant Finality',
        description: 'Experience the speed of SUI. Transactions settle in milliseconds, not minutes.',
    },
    {
        icon: <ShieldCheck className="h-8 w-8 text-green-400" />,
        title: 'Bank-Grade Security',
        description: 'Built on Move, preserving asset safety with formal verification.',
    },
    {
        icon: <Globe className="h-8 w-8 text-blue-400" />,
        title: 'Global Marketplace',
        description: 'Connect with buyers and sellers from every corner of the decentralized world.',
    },
    {
        icon: <Wallet className="h-8 w-8 text-purple-400" />,
        title: 'Seamless Wallets',
        description: 'Integrated with leading SUI wallets for one-click login and payments.',
    },
    {
        icon: <Box className="h-8 w-8 text-red-400" />,
        title: 'On-Chain Inventory',
        description: 'Real ownership. Your products and assets live directly on the blockchain.',
    },
    {
        icon: <Layers className="h-8 w-8 text-orange-400" />,
        title: 'Scalable Architecture',
        description: 'Horizontal scaling ensures the network never slows down, no matter the traffic.',
    },
];

export default function FeaturesSection() {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const cards = gsap.utils.toArray('.feature-card');

            gsap.fromTo(
                cards,
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.1,
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top center', // Trigger when the section top hits center of viewport (since it's sliding up)
                        toggleActions: 'play none none reverse',
                    },
                }
            );
        },
        { scope: containerRef }
    );

    return (
        <section
            ref={containerRef}
            className="sticky top-0 z-20 flex min-h-screen w-full items-center justify-center bg-black/90 px-4 py-24 md:px-12 backdrop-blur-xl border-t border-white/10"
        >
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white">
                        Why Build on SUI?
                    </h2>
                    <div className="mt-4 h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="feature-card group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 p-8 transition-all hover:border-white/20 hover:bg-white/10 hover:-translate-y-1"
                        >
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                {feature.icon}
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-white uppercase tracking-wide">
                                {feature.title}
                            </h3>
                            <p className="text-sm font-medium text-white/50 leading-relaxed group-hover:text-white/80 transition-colors">
                                {feature.description}
                            </p>

                            {/* Hover Glow */}
                            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
