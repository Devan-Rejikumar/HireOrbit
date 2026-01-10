import React, { useState, useEffect } from 'react';
import { CompanyHeader } from './CompanyHeader';
import { CompanySidebar } from './CompanySidebar';
import { useTotalUnreadCount } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { ApiResponse } from '@/types/api';

interface CompanyProfile {
  id?: string;
  companyName?: string;
  email?: string;
  profileCompleted?: boolean;
  isVerified?: boolean;
  logo?: string;
}

interface CompanyLayoutProps {
  children: React.ReactNode;
  company?: CompanyProfile | null;
  onCompanyChange?: (company: CompanyProfile | null) => void;
}

export const CompanyLayout: React.FC<CompanyLayoutProps> = ({
  children,
  company: propCompany,
  onCompanyChange,
}) => {
  const { company: authCompany } = useAuth();
  const [company, setCompany] = useState<CompanyProfile | null>(propCompany || null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Default to collapsed on mobile, open on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024; // lg breakpoint
    }
    return false;
  });

  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(
    authCompany?.id || company?.id || null,
  );

  // Fetch company profile if not provided
  useEffect(() => {
    if (!propCompany && authCompany?.id) {
      const fetchCompanyProfile = async () => {
        try {
          const response = await api.get<ApiResponse<any>>('/company/profile');
          const fetchedCompany = response.data?.data?.company || null;
          setCompany(fetchedCompany);
          if (onCompanyChange) {
            onCompanyChange(fetchedCompany);
          }
        } catch (_error) {
          // Silently handle error
        }
      };
      fetchCompanyProfile();
    } else if (propCompany) {
      setCompany(propCompany);
    }
  }, [propCompany, authCompany?.id, onCompanyChange]);

  // Handle window resize for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CompanyHeader company={company} />

      <div className="flex min-h-screen relative">
        {/* Sidebar */}
        <CompanySidebar
          company={company}
          totalUnreadMessages={totalUnreadMessages}
          isCollapsed={isSidebarCollapsed}
          onCollapseChange={setIsSidebarCollapsed}
        />

        {/* Main Content */}
        <main
          className={`flex-1 p-4 md:p-6 pt-20 md:pt-[84px] transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

