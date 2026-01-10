'use client';

import { useId, useRef, useState, useEffect } from "react"
import { motion, useSpring, useMotionTemplate } from "framer-motion"
import { cn } from "@/lib/utils"

interface GridPatternProps extends React.ComponentProps<typeof motion.svg> {
    width?: number
    height?: number
    x?: number
    y?: number
    strokeDasharray?: any
    numSquares?: number
    className?: string
    maxOpacity?: number
    duration?: number
    repeatDelay?: number
    interactive?: boolean
}

export function GridPattern({
    width = 40,
    height = 40,
    x = -1,
    y = -1,
    strokeDasharray = 0,
    numSquares = 50,
    className,
    maxOpacity = 0.5,
    duration = 4,
    repeatDelay = 0.5,
    interactive = true,
    ...props
}: GridPatternProps) {
    const id = useId()
    const maskId = `${id}-mask` // Unique ID for the mask
    const gradientId = `${id}-gradient` // Unique ID for the gradient usage

    const containerRef = useRef<SVGSVGElement>(null)

    const mouseX = useSpring(0, { stiffness: 500, damping: 50 });
    const mouseY = useSpring(0, { stiffness: 500, damping: 50 });
    const patternX = useSpring(0, { stiffness: 50, damping: 20 });
    const patternY = useSpring(0, { stiffness: 50, damping: 20 });

    useEffect(() => {
        if (!interactive) return;

        const handleMouseMove = (event: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                // Spotlight position relative to container
                mouseX.set(event.clientX - rect.left);
                mouseY.set(event.clientY - rect.top);

                // Parallax offset based on center of screen
                const { innerWidth, innerHeight } = window;
                const centerX = innerWidth / 2;
                const centerY = innerHeight / 2;

                // Move opposite to mouse for depth
                patternX.set((event.clientX - centerX) / -50);
                patternY.set((event.clientY - centerY) / -50);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [interactive, mouseX, mouseY, patternX, patternY]);

    return (
        <motion.svg
            ref={containerRef}
            aria-hidden="true"
            className={cn("pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30", className)}
            {...props}
        >
            <defs>
                {/* The Pattern Definition */}
                <motion.pattern
                    id={id}
                    width={width}
                    height={height}
                    patternUnits="userSpaceOnUse"
                    x={x}
                    y={y}
                    style={{ x: patternX, y: patternY }}
                >
                    <path
                        d={`M.5 ${height}V.5H${width}`}
                        fill="none"
                        strokeDasharray={strokeDasharray}
                    />
                </motion.pattern>

                {/* The Spotlight Gradient Definition */}
                <radialGradient id={gradientId}>
                    <stop offset="0%" stopColor="white" stopOpacity="1" />
                    <stop offset="100%" stopColor="black" stopOpacity="0" />
                </radialGradient>

                {/* The Mask Definition using the Gradient */}
                {interactive && (
                    <mask id={maskId}>
                        {/* A circle that moves with mouse, filled with the radial gradient */}
                        <motion.circle
                            cx={mouseX}
                            cy={mouseY}
                            r="350"
                            fill={`url(#${gradientId})`}
                        />
                    </mask>
                )}
            </defs>

            {/* Layer 1: Base Grid (Faint) */}
            <motion.rect
                width="100%"
                height="100%"
                strokeWidth={0}
                fill={`url(#${id})`}
                opacity={0.1}
                style={{ x: patternX, y: patternY }}
            />

            {/* Layer 2: Spotlight Reveal (Brighter) - Masked */}
            {interactive && (
                <motion.rect
                    width="100%"
                    height="100%"
                    strokeWidth={0}
                    fill={`url(#${id})`}
                    opacity={0.5}
                    mask={`url(#${maskId})`} // Standard SVG mask attribute
                    style={{
                        x: patternX,
                        y: patternY
                    }}
                />
            )}
        </motion.svg>
    )
}
