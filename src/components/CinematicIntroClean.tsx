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
  const controlsRef = useRef<HTMLDivElement>(null);

  // Animation state
  const [shaderProps, setShaderProps] = useState({
    hue: 0.9, // Pink hue
    intensity: 0,
    blur: 0
  });

  const [controls, setControls] = useState({
    backgroundHue: 0.9,
    textScale: 1.0,
    textOpacity: 1.0,
    exitBlur: 0.0
  });

  const animateShaderProps = useCallback((newProps: Partial<typeof shaderProps>) => {
    setShaderProps(prev => ({ ...prev, ...newProps }));
  }, []);

  const exitAnimation = useCallback(() => {
    if (!titleRef.current || !captionRef.current || !containerRef.current) return;

    const tl = gsap.timeline();

    // Text fade out with blur
    tl.to([titleRef.current, captionRef.current], {
      duration: 1,
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)',
      ease: 'power2.in'
    });

    // Background shader blur and dissolve
    tl.to({}, {
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: function() {
        const progress = this.progress();
        animateShaderProps({ 
          blur: progress,
          intensity: 0.8 - (progress * 0.6)
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

    // Reset all elements
    gsap.set([titleRef.current, captionRef.current], {
      opacity: 0,
      scale: 1.1,
      filter: 'blur(20px)'
    });

    animateShaderProps({ hue: 0.9, intensity: 0, blur: 0 });

    // Timeline for the entire animation
    const tl = gsap.timeline();

    // Background bloom in
    tl.to({}, {
      duration: 2,
      ease: 'power2.out',
      onUpdate: function() {
        const progress = this.progress();
        animateShaderProps({ intensity: progress * 0.8 });
      }
    });

    // Title animation
    tl.to(titleRef.current, {
      duration: 1.5,
      opacity: 1,
      scale: 1.0,
      filter: 'blur(0px)',
      ease: 'power3.out'
    }, '-=1');

    // Caption animation with delay
    tl.to(captionRef.current, {
      duration: 1.2,
      opacity: 1,
      scale: 1.0,
      filter: 'blur(0px)',
      ease: 'power3.out'
    }, '-=0.3');

    // Hold for a moment
    tl.to({}, { duration: 2 });

    // Auto exit after full sequence
    tl.call(() => {
      setTimeout(exitAnimation, 1000);
    });
  }, [animateShaderProps, exitAnimation]);

  // Control handlers
  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setControls(prev => ({ ...prev, backgroundHue: value }));
    animateShaderProps({ hue: value });
  };

  const handleTextScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setControls(prev => ({ ...prev, textScale: value }));
    if (titleRef.current && captionRef.current) {
      gsap.to([titleRef.current, captionRef.current], {
        scale: value,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const handleTextOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setControls(prev => ({ ...prev, textOpacity: value }));
    if (titleRef.current && captionRef.current) {
      gsap.to([titleRef.current, captionRef.current], {
        opacity: value,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const handleExitBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setControls(prev => ({ ...prev, exitBlur: value }));
    animateShaderProps({ blur: value });
  };

  // Start animation on mount
  useEffect(() => {
    const timer = setTimeout(startAnimation, 500);
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

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Main Title */}
        <div
          ref={titleRef}
          className="text-6xl md:text-8xl lg:text-9xl font-light tracking-wider text-gray-800 mb-8"
          style={{
            textShadow: '0 0 30px rgba(255,255,255,0.8)',
            fontWeight: 200,
            letterSpacing: '0.2em'
          }}
        >
          LIVEVOICEX
        </div>

        {/* Caption */}
        <div
          ref={captionRef}
          className="text-lg md:text-xl lg:text-2xl font-light tracking-widest text-gray-600"
          style={{
            textShadow: '0 0 20px rgba(255,255,255,0.6)',
            fontWeight: 300,
            letterSpacing: '0.3em'
          }}
        >
          A LIVE VOICE TRANSCRIBER
        </div>
      </div>

      {/* Debug Controls */}
      <div 
        ref={controlsRef}
        className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-4 text-white text-sm space-y-3"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <h3 className="font-semibold mb-2">Cinematic Controls</h3>
        
        <div>
          <label className="block mb-1">Background Hue: {controls.backgroundHue.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={controls.backgroundHue}
            onChange={handleHueChange}
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Text Scale: {controls.textScale.toFixed(2)}</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.01"
            value={controls.textScale}
            onChange={handleTextScaleChange}
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Text Opacity: {controls.textOpacity.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={controls.textOpacity}
            onChange={handleTextOpacityChange}
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Exit Blur: {controls.exitBlur.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={controls.exitBlur}
            onChange={handleExitBlurChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={startAnimation}
            className="w-full bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
          >
            Restart Animation
          </button>
          <button
            onClick={exitAnimation}
            className="w-full bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
          >
            Exit to Main
          </button>
        </div>
      </div>
    </div>
  );
};

export default CinematicIntro;
