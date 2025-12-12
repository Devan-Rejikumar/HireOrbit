import React, { useState } from 'react';
import CompanyList from '@/components/admin/CompanyList';
import UserList from '@/components/admin/UserList';
import AdminJobManagement from '@/pages/AdminJobManagement';
import AdminSkills from '@/components/admin/AdminSkills';
import AdminIndustryCategories from '@/components/admin/AdminIndustryCategories';
import AdminStatistics from '@/components/admin/AdminStatistics';
import AdminSubscriptionPlans from '@/components/admin/AdminSubscriptionPlans';
import AdminRevenue from '@/components/admin/AdminRevenue';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import api from '@/api/axios';
import { FiLogOut, FiUsers, FiHome, FiBarChart2, FiShield, FiBriefcase, FiLayers, FiCreditCard } from 'react-icons/fi';

const AdminDashboard: React.FC = () => {
  const [selected, setSelected] = useState<'dashboard' | 'users' | 'company-list' | 'job-management' | 'skills' | 'industries' | 'subscriptions' | 'revenue'>('dashboard');
  const navigate = useNavigate();

  const handleLogout = async() =>{
    try {
      console.log(1);
      await api.post('/users/admin/logout');
      navigate(ROUTES.ADMIN_LOGIN,{ replace:true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="w-full flex items-center justify-between bg-gray-800 shadow-lg px-8 py-4 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <FiShield className="text-2xl text-purple-400" />
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md"
          onClick={handleLogout}
          title="Logout"
        >
          <FiLogOut size={22} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>
  
      {/* Main content area with sidebar and main */}
      <div className="flex flex-1">
        <aside className="w-64 flex-shrink-0 bg-gray-800 shadow-xl flex flex-col border-r border-purple-500/20">
          <nav className="flex-1 p-4 space-y-2">
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 whitespace-nowrap ${
                selected === 'dashboard' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => setSelected('dashboard')}
            >
              <FiBarChart2 size={20} />
              Dashboard
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 whitespace-nowrap ${
                selected === 'company-list' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => setSelected('company-list')}
            >
              <FiHome size={20} />
              Company List
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 whitespace-nowrap ${
                selected === 'users' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => setSelected('users')}
            >
              <FiUsers size={20} />
              User List
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 whitespace-nowrap ${
                selected === 'job-management' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => setSelected('job-management')}
            >
              <FiBriefcase size={20} />
              Job Management
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 whitespace-nowrap ${
                selected === 'skills' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => setSelected('skills')}
            >
              <FiHome size={20} />
              Skill Management
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 whitespace-nowrap ${
                selected === 'industries' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => setSelected('industries')}
            >
              <FiLayers size={20} />
              Industry Management
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 whitespace-nowrap ${
                selected === 'subscriptions' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => setSelected('subscriptions')}
            >
              <FiCreditCard size={20} />
              Subscription Plans
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 whitespace-nowrap ${
                selected === 'revenue' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => setSelected('revenue')}
            >
              <span className="text-lg font-bold">₹</span>
              Revenue
            </button>
          </nav>
        </aside>
  
        <main className="flex-1 p-8 bg-gray-900 overflow-hidden flex flex-col">
          {selected === 'dashboard' && <AdminStatistics />}
          
          {selected === 'company-list' && <CompanyList />}
          
          {selected === 'users' && <UserList />}
          
          {selected === 'job-management' && <AdminJobManagement />}
          {selected === 'skills' && <AdminSkills />}
          {selected === 'industries' && <AdminIndustryCategories />}
          {selected === 'subscriptions' && <AdminSubscriptionPlans />}
          {selected === 'revenue' && <AdminRevenue />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;