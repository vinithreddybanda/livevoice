import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { gsap } from 'gsap';
import * as THREE from 'three';

// Import shaders
import backgroundVertexShader from '../shaders/backgroundVertex.glsl?raw';
import backgroundFragmentShader from '../shaders/backgroundFragment.glsl?raw';

interface CinematicIntroProps {
  onComplete: () => void;
}

interface ShaderMaterialProps {
  hue: number;
  intensity: number;
  blur: number;
}

const ShaderBackground: React.FC<ShaderMaterialProps> = ({ hue, intensity, blur }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uHue.value = hue;
      materialRef.current.uniforms.uIntensity.value = intensity;
      materialRef.current.uniforms.uBlur.value = blur;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -1]}>
      <planeGeometry args={[4, 4]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={backgroundVertexShader}
        fragmentShader={backgroundFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uHue: { value: hue },
          uIntensity: { value: intensity },
          uBlur: { value: blur },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        }}
      />
    </mesh>
  );
};

const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  // Animation state
  const [shaderProps, setShaderProps] = useState({
    hue: 0.9, // Pink hue
    intensity: 0,
    blur: 0
  });

  const animateShaderProps = useCallback((newProps: Partial<typeof shaderProps>) => {
    setShaderProps(prev => ({ ...prev, ...newProps }));
  }, []);

  const exitAnimation = useCallback(() => {
    if (!titleRef.current || !captionRef.current || !containerRef.current) return;

    const tl = gsap.timeline();

    // Text fade out with faster transition
    tl.to([titleRef.current, captionRef.current], {
      duration: 1,
      opacity: 0,
      scale: 0.8,
      y: -15,
      filter: 'blur(15px)',
      ease: 'power2.in'
    });

    // Background shader blur and dissolve with faster effect
    tl.to({}, {
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: function() {
        const progress = this.progress();
        animateShaderProps({ 
          blur: progress * 1.2,
          intensity: 0.9 - (progress * 0.8)
        });
      }
    }, '-=0.5');

    // Final container fade
    tl.to(containerRef.current, {
      duration: 0.8,
      opacity: 0,
      ease: 'power2.in',
      onComplete: onComplete
    }, '-=0.3');
  }, [onComplete, animateShaderProps]);

  const startAnimation = useCallback(() => {
    if (!titleRef.current || !captionRef.current) return;

    // Ensure elements are properly hidden (redundant safety check)
    gsap.set([titleRef.current, captionRef.current], {
      opacity: 0,
      scale: 1.1,
      filter: 'blur(20px)',
      y: 20
    });

    animateShaderProps({ hue: 0.9, intensity: 0, blur: 0 });

    // Timeline for the entire animation
    const tl = gsap.timeline();

    // Background bloom in - faster
    tl.to({}, {
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: function() {
        const progress = this.progress();
        animateShaderProps({ intensity: progress * 0.9 });
      }
    });

    // Title animation - faster entrance
    tl.to(titleRef.current, {
      duration: 1.5,
      opacity: 1,
      scale: 1.0,
      y: 0,
      filter: 'blur(0px)',
      ease: 'power2.out'
    }, '-=1.2');

    // Caption animation with faster timing
    tl.to(captionRef.current, {
      duration: 1.2,
      opacity: 1,
      scale: 1.0,
      y: 0,
      filter: 'blur(0px)',
      ease: 'power2.out'
    }, '-=0.8');

    // Hold for shorter moment
    tl.to({}, { duration: 1.5 });

    // Auto exit after full sequence
    tl.call(() => {
      setTimeout(exitAnimation, 500);
    });
  }, [animateShaderProps, exitAnimation]);

  // Set initial state immediately and start animation
  useEffect(() => {
    // Immediately hide elements to prevent flash
    if (titleRef.current && captionRef.current) {
      gsap.set([titleRef.current, captionRef.current], {
        opacity: 0,
        scale: 1.1,
        filter: 'blur(20px)',
        y: 20
      });
    }
    
    const timer = setTimeout(startAnimation, 0);
    return () => clearTimeout(timer);
  }, [startAnimation]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {/* WebGL Background */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 1], fov: 75 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ShaderBackground 
            hue={shaderProps.hue}
            intensity={shaderProps.intensity}
            blur={shaderProps.blur}
          />
        </Canvas>
      </div>

      {/* Content - Much smaller text */}
      <div className="relative z-10 text-center">
        {/* Main Title - Bold and refined */}
        <div
          ref={titleRef}
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-wider text-gray-800 mb-4"
          style={{
            textShadow: '0 0 25px rgba(255,255,255,0.9)',
            fontWeight: 700,
            letterSpacing: '0.3em'
          }}
        >
          LIVEVOICEX
        </div>

        {/* Caption - Smaller size */}
        <div
          ref={captionRef}
          className="text-xs md:text-xs lg:text-sm font-bold tracking-widest text-gray-800"
          style={{
            textShadow: '0 0 15px rgba(255,255,255,0.7)',
            fontWeight: 400,
            letterSpacing: '0em'
          }}
        >
          A LIVE VOICE TRANSCRIBER
        </div>
      </div>
    </div>
  );
};

export default CinematicIntro;
