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
import { CheckCircle, XCircle, User, Shield, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/api/axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
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

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<UsersResponse>(`/users/admin/users?page=${currentPage}&limit=${pageSize}`);
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
    }
  };

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {user.isVerified ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-sm">
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      {user.isBlocked && (
                        <Badge variant="destructive" className="text-xs">
                          Blocked
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {user.isBlocked ? (
                          <ShieldOff className="h-4 w-4 text-destructive" />
                        ) : (
                          <Shield className="h-4 w-4 text-success" />
                        )}
                        <Label htmlFor={`block-toggle-${user.id}`} className="text-sm font-medium">
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </Label>
                      </div>
                      <Switch
                        id={`block-toggle-${user.id}`}
                        checked={!user.isBlocked}
                        onCheckedChange={() => handleToggleBlock(user.id, user.name, user.isBlocked)}
                        className="data-[state=checked]:bg-success"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <User className="h-8 w-8 text-muted-foreground/50" />
                      <span>No users found</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalUsers)}
                  </span>{' '}
                  of <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserList;
