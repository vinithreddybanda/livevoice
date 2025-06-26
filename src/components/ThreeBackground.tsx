import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedBackground: React.FC<{ isDark: boolean; isListening: boolean }> = ({ isDark, isListening }) => {
  const ref = useRef<THREE.Points>(null);
  
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    const colors = new Float32Array(2000 * 3);
    
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      // Use only grayscale colors for black and white theme
      const grayValue = isDark 
        ? 0.7 + Math.random() * 0.3  // White tones for dark mode
        : 0.1 + Math.random() * 0.3; // Dark tones for light mode
      
      colors[i * 3] = grayValue;     // R
      colors[i * 3 + 1] = grayValue; // G
      colors[i * 3 + 2] = grayValue; // B
    }
    
    return [positions, colors];
  }, [isDark]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.05;
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
      
      if (isListening) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        ref.current.scale.setScalar(scale);
      } else {
        ref.current.scale.setScalar(1);
      }
    }
  });

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={isDark ? 0.015 : 0.01}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={isDark ? 0.8 : 0.3}
      />
    </Points>
  );
};

export const ThreeBackground: React.FC<{ isDark: boolean; isListening: boolean }> = ({ isDark, isListening }) => {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <AnimatedBackground isDark={isDark} isListening={isListening} />
      </Canvas>
    </div>
  );
};
