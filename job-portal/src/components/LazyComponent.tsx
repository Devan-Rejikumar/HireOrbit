import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}

/**
 * LazyComponent - Only renders children when they come into viewport
 * Uses IntersectionObserver API for efficient lazy loading
 */
export const LazyComponent: React.FC<LazyComponentProps> = ({ 
  children, 
  fallback = null,
  rootMargin = '100px', // Start loading 100px before component is visible
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once visible
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { rootMargin },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
};

