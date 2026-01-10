import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import {
  Home,
  MessageSquare,
  Building2,
  User,
  Briefcase,
  Calendar as CalendarIcon,
  FileText,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CompanyProfile {
  companyName?: string;
  email?: string;
  logo?: string;
}

interface CompanySidebarProps {
  company: CompanyProfile | null;
  totalUnreadMessages?: number;
  isCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const CompanySidebar: React.FC<CompanySidebarProps> = ({
  company,
  totalUnreadMessages = 0,
  isCollapsed: controlledCollapsed,
  onCollapseChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    // Default to collapsed on mobile, open on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024; // lg breakpoint
    }
    return false;
  });

  // Use controlled state if provided, otherwise use internal state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setIsCollapsed = onCollapseChange || setInternalCollapsed;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isCollapsed) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed, setIsCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navigationItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: ROUTES.COMPANY_DASHBOARD,
      exact: false,
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      path: ROUTES.CHAT,
      exact: false,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
    },
    {
      icon: Building2,
      label: 'Company Profile',
      path: ROUTES.COMPANY_DASHBOARD, // Navigates to dashboard with profile section
      exact: false,
    },
    {
      icon: User,
      label: 'All Applicants',
      path: ROUTES.COMPANY_APPLICATIONS,
      exact: true,
    },
    {
      icon: Briefcase,
      label: 'Job Listing',
      path: ROUTES.COMPANY_JOBS,
      exact: true,
    },
    {
      icon: CalendarIcon,
      label: 'Interview Management',
      path: ROUTES.COMPANY_INTERVIEWS,
      exact: true,
      multiline: true,
    },
    {
      icon: FileText,
      label: 'My Offers',
      path: ROUTES.COMPANY_OFFERS,
      exact: true,
    },
    {
      icon: CreditCard,
      label: 'Plans & Billing',
      path: ROUTES.SUBSCRIPTIONS,
      exact: false,
    },
  ];

  const settingsItems = [
    {
      icon: Settings,
      label: 'Settings',
      path: ROUTES.COMPANY_SETTINGS,
      exact: true,
    },
  ];

  const isActive = (item: typeof navigationItems[0] | typeof settingsItems[0]) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Auto-collapse on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[5] lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white shadow-sm border-r border-gray-200 fixed top-[68px] left-0 bottom-0 overflow-y-auto hide-scrollbar transition-all duration-300 z-10 ${
          isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        }`}
      >
        <nav className="p-6">
          {/* Main Navigation */}
          <div className="space-y-1 mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Main
            </h3>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-start gap-3 px-3 py-2 rounded-lg w-full text-left relative ${
                    active
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${item.multiline ? '' : ''}`} />
                  <span className={`flex-1 ${item.multiline ? 'flex flex-col leading-tight' : ''}`}>
                    {item.multiline ? (
                      <>
                        <span>Interview</span>
                        <span>Management</span>
                      </>
                    ) : (
                      item.label
                    )}
                  </span>
                  {item.badge !== undefined && (
                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Settings Section */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Setting
            </h3>
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left ${
                    active
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Company Info */}
          <div className="mt-8">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:shadow-md transition-all duration-300">
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt={company.companyName || 'Company logo'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-purple-200 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {company?.companyName || 'Company'}
                </div>
                <div className="text-xs text-purple-600">{company?.email || 'email@company.com'}</div>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Toggle Button - Desktop */}
      <button
        onClick={toggleCollapse}
        className={`hidden lg:block absolute top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-r-lg p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 ${
          isCollapsed ? 'left-0' : 'left-64'
        }`}
        aria-label={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsCollapsed(false)}
        className={`fixed top-[84px] left-2 z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 lg:hidden ${
          isCollapsed ? 'block' : 'hidden'
        }`}
        aria-label="Show sidebar"
      >
        <ChevronRight className="h-5 w-5 text-gray-600" />
      </button>
    </>
  );
};

