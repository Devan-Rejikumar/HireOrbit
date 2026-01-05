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
  
  // Only track fetches that are initial loads (no cached data yet)
  // This prevents loading bar from showing on background refetches or user interactions
  const isFetchingInitial = useIsFetching({ 
    predicate: (query) => {
      // Exclude chat-related queries (messages, conversations) - these are user-initiated switches
      // and shouldn't trigger loading bar
      const queryKey = query.queryKey as unknown[];
      const isChatQuery = queryKey.some(key => 
        typeof key === 'string' && (
          key.includes('messages') || 
          key.includes('conversation') || 
          key.includes('unread-count') ||
          key.includes('conversations')
        )
      );
      
      if (isChatQuery) {
        return false; // Never show loading bar for chat queries
      }
      
      // Only show loading for queries that don't have cached data yet (initial loads)
      // Background refetches will have data, so we ignore them
      const hasData = query.state.data !== undefined;
      const isFetching = query.state.fetchStatus === 'fetching';
      // Only show loading bar if it's fetching AND has no data (initial load)
      return isFetching && !hasData;
    }
  });

  // Track route changes
  const [isNavigating, setIsNavigating] = useState(false);
  const prevLocationRef = useRef(location.pathname);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const initialLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if location changed (route navigation)
  useEffect(() => {
    if (location.pathname !== prevLocationRef.current) {
      setIsNavigating(true);
      prevLocationRef.current = location.pathname;
      
      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      
      // Reset navigation state after route change completes
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        navigationTimeoutRef.current = null;
      }, 200);
      
      return () => {
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
      };
    }
  }, [location.pathname]);

  // Track initial load - mark as complete after first render and auth check
  useEffect(() => {
    if (isInitialLoad) {
      // Clear any existing timeout
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
        initialLoadTimeoutRef.current = null;
      }
      
      // Wait for branding and initial auth check
      initialLoadTimeoutRef.current = setTimeout(() => {
        setIsInitialLoad(false);
        initialLoadTimeoutRef.current = null;
      }, 500);
      
      return () => {
        if (initialLoadTimeoutRef.current) {
          clearTimeout(initialLoadTimeoutRef.current);
          initialLoadTimeoutRef.current = null;
        }
      };
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
      isFetchingInitial > 0 ||
      (isNavigating && isInitialLoad) || // Only show navigation loading on initial load
      isInitialLoad
    );
  }, [brandingLoading, isAuthLoading, isFetchingInitial, isNavigating, isInitialLoad]);

  // Debounce rapid state changes to prevent flickering
  const [debouncedLoading, setDebouncedLoading] = useState(isLoading);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (isLoading) {
      // Show immediately when loading starts
      setDebouncedLoading(true);
    } else {
      // Delay hiding to prevent flickering (minimum display time)
      debounceTimeoutRef.current = setTimeout(() => {
        setDebouncedLoading(false);
        debounceTimeoutRef.current = null;
      }, 300);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [isLoading]);

  return debouncedLoading;
};

