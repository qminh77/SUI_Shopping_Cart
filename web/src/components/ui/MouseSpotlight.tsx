'use client';

import { useEffect, useState } from 'react';

export default function MouseSpotlight() {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999,
                background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(77, 162, 255, 0.06), transparent 40%)`,
            }}
        />
    );
}
