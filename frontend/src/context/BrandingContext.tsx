import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/api/axios';
import { ApiResponse } from '@/types/api';

interface SiteSettings {
  logoUrl: string | null;
  companyName: string | null;
  aboutPage: string | null;
}

interface BrandingContextType {
  settings: SiteSettings | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<any>>('/settings');
      if (response.data?.success && response.data?.data) {
        setSettings({
          logoUrl: response.data.data.logoUrl || null,
          companyName: response.data.data.companyName || 'Hireorbit',
          aboutPage: response.data.data.aboutPage || null,
        });
      } else {
        // Set defaults if no settings found
        setSettings({
          logoUrl: null,
          companyName: 'Hireorbit',
          aboutPage: null,
        });
      }
    } catch (error) {
      // Set defaults on error
      setSettings({
        logoUrl: null,
        companyName: 'Hireorbit',
        aboutPage: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    
    // Listen for branding updates
    const handleBrandingUpdate = () => {
      fetchSettings();
    };
    window.addEventListener('branding-updated', handleBrandingUpdate);
    
    // Refetch settings every 5 minutes to keep them updated
    const interval = setInterval(fetchSettings, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('branding-updated', handleBrandingUpdate);
    };
  }, []);

  return (
    <BrandingContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

