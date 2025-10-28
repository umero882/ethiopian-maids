import { useState, useEffect, useRef, useCallback } from 'react';

// Hook for managing animation states
export const useAnimation = (initialState = 'idle') => {
  const [animationState, setAnimationState] = useState(initialState);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);

  const animate = useCallback((newState, duration = 300) => {
    setIsAnimating(true);
    setAnimationState(newState);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, duration);
  }, []);

  const reset = useCallback(() => {
    setAnimationState(initialState);
    setIsAnimating(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [initialState]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    animationState,
    isAnimating,
    animate,
    reset,
  };
};

// Hook for staggered animations
export const useStaggeredAnimation = (items = [], delay = 100) => {
  const [visibleItems, setVisibleItems] = useState(new Set());
  const [allVisible, setAllVisible] = useState(false);

  const startAnimation = useCallback(() => {
    setVisibleItems(new Set());
    setAllVisible(false);

    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, index]));

        if (index === items.length - 1) {
          setAllVisible(true);
        }
      }, index * delay);
    });
  }, [items, delay]);

  const reset = useCallback(() => {
    setVisibleItems(new Set());
    setAllVisible(false);
  }, []);

  return {
    visibleItems,
    allVisible,
    startAnimation,
    reset,
    isVisible: (index) => visibleItems.has(index),
  };
};

// Hook for scroll-triggered animations
export const useScrollAnimation = (threshold = 0.1, once = true) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (!hasAnimated) {
            setHasAnimated(true);
          }
        } else if (!once || !hasAnimated) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '50px',
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, once, hasAnimated]);

  const reset = useCallback(() => {
    setIsVisible(false);
    setHasAnimated(false);
  }, []);

  return {
    elementRef,
    isVisible,
    hasAnimated,
    reset,
  };
};

// Hook for hover animations
export const useHoverAnimation = (hoverClass = 'hover-lift') => {
  const [isHovering, setIsHovering] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      setIsHovering(true);
      element.classList.add(hoverClass);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      element.classList.remove(hoverClass);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hoverClass]);

  return {
    elementRef,
    isHovering,
  };
};

// Hook for managing loading animations
export const useLoadingAnimation = (duration = 2000) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setProgress(0);

    const stepTime = 50;
    const steps = duration / stepTime;
    const increment = 100 / steps;

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          setIsLoading(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return 100;
        }
        return newProgress;
      });
    }, stepTime);
  }, [duration]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setProgress(100);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setProgress(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    progress,
    startLoading,
    stopLoading,
    reset,
  };
};

// Hook for type-writer effect
export const useTypeWriter = (text = '', speed = 100, delay = 0) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef(null);

  const startTyping = useCallback(() => {
    setIsTyping(true);
    setIsComplete(false);
    setDisplayText('');
    indexRef.current = 0;

    const startAfterDelay = () => {
      const typeNextChar = () => {
        if (indexRef.current < text.length) {
          setDisplayText(prev => prev + text[indexRef.current]);
          indexRef.current++;
          timeoutRef.current = setTimeout(typeNextChar, speed);
        } else {
          setIsTyping(false);
          setIsComplete(true);
        }
      };

      typeNextChar();
    };

    if (delay > 0) {
      timeoutRef.current = setTimeout(startAfterDelay, delay);
    } else {
      startAfterDelay();
    }
  }, [text, speed, delay]);

  const reset = useCallback(() => {
    setDisplayText('');
    setIsTyping(false);
    setIsComplete(false);
    indexRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    displayText,
    isTyping,
    isComplete,
    startTyping,
    reset,
  };
};

// Hook for particle effects (basic)
export const useParticleEffect = (particleCount = 20) => {
  const [particles, setParticles] = useState([]);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  const createParticle = useCallback((x, y) => {
    return {
      id: Math.random().toString(36),
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      decay: 0.02,
      color: `hsl(${Math.random() * 60 + 260}, 70%, 60%)`, // Purple-ish colors
      size: Math.random() * 4 + 2,
    };
  }, []);

  const generateParticles = useCallback((x, y, count = particleCount) => {
    const newParticles = Array.from({ length: count }, () => createParticle(x, y));
    setParticles(prev => [...prev, ...newParticles]);
  }, [particleCount, createParticle]);

  const updateParticles = useCallback(() => {
    setParticles(prev =>
      prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - particle.decay,
        }))
        .filter(particle => particle.life > 0)
    );

    animationRef.current = requestAnimationFrame(updateParticles);
  }, []);

  const startAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(updateParticles);
  }, [updateParticles]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setParticles([]);
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    particles,
    generateParticles,
    startAnimation,
    stopAnimation,
  };
};

// Hook for managing CSS transitions
export const useTransition = (show, timeout = 300) => {
  const [shouldMount, setShouldMount] = useState(show);
  const [isVisible, setIsVisible] = useState(show);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (show) {
      setShouldMount(true);
      // Use RAF to ensure the element is mounted before adding visible class
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      timeoutRef.current = setTimeout(() => {
        setShouldMount(false);
      }, timeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [show, timeout]);

  return {
    shouldMount,
    isVisible,
    transitionClass: isVisible ? 'opacity-100' : 'opacity-0',
  };
};

// Utility function to check if user prefers reduced motion
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};