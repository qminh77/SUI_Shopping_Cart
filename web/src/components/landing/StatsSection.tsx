'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const stats = [
    { label: 'Active Users', value: 12500, suffix: '+' },
    { label: 'Total Volume', value: 45, suffix: 'M+' },
    { label: 'Live Shops', value: 850, suffix: '' },
    { label: 'Transactions', value: 120, suffix: 'K' },
];

export default function StatsSection() {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const numbers = gsap.utils.toArray('.stat-value');

            numbers.forEach((num: any) => {
                const rawValue = parseInt(num.innerText.replace(/[^0-9]/g, ''));

                gsap.fromTo(
                    num,
                    { innerText: 0 },
                    {
                        innerText: rawValue,
                        duration: 2,
                        snap: { innerText: 1 },
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: 'top 85%',
                            toggleActions: 'play none none reverse',
                        },
                        onUpdate: function () {
                            // Keep the text content clean during animation if needed, mostly handled by snap
                            // Combining raw value with suffix
                            num.innerText = Math.ceil(this.targets()[0].innerText) + (num.dataset.suffix || '');
                        }
                    }
                );
            });

            gsap.fromTo(
                '.stat-item',
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    stagger: 0.2,
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top 85%',
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
            className="sticky top-0 z-30 flex min-h-screen w-full items-center justify-center bg-black px-4 py-32 border-t border-white/10"
        >
            {/* Divider Line */}
            {/* <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div> */}

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black opacity-50" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-12 w-full">
                <div className="mb-24 text-center">
                    <span className="text-blue-500 font-bold tracking-widest uppercase mb-4 block">By The Numbers</span>
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Growing Ecosystem</h2>
                </div>

                <div className="grid grid-cols-2 gap-12 md:grid-cols-4 text-center">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-item">
                            <div
                                className="stat-value text-5xl md:text-8xl font-black text-white tracking-tighter"
                                data-suffix={stat.suffix}
                            >
                                {stat.value}{stat.suffix}
                            </div>
                            <div className="mt-4 text-sm md:text-base font-bold uppercase tracking-widest text-white/50 border-t border-white/10 pt-4 inline-block px-4">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-24 text-center">
                    <button className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors rounded-full">
                        Join the Network
                    </button>
                </div>
            </div>
        </section>
    );
}
