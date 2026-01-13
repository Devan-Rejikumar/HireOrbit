import React, { useState } from 'react';
import CompanyList from '@/components/admin/CompanyList';
import UserList from '@/components/admin/UserList';
import AdminJobManagement from '@/pages/AdminJobManagement';
import AdminSkills from '@/components/admin/AdminSkills';
import AdminIndustryCategories from '@/components/admin/AdminIndustryCategories';
import AdminStatistics from '@/components/admin/AdminStatistics';
import AdminSubscriptionPlans from '@/components/admin/AdminSubscriptionPlans';
import AdminRevenue from '@/components/admin/AdminRevenue';
import AdminSettings from '@/components/admin/AdminSettings';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import api from '@/api/axios';
import { FiLogOut, FiUsers, FiHome, FiBarChart2, FiShield, FiBriefcase, FiLayers, FiCreditCard, FiSettings, FiMenu, FiX } from 'react-icons/fi';

const AdminDashboard: React.FC = () => {
  const [selected, setSelected] = useState<'dashboard' | 'users' | 'company-list' | 'job-management' | 'skills' | 'industries' | 'subscriptions' | 'revenue' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async() =>{
    try {
      await api.post('/users/admin/logout');
      navigate(ROUTES.ADMIN_LOGIN,{ replace:true });
    } catch (error) {
      // Silently handle error
    }
  };

  const handleNavClick = (section: typeof selected) => {
    setSelected(section);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="w-full flex items-center justify-between bg-gray-800 shadow-lg px-4 sm:px-8 py-3 sm:py-4 border-b border-purple-500/20 sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <FiX className="text-xl text-white" /> : <FiMenu className="text-xl text-white" />}
          </button>
          <FiShield className="text-xl sm:text-2xl text-purple-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">Admin Panel</h2>
        </div>
        <button
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md text-sm sm:text-base"
          onClick={handleLogout}
          title="Logout"
        >
          <FiLogOut size={18} className="sm:w-[22px] sm:h-[22px]" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
  
      {/* Main content area with sidebar and main */}
      <div className="flex flex-1 relative">
        {/* Sidebar - Desktop: always visible, Mobile: slide-out overlay */}
        <aside className={`
          fixed lg:sticky top-[52px] sm:top-[60px] lg:top-0 left-0 z-40 lg:z-0
          w-64 sm:w-72 lg:w-64 flex-shrink-0 bg-gray-800 shadow-xl flex flex-col border-r border-purple-500/20
          h-[calc(100vh-52px)] sm:h-[calc(100vh-60px)] lg:h-auto lg:min-h-[calc(100vh-60px)]
          overflow-y-auto
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2">
            <button
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                selected === 'dashboard' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => handleNavClick('dashboard')}
            >
              <FiBarChart2 size={18} className="sm:w-5 sm:h-5" />
              Dashboard
            </button>
            <button
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                selected === 'company-list' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => handleNavClick('company-list')}
            >
              <FiHome size={18} className="sm:w-5 sm:h-5" />
              Company List
            </button>
            <button
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                selected === 'users' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => handleNavClick('users')}
            >
              <FiUsers size={18} className="sm:w-5 sm:h-5" />
              User List
            </button>
            <button
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                selected === 'job-management' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => handleNavClick('job-management')}
            >
              <FiBriefcase size={18} className="sm:w-5 sm:h-5" />
              Job Management
            </button>
            <button
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                selected === 'skills' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => handleNavClick('skills')}
            >
              <FiHome size={18} className="sm:w-5 sm:h-5" />
              Skill Management
            </button>
            <button
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                selected === 'industries' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => handleNavClick('industries')}
            >
              <FiLayers size={18} className="sm:w-5 sm:h-5" />
              Industry Management
            </button>
            <button
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                selected === 'subscriptions' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => handleNavClick('subscriptions')}
            >
              <FiCreditCard size={18} className="sm:w-5 sm:h-5" />
              Subscription Plans
            </button>
            <button
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                selected === 'revenue' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => handleNavClick('revenue')}
            >
              <span className="text-base sm:text-lg font-bold">₹</span>
              Revenue
            </button>
            <button
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                selected === 'settings' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => handleNavClick('settings')}
            >
              <FiSettings size={18} className="sm:w-5 sm:h-5" />
              Settings
            </button>
          </nav>
        </aside>
  
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-900 overflow-x-hidden overflow-y-auto flex flex-col min-w-0">
          {selected === 'dashboard' && <AdminStatistics />}
          
          {selected === 'company-list' && <CompanyList />}
          
          {selected === 'users' && <UserList />}
          
          {selected === 'job-management' && <AdminJobManagement />}
          {selected === 'skills' && <AdminSkills />}
          {selected === 'industries' && <AdminIndustryCategories />}
          {selected === 'subscriptions' && <AdminSubscriptionPlans />}
          {selected === 'revenue' && <AdminRevenue />}
          {selected === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;