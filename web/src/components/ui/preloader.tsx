'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MatrixText } from './matrix-text';

const LOADING_STEPS = [
    "INITIALIZING SECURE CONNECTION...",
    "ESTABLISHING LINK TO SUI NETWORK...",
    "VERIFYING CRYPTOGRAPHIC KEYS...",
    "LOADING ASSET PROTOCOLS...",
    "SYNCHRONIZING DECENTRALIZED DATA...",
    "SYSTEM OPTIMIZED."
];

export function Preloader() {
    const [stepIndex, setStepIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Check if we've already shown the loader this session
        // Check if we've already shown the loader this session
        // const hasLoaded = sessionStorage.getItem('sui-shop-loaded');
        // if (hasLoaded) {
        //     setIsLoading(false);
        //     return;
        // }

        const interval = setInterval(() => {
            setStepIndex((prev) => {
                if (prev >= LOADING_STEPS.length - 1) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setIsExiting(true);
                        setTimeout(() => {
                            setIsLoading(false);
                            sessionStorage.setItem('sui-shop-loaded', 'true');
                        }, 800);
                    }, 500);
                    return prev;
                }
                return prev + 1;
            });
        }, 400); // Speed of each step

        return () => clearInterval(interval);
    }, []);

    if (!isLoading) return null;

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[10000] bg-background flex flex-col items-center justify-center font-mono text-foreground overflow-hidden"
                >
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }} />

                    <div className="w-full max-w-lg px-6 relative z-10">
                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-muted overflow-hidden mb-8">
                            <motion.div
                                className="h-full bg-foreground"
                                initial={{ width: "0%" }}
                                animate={{ width: `${((stepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Steps */}
                        <div className="space-y-2 h-32">
                            {LOADING_STEPS.map((step, idx) => (
                                idx <= stepIndex && (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: idx === stepIndex ? 1 : 0.5, x: 0 }}
                                        className="text-sm md:text-base tracking-wider"
                                    >
                                        <span className="text-muted-foreground mr-2 text-xs" suppressHydrationWarning>
                                            [{new Date().toLocaleTimeString()}]
                                        </span>
                                        <span className={idx === stepIndex ? "text-foreground font-bold" : "text-muted-foreground"}>
                                            {'>'} {step}
                                        </span>
                                    </motion.div>
                                )
                            ))}
                            {stepIndex < LOADING_STEPS.length - 1 && (
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="w-2 h-4 bg-foreground inline-block ml-1 align-middle"
                                />
                            )}
                        </div>

                        {/* Brand */}
                        <motion.div
                            className="absolute bottom-[-100px] left-0 text-xs text-muted-foreground uppercase tracking-[0.2em]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            SUI Secure Protocol v2.5
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
