'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, Store } from 'lucide-react';
import KineticText from './KineticText';
import MagneticButton from './MagneticButton';

export default function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline();

        tl.fromTo(contentRef.current,
            { autoAlpha: 0, y: 100 },
            { autoAlpha: 1, y: 0, duration: 1.5, ease: "power4.out", delay: 0.2 }
        );

    }, { scope: containerRef });

    return (
        <section
            ref={containerRef}
            className="sticky top-0 z-10 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 md:px-12"
        >
            {/* Header / Nav overlay - stays inside Hero for now or could be global */}
            <header className="absolute top-0 left-0 right-0 flex w-full items-center justify-between p-6 md:p-12 text-xs font-medium tracking-widest text-white/50 uppercase mix-blend-difference z-20">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                    Sui<span className="text-white">Store</span> v3.0
                </div>
                <div className="hidden md:flex gap-8">
                    <span className="cursor-pointer hover:text-white transition-colors">Manifesto</span>
                    <span className="cursor-pointer hover:text-white transition-colors">Ecosystem</span>
                </div>
                <div className="px-4 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all cursor-pointer">
                    Connect Wallet
                </div>
            </header>

            <div ref={contentRef} className="flex flex-col items-center gap-12 mt-[-5vh] opacity-0">
                <KineticText />

                {/* Navigation Buttons */}
                <div className="flex flex-col gap-6 md:flex-row md:gap-12">
                    <MagneticButton href="/shop" className="h-16 w-56 text-sm font-bold tracking-widest text-black bg-white hover:bg-white/90 border-none">
                        <span className="flex items-center gap-2">
                            ENTER SHOP <ArrowRight className="h-4 w-4" />
                        </span>
                    </MagneticButton>

                    <MagneticButton href="/seller/dashboard" className="h-16 w-56 text-sm font-bold tracking-widest text-white border border-white/20 hover:bg-white/10 backdrop-blur-md">
                        <span className="flex items-center gap-2">
                            SELLER ZONE <Store className="h-4 w-4" />
                        </span>
                    </MagneticButton>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-12 animate-bounce flex flex-col items-center gap-2 opacity-30 mix-blend-difference">
                    <span className="text-[10px] tracking-widest uppercase text-white">Scroll to Explore</span>
                    <div className="h-12 w-px bg-gradient-to-b from-white to-transparent"></div>
                </div>
            </div>
        </section>
    );
}
