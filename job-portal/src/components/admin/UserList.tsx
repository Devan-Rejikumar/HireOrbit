import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '../ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, User, Shield, ShieldOff, ChevronLeft, ChevronRight, Search, Filter, RefreshCw, Users, TrendingUp, AlertCircle, Clock, Eye, Mail, MapPin } from 'lucide-react';
import api from '@/api/axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt?: string;
  lastLogin?: string;
  location?: string;
};

type UsersResponse = {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    pageSize: number;
  };
};

type UserStatus = 'all' | 'verified' | 'unverified' | 'blocked' | 'active';

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter]);

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      // Fetch all users without pagination to get complete dataset
      const res = await api.get<UsersResponse>(`/users/admin/users?page=1&limit=1000`);
      console.log('API Response:', res.data); 
      
      const responseData = res.data as UsersResponse;
      
      
      if (responseData && responseData.users && responseData.pagination) {
        setUsers(responseData.users);
        setTotalPages(responseData.pagination.totalPages);
        setTotalUsers(responseData.pagination.totalUsers);
      } else if (responseData && Array.isArray(responseData.users)) {
        setUsers(responseData.users);
        setTotalUsers(responseData.users.length);
        setTotalPages(1);
      } else if (Array.isArray(responseData)) {
        setUsers(responseData);
        setTotalUsers(responseData.length);
        setTotalPages(1);
      } else {
        console.error('Invalid response format:', responseData);
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1);
        toast.error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error('Failed to fetch users');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    switch (statusFilter) {
      case 'verified':
        filtered = filtered.filter(u => u.isVerified);
        break;
      case 'unverified':
        filtered = filtered.filter(u => !u.isVerified);
        break;
      case 'blocked':
        filtered = filtered.filter(u => u.isBlocked);
        break;
      case 'active':
        filtered = filtered.filter(u => !u.isBlocked);
        break;
      default:
        break;
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / pageSize));
  };

  // Calculate pagination for current filtered data
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const calculatedTotalPages = Math.ceil(filteredUsers.length / pageSize);

  const handleToggleBlock = async (id: string, userName: string, currentBlocked: boolean) => {
    const action = currentBlocked ? 'unblock' : 'block';
    const endpoint = `/users/admin/users/${id}/${action}`;
    
    try {
      await api.patch(endpoint);
      setUsers(users =>
        users.map(u => u.id === id ? { ...u, isBlocked: !currentBlocked } : u),
      );
      toast.success(`${userName} has been ${currentBlocked ? 'unblocked' : 'blocked'} successfully`);
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else {
        toast.error(`Failed to ${action} user`);
      }
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

  const getUserStats = () => {
    const total = users.length;
    const verified = users.filter(u => u.isVerified).length;
    const unverified = users.filter(u => !u.isVerified).length;
    const blocked = users.filter(u => u.isBlocked).length;
    const active = users.filter(u => !u.isBlocked).length;
    
    return { total, verified, unverified, blocked, active };
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">User Management</h2>
          <p className="text-gray-300 mt-1">Manage and monitor user accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 shadow-md"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-purple-600/20 p-3 rounded-lg">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">+8% from last month</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Verified</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.verified}</p>
            </div>
            <div className="bg-green-600/20 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">Verified accounts</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Unverified</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{stats.unverified}</p>
            </div>
            <div className="bg-amber-600/20 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <AlertCircle className="h-4 w-4 text-amber-400 mr-1" />
            <span className="text-sm text-amber-400">Need verification</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{stats.active}</p>
            </div>
            <div className="bg-blue-600/20 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Shield className="h-4 w-4 text-blue-400 mr-1" />
            <span className="text-sm text-blue-400">Active users</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Blocked</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{stats.blocked}</p>
            </div>
            <div className="bg-red-600/20 p-3 rounded-lg">
              <ShieldOff className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <XCircle className="h-4 w-4 text-red-400 mr-1" />
            <span className="text-sm text-red-400">Blocked accounts</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-xl shadow-xl border border-purple-500/20 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Filter:</span>
          </div>
        </div>

        {/* Enhanced Filter Tabs */}
        <div className="mt-4 border-t border-gray-700 pt-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Users', count: stats.total, color: 'blue' },
              { key: 'verified', label: 'Verified', count: stats.verified, color: 'green' },
              { key: 'unverified', label: 'Unverified', count: stats.unverified, color: 'amber' },
              { key: 'active', label: 'Active', count: stats.active, color: 'blue' },
              { key: 'blocked', label: 'Blocked', count: stats.blocked, color: 'red' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as UserStatus)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === tab.key
                    ? 'bg-purple-600 text-white border border-purple-500'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  statusFilter === tab.key
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced User Table */}
      <div className="bg-gray-800 rounded-xl shadow-xl border border-purple-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{user.username || 'Unknown User'}</div>
                        <div className="text-sm text-gray-400 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'Admin' || user.role === 'admin' 
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' 
                        : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {user.isVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600/20 text-green-400 border border-green-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-600/20 text-amber-400 border border-amber-500/30">
                            <Clock className="h-3 w-3 mr-1" />
                            Unverified
                          </span>
                        )}
                      </div>
                      {user.isBlocked && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600/20 text-red-400 border border-red-500/30">
                          <ShieldOff className="h-3 w-3 mr-1" />
                          Blocked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center transition-colors duration-200"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium ${user.isBlocked ? 'text-red-400' : 'text-green-400'}`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                        <button
                          onClick={() => handleToggleBlock(user.id, user.username || 'Unknown User', user.isBlocked)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                            user.isBlocked ? 'bg-red-600/30' : 'bg-green-600/30'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.isBlocked ? 'translate-x-1' : 'translate-x-6'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-sm font-medium text-white mb-2">No users found</h3>
                      <p className="text-sm text-gray-400">
                        {searchTerm ? 'Try adjusting your search terms.' : 'No users are registered in the system yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {filteredUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, filteredUsers.length)}</span> of{' '}
              <span className="font-medium">{filteredUsers.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              {calculatedTotalPages > 1 && (
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
              )}
              
              {calculatedTotalPages > 1 && (
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, calculatedTotalPages) }, (_, i) => {
                    let pageNumber;
                    if (calculatedTotalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= calculatedTotalPages - 2) {
                      pageNumber = calculatedTotalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {calculatedTotalPages > 1 && (
                <button
                  onClick={() => setCurrentPage(Math.min(calculatedTotalPages, currentPage + 1))}
                  disabled={currentPage === calculatedTotalPages}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                <button
                  onClick={closeUserModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* User Avatar and Basic Info */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.username ? selectedUser.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedUser.username || 'Unknown User'}</h4>
                    <p className="text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Account Information</h5>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          selectedUser.role === 'Admin' || selectedUser.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {selectedUser.role === 'admin' ? 'Admin' : selectedUser.role}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account Status</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {selectedUser.isVerified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Unverified
                            </span>
                          )}
                          {selectedUser.isBlocked && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              <ShieldOff className="h-3 w-3 mr-1" />
                              Blocked
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">User ID</p>
                        <p className="text-sm text-gray-900 mt-1 font-mono">{selectedUser.id}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Activity Information</h5>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Registration Date</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Not available'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Login</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Never logged in'}
                        </p>
                      </div>
                      {selectedUser.location && (
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="text-sm text-gray-900 mt-1 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {selectedUser.location}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="border-t border-gray-200 pt-6">
                  <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h5>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleBlock(selectedUser.id, selectedUser.username, selectedUser.isBlocked)}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedUser.isBlocked 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                      }`}
                    >
                      {selectedUser.isBlocked ? (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Unblock User
                        </>
                      ) : (
                        <>
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Block User
                        </>
                      )}
                    </button>
                    <button className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 border border-blue-200 text-sm font-medium transition-colors">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeUserModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
