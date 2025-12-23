import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as random from 'maath/random';
import ErrorBoundary from './ErrorBoundary';

function Stars(props) {
  const ref = useRef();
  const [sphere] = useMemo(() => {
    // Generate random points in a sphere
    // Ensure the array is created correctly
    const points = random.inSphere(new Float32Array(5000), { radius: 1.5 });
    return [points];
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#ffa0e0"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function FloatingShape({ position, color }) {
  return (
    <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere args={[1, 32, 32]} position={position} scale={0.5}>
         <MeshDistortMaterial
            color={color}
            speed={2}
            distort={0.4}
            metalness={0.5}
            roughness={0.2}
            envMapIntensity={1}
            wireframe={false} 
         />
      </Sphere>
    </Float>
  )
}

function FallbackBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
       {/* Animated Gradient Background as fallback */}
       <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 animate-spin-slow" style={{ animationDuration: '15s' }}></div>
       <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl filter mix-blend-screen animate-blob"></div>
       <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl filter mix-blend-screen animate-blob animation-delay-2000"></div>
       <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl filter mix-blend-screen animate-blob animation-delay-4000"></div>
    </div>
  );
}

export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden">
      <ErrorBoundary fallback={<FallbackBackground />}>
        <Canvas camera={{ position: [0, 0, 1] }} gl={{ antialias: true, alpha: true, powerPreference: "default" }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Stars />
          <FloatingShape position={[-0.8, 0, 0]} color="#8b5cf6" />
          <FloatingShape position={[0.8, 0.5, 0]} color="#3b82f6" />
          <FloatingShape position={[0, -0.6, 0.2]} color="#06b6d4" />
        </Canvas>
      </ErrorBoundary>
      {/* Ensure fallback is visible if canvas is transparent or failing silently? 
          Actually ErrorBoundary should handle full crashes. 
          But let's put a static background behind just in case. */}
       <div className="absolute inset-0 -z-10 bg-slate-950" />
    </div>
  );
}
