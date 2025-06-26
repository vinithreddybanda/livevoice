import React, { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';

interface CinematicIntroProps {
  onComplete: () => void;
}

const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  const exitAnimation = useCallback(() => {
    if (!titleRef.current || !containerRef.current) return;

    const tl = gsap.timeline();

    // Text fade out with faster transition
    tl.to(titleRef.current, {
      duration: 2.0,
      opacity: 0,
      scale: 0.8,
      y: -15,
      filter: 'blur(15px)',
      ease: 'power2.in'
    });

    // Background shader blur and dissolve with faster effect
    tl.to({}, {
      duration: 0.5,
      ease: 'power2.inOut'
    }, '-=0.5');

    // Final container fade
    tl.to(containerRef.current, {
      duration: 1.8,
      opacity: 0,
      ease: 'power2.in',
      onComplete: onComplete
    }, '-=0.3');
  }, [onComplete]);

  const startAnimation = useCallback(() => {
    if (!titleRef.current) return;

    // Ensure elements are properly hidden (redundant safety check)
    gsap.set(titleRef.current, {
      opacity: 0,
      scale: 1.1,
      filter: 'blur(20px)',
      y: 20
    });

    // Timeline for the entire animation
    const tl = gsap.timeline();

    // Background bloom in - faster (removed shader animation)
    tl.to({}, {
      duration: 1.2,
      ease: 'power2.out'
    });

    // Title animation - faster entrance
    tl.to(titleRef.current, {
      duration: 2.0 ,
      opacity: 1,
      scale: 1.0,
      y: 0,
      filter: 'blur(0px)',
      ease: 'power2.out'
    }, '-=1.2');

    // Hold for shorter moment
    tl.to({}, { duration: 0.1 });

    // Auto exit after full sequence
    tl.call(() => {
      setTimeout(exitAnimation, 100);
    });
  }, [exitAnimation]);

  // Set initial state immediately and start animation
  useEffect(() => {
    // Immediately hide elements to prevent flash
    if (titleRef.current) {
      gsap.set(titleRef.current, {
        opacity: 0,
        scale: 1.1,
        filter: 'blur(20px)',
        y: 20
      });
    }
    
    // Mouse move handler for interactive title effects
    const handleMouseMove = (e: MouseEvent) => {
      if (!titleRef.current) return;
      
      const rect = titleRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / 50; // Sensitivity adjustment
      const deltaY = (e.clientY - centerY) / 50;
      
      // Apply subtle transform based on mouse position
      gsap.to(titleRef.current, {
        duration: 0.3,
        x: deltaX,
        y: deltaY,
        rotationY: deltaX * 0.5,
        rotationX: -deltaY * 0.5,
        ease: "power2.out"
      });
      
      // Remove setMousePosition call since we don't need state tracking
    };

    const handleMouseLeave = () => {
      if (!titleRef.current) return;
      
      // Return to center position when mouse leaves
      gsap.to(titleRef.current, {
        duration: 0.5,
        x: 0,
        y: 0,
        rotationY: 0,
        rotationX: 0,
        ease: "power2.out"
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    const timer = setTimeout(startAnimation, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [startAnimation]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Content - Interactive title */}
      <div className="relative z-10 text-center">
        {/* Main Title - Bold and interactive */}
        <div
          ref={titleRef}
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-wider text-gray-800 mb-4 cursor-pointer select-none"
          style={{
            textShadow: '0 0 25px rgba(0,0,0,0.1)',
            fontWeight: 700,
            letterSpacing: '0.3em',
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}
        >
          LIVEVOICEX
        </div>
      </div>
    </div>
  );
};

export default CinematicIntro;
