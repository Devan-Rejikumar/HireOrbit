import React, { useEffect, useState, useRef } from 'react';
import { Logo } from './Logo';

interface LoadingScreenProps {
  isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing intervals/timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isVisible) {
      setShouldRender(true);
      // Reset progress when loading starts
      setProgress(0);
      
      // Simulate progress animation with easing
      let currentProgress = 0;
      const startTime = Date.now();
      const duration = 2000; // 2 seconds for full progress
      
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min((elapsed / duration) * 100, 95); // Cap at 95% until loading completes
        
        // Use easing function for smooth animation
        const easedProgress = 1 - Math.pow(1 - progressPercent / 100, 3); // Ease-out cubic
        currentProgress = easedProgress * 95;
        
        setProgress(currentProgress);
        
        if (progressPercent >= 95) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 16); // ~60fps
    } else {
      // Complete progress to 100% before hiding
      setProgress(100);
      timerRef.current = setTimeout(() => {
        setShouldRender(false);
        setProgress(0); // Reset for next load
      }, 300); // Wait for fade-out animation
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="mb-4">
          <Logo size="lg" showText={true} />
        </div>

        {/* Progress Bar Container */}
        <div className="w-80 max-w-[90vw]">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full transition-all duration-300 ease-out progress-bar-fill"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

