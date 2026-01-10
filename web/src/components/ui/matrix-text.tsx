'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MatrixTextProps {
    text: string;
    className?: string;
    speed?: number;
    hover?: boolean;
    uppercase?: boolean;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';

export function MatrixText({
    text,
    className,
    speed = 30,
    hover = true,
    uppercase = true
}: MatrixTextProps) {
    const [displayText, setDisplayText] = useState(text);
    const [isHovering, setIsHovering] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startScramble = () => {
        let iteration = 0;

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setDisplayText(prev =>
                text
                    .split('')
                    .map((char, index) => {
                        if (index < iteration) {
                            return text[index];
                        }
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join('')
            );

            if (iteration >= text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }

            iteration += 1 / 3;
        }, speed);
    };

    useEffect(() => {
        // Initial scramble on mount if it's a heading effectively
        if (!hover) {
            startScramble();
        }
    }, []);

    const handleMouseEnter = () => {
        if (hover) {
            setIsHovering(true);
            startScramble();
        }
    };

    // Convert input text to uppercase if prop is set, for consistent matching
    const targetText = uppercase ? text.toUpperCase() : text;

    return (
        <span
            className={cn("font-mono cursor-default inline-block", className)}
            onMouseEnter={handleMouseEnter}
        >
            {displayText}
        </span>
    );
}
