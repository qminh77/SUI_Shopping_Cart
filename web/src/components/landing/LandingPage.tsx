'use client';

import React from 'react';
import Scene from './Scene';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import StatsSection from './StatsSection';
import LandingFooter from './LandingFooter';

export default function LandingPage() {
    return (
        <main className="relative min-h-screen w-full bg-black selection:bg-cyan-400 selection:text-black">

            {/* 3D Background - Fixed position to stay behind scrolling content */}
            {/* Lower z-index so content flows over it, but sticky sections will cover it */}
            <div className="fixed inset-0 z-0">
                <Scene />
            </div>

            {/* Scroll Container */}
            {/* 
               Sticky Stack Effect:
               Each section is sticky top-0 and min-h-screen.
               As you scroll, the next section (with higher z-index) slides up over the previous one.
            */}

            <div className="relative w-full">
                <HeroSection />
                <FeaturesSection />
                <StatsSection />
                <div className="relative z-40 bg-black">
                    <LandingFooter />
                </div>
            </div>

            {/* Texture Overlay */}
            <div className="pointer-events-none fixed inset-0 z-[100] opacity-[0.05] mix-blend-overlay"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}>
            </div>
        </main>
    );
}
