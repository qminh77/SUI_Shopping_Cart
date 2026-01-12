'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, ShoppingBag, Store } from 'lucide-react';

export default function SplitNavigation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const leftSideRef = useRef<HTMLDivElement>(null);
    const rightSideRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

            timeline.from([leftSideRef.current, rightSideRef.current], {
                y: 100,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                delay: 0.5,
            });

            // Hover effects logic can be handled here or via CSS/Tailwind group-hover for simplicity in reaction
            // For more complex timeline based hover, we can add event listeners, but Tailwind is often smoother for simple scale/opacity
        },
        { scope: containerRef }
    );

    const cardClass =
        'group relative flex h-[400px] w-full flex-col justify-between overflow-hidden border border-border bg-card/50 p-8 transition-all duration-500 hover:bg-card hover:border-foreground/20 md:w-1/2 md:h-[500px]';

    return (
        <div
            ref={containerRef}
            className="container mx-auto flex flex-col gap-6 px-4 md:flex-row md:gap-12 pb-24"
        >
            {/* SHOP / BUYER */}
            <div ref={leftSideRef} className="w-full md:w-1/2">
                <Link href="/shop" className={cardClass}>
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <ShoppingBag className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                Shop Now
                            </h2>
                            <p className="mt-2 text-muted-foreground">
                                Explore exclusive collections and curated products directly from creators.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            ENTER STORE <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Decorative Background Element */}
                    <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl transition-transform duration-500 group-hover:scale-150" />
                </Link>
            </div>

            {/* SELLER / DASHBOARD */}
            <div ref={rightSideRef} className="w-full md:w-1/2">
                <Link href="/seller/dashboard" className={cardClass}>
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Store className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                Become a Seller
                            </h2>
                            <p className="mt-2 text-muted-foreground">
                                Launch your own decentralized store and reach customers worldwide.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            ACCESS DASHBOARD <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Decorative Background Element */}
                    <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 blur-3xl transition-transform duration-500 group-hover:scale-150" />
                </Link>
            </div>
        </div>
    );
}
