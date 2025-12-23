import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Icosahedron } from '@react-three/drei';
import ErrorBoundary from '../ErrorBoundary';

function RotatingShape() {
  const mesh = useRef();

  useFrame((state) => {
    if (mesh.current) {
        const time = state.clock.getElapsedTime();
        mesh.current.rotation.x = time * 0.2;
        mesh.current.rotation.y = time * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Icosahedron args={[1, 0]} ref={mesh} scale={2}>
        <MeshDistortMaterial
          color="#8b5cf6"
          envMapIntensity={0.5}
          clearcoat={1}
          clearcoatRoughness={0}
          metalness={0.1}
        />
      </Icosahedron>
    </Float>
  );
}

export default function HeroWidget() {
  return (
    <div className="w-full h-full min-h-[200px] flex items-center justify-center relative">
        <ErrorBoundary fallback={<div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 animate-pulse-glow" />}>
            <Canvas camera={{ position: [0, 0, 5] }} gl={{ alpha: true }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
                <RotatingShape />
            </Canvas>
        </ErrorBoundary>
    </div>
  );
}
