'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function KineticText() {
    const containerRef = useRef<HTMLDivElement>(null);
    const textTitleRef = useRef<HTMLHeadingElement>(null);
    const textSubtitleRef = useRef<HTMLParagraphElement>(null);

    useGSAP(
        () => {
            // Parallax Effect on Mouse Move
            const handleMouseMove = (e: MouseEvent) => {
                const { clientX, clientY } = e;
                const x = (clientX / window.innerWidth - 0.5) * 40; // value between -20 and 20
                const y = (clientY / window.innerHeight - 0.5) * 40;

                gsap.to(textTitleRef.current, {
                    x: x,
                    y: y,
                    duration: 1,
                    ease: 'power2.out',
                });

                gsap.to(textSubtitleRef.current, {
                    x: -x * 0.5, // Move inverse for depth
                    y: -y * 0.5,
                    duration: 1.2,
                    ease: 'power2.out'
                })
            };

            window.addEventListener('mousemove', handleMouseMove);

            // Clean up
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
            };
        },
        { scope: containerRef }
    );

    return (
        <div ref={containerRef} className="pointer-events-none relative z-10 flex flex-col items-center justify-center text-center mix-blend-difference">
            <h1
                ref={textTitleRef}
                className="text-[12vw] font-black leading-none tracking-tighter text-white opacity-90"
                style={{ textShadow: '0 0 30px rgba(255,255,255,0.1)' }}
            >
                SUI / NEXT
            </h1>
            <p
                ref={textSubtitleRef}
                className="mt-4 max-w-md text-sm md:text-lg font-light tracking-[0.5em] text-white/60"
            >
                THE FUTURE OF COMMERCE
            </p>
        </div>
    );
}
