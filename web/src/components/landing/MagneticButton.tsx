'use client';

import React, { useRef, ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
    children: ReactNode;
    href?: string;
    className?: string;
    onClick?: () => void;
}

export default function MagneticButton({ children, href, className, onClick }: MagneticButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useGSAP(
        () => {
            const button = buttonRef.current;
            const text = textRef.current;
            if (!button || !text) return;

            const xTo = gsap.quickTo(button, 'x', { duration: 1, ease: 'elastic.out(1, 0.3)' });
            const yTo = gsap.quickTo(button, 'y', { duration: 1, ease: 'elastic.out(1, 0.3)' });

            const textXTo = gsap.quickTo(text, 'x', { duration: 0.5, ease: 'power2.out' });
            const textYTo = gsap.quickTo(text, 'y', { duration: 0.5, ease: 'power2.out' });

            const handleMouseMove = (e: MouseEvent) => {
                const { clientX, clientY } = e;
                const { left, top, width, height } = button.getBoundingClientRect();

                const center = { x: left + width / 2, y: top + height / 2 };
                const distance = { x: clientX - center.x, y: clientY - center.y };

                // Distance from center to trigger effect
                if (Math.abs(distance.x) < width && Math.abs(distance.y) < height) {
                    xTo(distance.x * 0.3);
                    yTo(distance.y * 0.3);
                    textXTo(distance.x * 0.1);
                    textYTo(distance.y * 0.1);
                } else {
                    xTo(0);
                    yTo(0);
                    textXTo(0);
                    textYTo(0);
                }
            };

            const handleMouseLeave = () => {
                xTo(0);
                yTo(0);
                textXTo(0);
                textYTo(0);
            };

            button.addEventListener('mousemove', handleMouseMove);
            button.addEventListener('mouseleave', handleMouseLeave);

            return () => {
                button.removeEventListener('mousemove', handleMouseMove);
                button.removeEventListener('mouseleave', handleMouseLeave);
            };
        },
        { scope: buttonRef }
    );

    const content = (
        <div
            ref={buttonRef}
            className={cn(
                "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10 hover:border-white/40",
                className
            )}
        >
            <span ref={textRef} className="relative z-10 flex items-center justify-center">
                {children}
            </span>
            {/* Glow Effect */}
            <div className="absolute inset-0 -z-10 translate-y-[100%] bg-gradient-to-t from-white/20 to-transparent transition-transform duration-300 group-hover:translate-y-0" />
        </div>
    );

    if (href) {
        return <Link href={href} className="group inline-block">{content}</Link>;
    }

    return <div onClick={onClick} className="group inline-block">{content}</div>;
}
