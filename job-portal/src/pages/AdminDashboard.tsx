import React, { useState } from 'react';
import CompanyList from '@/components/admin/CompanyList';
import UserList from '@/components/admin/UserList';
import AdminJobManagement from '@/pages/AdminJobManagement';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { FiLogOut, FiUsers, FiHome, FiBarChart2, FiShield, FiBriefcase } from 'react-icons/fi';

const AdminDashboard: React.FC = () => {
  const [selected, setSelected] = useState<'dashboard' | 'users' | 'company-list' | 'job-management'>('dashboard');
  const navigate = useNavigate();

  const handleLogout = async() =>{
    try {
      console.log(1);
      await api.post('/users/admin/logout');
      navigate('/admin/login',{ replace:true });
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
        <aside className="w-64 bg-gray-800 shadow-xl flex flex-col border-r border-purple-500/20">
          <nav className="flex-1 p-4 space-y-2">
            <button
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
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
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
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
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
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
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                selected === 'job-management' 
                  ? 'bg-purple-600 text-white font-semibold shadow-lg border-l-4 border-purple-400' 
                  : 'hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
              onClick={() => setSelected('job-management')}
            >
              <FiBriefcase size={20} />
              Job Management
            </button>
          </nav>
        </aside>
  
        <main className="flex-1 p-8 bg-gray-900">
          {selected === 'dashboard' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="mb-6">
                  <FiShield className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h1 className="text-4xl font-bold text-white mb-2">Welcome Admin!</h1>
                  <p className="text-xl text-gray-300">
                    Manage your job portal from this dashboard
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-gray-800 p-6 rounded-lg shadow-xl border-l-4 border-purple-500 hover:bg-gray-750 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total Users</p>
                        <p className="text-2xl font-bold text-white">1,234</p>
                      </div>
                      <FiUsers className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-6 rounded-lg shadow-xl border-l-4 border-purple-500 hover:bg-gray-750 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total Companies</p>
                        <p className="text-2xl font-bold text-white">89</p>
                      </div>
                      <FiHome className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-6 rounded-lg shadow-xl border-l-4 border-purple-500 hover:bg-gray-750 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Active Jobs</p>
                        <p className="text-2xl font-bold text-white">456</p>
                      </div>
                      <FiBarChart2 className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selected === 'company-list' && <CompanyList />}
          
          {selected === 'users' && <UserList />}
          
          {selected === 'job-management' && <AdminJobManagement />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;