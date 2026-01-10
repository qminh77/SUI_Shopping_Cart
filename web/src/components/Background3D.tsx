'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { useRef, useState } from 'react';
import { useTheme } from 'next-themes';


function Stars(props: any) {
    const ref = useRef<any>(null);
    const [sphere] = useState(() => {
        const positions = new Float32Array(3000 * 3); // Reduced count for cleaner look
        for (let i = 0; i < 3000; i++) {
            const r = 1.5 * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        return positions;
    });

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 15;
            ref.current.rotation.y -= delta / 20;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#a1a1aa" // Zinc-400 (Monochrome)
                    size={0.0015} // Smaller/Finer
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.5}
                />
            </Points>
        </group>
    );
}

export default function Background3D() {
    return (
        <div className="fixed inset-0 z-[-1] opacity-40 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Stars />
            </Canvas>
        </div>
    );
}
