'use client';

import React, { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface PreloaderProps {
    onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const counterRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);

    useGSAP(
        () => {
            const tl = gsap.timeline({
                onComplete: () => {
                    // Fade out container
                    gsap.to(containerRef.current, {
                        yPercent: -100,
                        duration: 0.8,
                        ease: "power4.inOut",
                        onComplete: onComplete
                    });
                }
            });

            // Simulation of loading progress
            const progressObj = { value: 0 };
            tl.to(progressObj, {
                value: 100,
                duration: 2,
                ease: "expo.inOut",
                onUpdate: () => {
                    setProgress(Math.floor(progressObj.value));
                }
            });

            tl.to(counterRef.current, {
                opacity: 0,
                y: -20,
                duration: 0.3
            });

        },
        { scope: containerRef }
    );

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white"
        >
            <div ref={counterRef} className="text-9xl font-bold tracking-tighter slashed-zero tabular-nums">
                {progress}%
            </div>
        </div>
    );
}
