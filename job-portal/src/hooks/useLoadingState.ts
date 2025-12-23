import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';
import { useBranding } from '@/context/BrandingContext';
import { useAuth } from '@/context/AuthContext';

/**
 * Custom hook to track all loading states across the application
 * Returns true if any of the following are loading:
 * - Branding settings
 * - Auth verification
 * - React Query fetches
 * - Route navigation
 */
export const useLoadingState = () => {
  const location = useLocation();
  const { loading: brandingLoading } = useBranding();
  const { role, isAuthenticated } = useAuth();
  const isFetching = useIsFetching();

  // Track route changes
  const [isNavigating, setIsNavigating] = useState(false);
  const prevLocationRef = useRef(location.pathname);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Check if location changed (route navigation)
  useEffect(() => {
    if (location.pathname !== prevLocationRef.current) {
      setIsNavigating(true);
      prevLocationRef.current = location.pathname;
      
      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      
      // Reset navigation state after route change completes
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
      }, 200);
      
      return () => {
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
      };
    }
  }, [location.pathname]);

  // Track initial load - mark as complete after first render and auth check
  useEffect(() => {
    if (isInitialLoad) {
      // Wait for branding and initial auth check
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad, brandingLoading, role]);

  // Track auth loading - consider loading if we have a role but auth is still being verified
  const isAuthLoading = useMemo(() => {
    const storedRole = localStorage.getItem('role');
    // If there's a stored role but we're not authenticated yet, auth might be loading
    // But only on initial load to avoid false positives
    if (isInitialLoad && storedRole && !isAuthenticated && !role) {
      return true;
    }
    return false;
  }, [isInitialLoad, isAuthenticated, role]);

  // Combine all loading states
  const isLoading = useMemo(() => {
    return (
      brandingLoading ||
      isAuthLoading ||
      isFetching > 0 ||
      isNavigating ||
      isInitialLoad
    );
  }, [brandingLoading, isAuthLoading, isFetching, isNavigating, isInitialLoad]);

  // Debounce rapid state changes to prevent flickering
  const [debouncedLoading, setDebouncedLoading] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      // Show immediately when loading starts
      setDebouncedLoading(true);
    } else {
      // Delay hiding to prevent flickering (minimum display time)
      const timer = setTimeout(() => {
        setDebouncedLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return debouncedLoading;
};

