'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

function FloatingGeometry() {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        // Subtle rotation
        meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.2;
        meshRef.current.rotation.y = Math.sin(time * 0.1) * 0.2;
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group ref={meshRef}>
                {/* Main Ethereal Shape */}
                <mesh position={[0, 0, 0]} scale={1.5}>
                    <icosahedronGeometry args={[1, 15]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        roughness={0}
                        metalness={0.1}
                        transmission={0.9} // Glass-like
                        thickness={2}
                        clearcoat={1}
                        ior={1.5}
                        dispersion={0.2}
                    />
                </mesh>

                {/* Wireframe overlay for "Tech" feel */}
                <mesh position={[0, 0, 0]} scale={2.2}>
                    <icosahedronGeometry args={[1, 2]} />
                    <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.03} />
                </mesh>
            </group>
        </Float>
    );
}

function SceneLights() {
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame(({ mouse, viewport }) => {
        if (!lightRef.current) return;
        // Light follows mouse slightly
        const x = (mouse.x * viewport.width) / 2;
        const y = (mouse.y * viewport.height) / 2;
        lightRef.current.position.set(x, y, 5);
    });

    return (
        <>
            <ambientLight intensity={0.2} />
            <pointLight ref={lightRef} position={[0, 0, 5]} intensity={20} color="#60a5fa" distance={10} decay={2} />
            <pointLight position={[-5, 5, -5]} intensity={10} color="#f472b6" />
        </>
    )
}

export default function Scene() {
    return (
        <div className="absolute inset-0 -z-10 bg-black">
            <Canvas gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping }}>
                <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                <SceneLights />
                <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
                <Environment preset="night" />
                <FloatingGeometry />
                <fog attach="fog" args={['#000000', 5, 20]} />
            </Canvas>
        </div>
    );
}
