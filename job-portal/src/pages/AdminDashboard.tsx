import React, { useState } from 'react';
import CompanyList from '@/components/admin/CompanyList';
import UserList from '@/components/admin/UserList';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { FiLogOut } from 'react-icons/fi';

const AdminDashboard: React.FC = () => {
  const [selected, setSelected] = useState<'company-list' | 'users' | 'dashboard'>('company-list');
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="w-full flex items-center justify-between bg-white shadow px-8 py-4">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          onClick={handleLogout}
          title="Logout"
        >
          <FiLogOut size={22} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>
  
      {/* Main content area with sidebar and main */}
      <div className="flex flex-1">
        <aside className="w-64 bg-white shadow-md flex flex-col">
          <nav className="flex-1 p-4 space-y-2">
            <button
              className={`w-full text-left px-4 py-2 rounded ${selected === 'company-list' ? 'bg-slate-200 font-semibold' : 'hover:bg-slate-100'}`}
              onClick={() => setSelected('company-list')}
            >
              Company List
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded ${selected === 'users' ? 'bg-slate-200 font-semibold' : 'hover:bg-slate-100'}`}
              onClick={() => setSelected('users')}
            >
              User List
            </button>
          </nav>
        </aside>
  
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-lg text-slate-700 mb-6">
            Welcome, Admin! Here you can manage users, companies, and more.
          </p>
          {selected === 'company-list' && <CompanyList />}
          {selected === 'users' && <UserList />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;