import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Calendar, MessageSquare, Lock, Home, Search, Briefcase, Settings, FileText, Menu, X, ChevronRight } from 'lucide-react';
import { useTotalUnreadCount } from '@/hooks/useChat';
import AppliedJobs from '@/components/AppliedJobs';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import Header from '@/components/Header';

const AppliedJobsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(user?.id || null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  if (!user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home, path: '/user/dashboard' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'applied-jobs', label: 'Applied Jobs', icon: Briefcase, path: '/applied-jobs' },
    { id: 'offers', label: 'My Offers', icon: FileText, path: '/user/offers' },
    { id: 'schedule', label: 'My Schedule', icon: Calendar, path: '/schedule' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages', ...(totalUnreadMessages > 0 ? { badge: totalUnreadMessages } : {}) },
    { id: 'password', label: 'Change Password', icon: Lock, path: null },
  ];

  const handleSidebarClick = (item: typeof sidebarItems[0]) => {
    setIsSidebarOpen(false);
    if (item.path) {
      navigate(item.path);
    } else if (item.id === 'password') {
      setIsChangePasswordModalOpen(true);
    }
  };

  const isActive = (itemId: string) => {
    if (itemId === 'applied-jobs') return location.pathname === '/applied-jobs';
    if (itemId === 'offers') return location.pathname === '/user/offers';
    if (itemId === 'schedule') return location.pathname === '/schedule';
    if (itemId === 'profile') return location.pathname === '/profile';
    if (itemId === 'overview') return location.pathname === '/user/dashboard';
    return false;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Mobile Menu Button - Fixed position */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-16 left-4 z-40 bg-white shadow-lg rounded-full p-2.5 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 pt-14"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen relative pt-14 sm:pt-16">
        {/* Sidebar - Desktop: always visible, Mobile: slide-out overlay */}
        <aside className={`
          fixed lg:sticky top-14 sm:top-16 left-0 z-40 lg:z-0
          w-72 lg:w-64 bg-white shadow-lg lg:shadow-sm border-r border-gray-200 
          h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-y-auto 
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 sm:p-6">
            {/* Mobile: User Info at top */}
            <div className="lg:hidden mb-6 pt-2">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-lg">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-900 truncate">{user?.username || 'User'}</div>
                  <div className="text-sm text-blue-600 truncate">{user?.email || 'email@example.com'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Main</h3>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.id);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-all duration-200 group ${
                      active
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                    <span className="flex-1 text-sm sm:text-base">{item.label}</span>
                    {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center ${
                        active ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                      }`}>
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                    <ChevronRight className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'text-white' : 'text-gray-400'}`} />
                  </button>
                );
              })}
            </div>
            
            <div className="space-y-1 mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Settings</h3>
              <button 
                className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl w-full text-left transition-all duration-200 group"
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Settings</span>
                <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
              </button>
            </div>
            
            {/* Desktop: User Info at bottom */}
            <div className="hidden lg:block mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{user?.username || 'User'}</div>
                  <div className="text-xs text-blue-600 truncate">{user?.email || 'email@example.com'}</div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="pl-10 lg:pl-0">
            <AppliedJobs userId={user.id} />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-colors min-w-[60px] text-gray-500"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
          </button>
          
          <button
            onClick={() => navigate('/jobs')}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 transition-colors min-w-[60px]"
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Jobs</span>
          </button>
          
          <button
            onClick={() => navigate('/applied-jobs')}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-colors min-w-[60px] text-blue-600"
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Applied</span>
          </button>
          
          <button
            onClick={() => navigate('/messages')}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 transition-colors min-w-[60px] relative"
          >
            <MessageSquare className="h-5 w-5" />
            {totalUnreadMessages > 0 && (
              <span className="absolute top-0 right-2 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
              </span>
            )}
            <span className="text-[10px] mt-0.5 font-medium">Messages</span>
          </button>
          
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 transition-colors min-w-[60px]"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="lg:hidden h-16" />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default AppliedJobsPage;
