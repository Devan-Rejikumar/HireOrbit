import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  type TooltipItem,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { subscriptionService } from '@/api/subscriptionService';
import { FiDollarSign, FiUsers, FiHome, FiRefreshCw, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { MESSAGES } from '@/constants/messages';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);

type TimeFilter = 'day' | 'week' | 'month' | 'year' | 'all';

interface RevenueStatistics {
  totalRevenue: number;
  revenueByUserType: {
    user: number;
    company: number;
  };
  revenueByPlan: Array<{
    planId: string;
    planName: string;
    userType: string;
    revenue: number;
  }>;
  revenueByTimePeriod: Array<{
    period: string;
    revenue: number;
  }>;
}

interface Transaction {
  id: string;
  subscriptionId?: string;
  userId?: string;
  companyId?: string;
  planId: string;
  planName: string;
  userType: string;
  amount: number;
  currency: string;
  status: string;
  billingPeriod: string;
  paymentDate: string;
  stripeInvoiceId?: string;
}

const AdminRevenue: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState<RevenueStatistics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const getDateRange = (filter: TimeFilter): { startDate?: string; endDate?: string } => {
    if (filter === 'all') {
      return {};
    }
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    if (filter === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (filter === 'week') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (filter === 'month') {
      startDate.setMonth(now.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (filter === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
    }
    
    // Format dates as YYYY-MM-DD using local timezone to avoid timezone conversion issues
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  };

  const fetchStatistics = useCallback(async () => {
    try {
      setRefreshing(true);
      const { startDate, endDate } = getDateRange(timeFilter);
      const response = await subscriptionService.admin.getRevenueStatistics(startDate, endDate);
      
      if (response.data?.statistics) {
        setStatistics(response.data.statistics);
      }
    } catch (error: unknown) {
      console.error('Error fetching revenue statistics:', error);
      toast.error(MESSAGES.ERROR.REVENUE_STATS_LOAD_FAILED, {
        duration: 4000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter]);

  const fetchTransactions = useCallback(async (page: number = 1) => {
    try {
      setTransactionsLoading(true);
      const { startDate, endDate } = getDateRange(timeFilter);
      const response = await subscriptionService.admin.getTransactionHistory({
        startDate,
        endDate,
        page,
        limit: 10,
      });
      
      if (response.data) {
        setTransactions(response.data.transactions);
        setTransactionsTotal(response.data.total);
        setTransactionsPage(response.data.page);
      }
    } catch (error: unknown) {
      console.error('Error fetching transactions:', error);
      toast.error(MESSAGES.ERROR.TRANSACTION_HISTORY_LOAD_FAILED, {
        duration: 4000,
      });
    } finally {
      setTransactionsLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchStatistics();
    fetchTransactions(1);
  }, [fetchStatistics, fetchTransactions]);

  const handleSyncTransactions = async () => {
    try {
      setSyncing(true);
      const response = await subscriptionService.admin.syncTransactions(100);
      toast.success(`Synced ${response.data.synced} transactions. ${response.data.skipped} skipped.`, {
        duration: 5000,
      });
      // Refresh data after sync
      await fetchStatistics();
      await fetchTransactions(1);
    } catch (error: unknown) {
      console.error('Error syncing transactions:', error);
      toast.error(MESSAGES.ERROR.STRIPE_SYNC_FAILED, {
        duration: 4000,
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Revenue by user type chart data
  const userTypeChartData = statistics ? {
    labels: ['Users', 'Companies'],
    datasets: [
      {
        label: 'Revenue',
        data: [statistics.revenueByUserType.user, statistics.revenueByUserType.company],
        backgroundColor: ['rgba(147, 51, 234, 0.8)', 'rgba(59, 130, 246, 0.8)'],
        borderColor: ['rgba(147, 51, 234, 1)', 'rgba(59, 130, 246, 1)'],
        borderWidth: 2,
      },
    ],
  } : null;

  // Revenue by plan chart data
  const planChartData = statistics && statistics.revenueByPlan.length > 0 ? {
    labels: statistics.revenueByPlan.map(p => `${p.planName} (${p.userType})`),
    datasets: [
      {
        label: 'Revenue',
        data: statistics.revenueByPlan.map(p => p.revenue),
        backgroundColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(147, 51, 234, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  } : null;

  // Revenue over time chart data
  const timeChartData = statistics && statistics.revenueByTimePeriod.length > 0 ? {
    labels: statistics.revenueByTimePeriod.map(p => {
      const date = new Date(p.period);
      if (timeFilter === 'day' || timeFilter === 'week') {
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      }
      return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Revenue',
        data: statistics.revenueByTimePeriod.map(p => p.revenue),
        borderColor: 'rgba(147, 51, 234, 1)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const parsed = context.parsed;
            const value = typeof parsed === 'object' && parsed !== null && 'y' in parsed 
              ? (parsed.y ?? 0) 
              : typeof parsed === 'number' 
                ? parsed 
                : 0;
            return `Revenue: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
      y: {
        ticks: {
          color: '#9ca3af',
          callback: (value: number | string) => formatCurrency(typeof value === 'number' ? value : parseFloat(value) || 0),
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        beginAtZero: true,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const parsed = context.parsed;
            const value = typeof parsed === 'object' && parsed !== null && 'y' in parsed 
              ? (parsed.y ?? 0) 
              : typeof parsed === 'number' 
                ? parsed 
                : 0;
            return `Revenue: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
      y: {
        ticks: {
          color: '#9ca3af',
          callback: (value: number | string) => formatCurrency(typeof value === 'number' ? value : parseFloat(value) || 0),
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e5e7eb',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const label = context.label || '';
            const parsed = context.parsed;
            const value = typeof parsed === 'number' ? parsed : 0;
            return `${label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading revenue statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Revenue Dashboard</h2>
            <p className="text-gray-400">Track subscription revenue and transactions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400 font-medium">Time Period:</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="all">All</option>
              </select>
            </div>
            <button
              onClick={handleSyncTransactions}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
              title="Sync missing transactions from Stripe"
            >
              <FiRefreshCw className={syncing ? 'animate-spin' : ''} />
              Sync from Stripe
            </button>
            <button
              onClick={() => {
                fetchStatistics();
                fetchTransactions(1);
              }}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600/20 rounded-lg">
              <FiDollarSign className="text-2xl text-purple-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-white">
            {statistics ? formatCurrency(statistics.totalRevenue) : '₹0.00'}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <FiUsers className="text-2xl text-blue-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">User Revenue</h3>
          <p className="text-2xl font-bold text-white">
            {statistics ? formatCurrency(statistics.revenueByUserType.user) : '₹0.00'}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600/20 rounded-lg">
              <FiHome className="text-2xl text-green-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Company Revenue</h3>
          <p className="text-2xl font-bold text-white">
            {statistics ? formatCurrency(statistics.revenueByUserType.company) : '₹0.00'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Over Time</h3>
          <div className="h-64">
            {timeChartData ? (
              <Line data={timeChartData} options={lineChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Revenue by User Type */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue by User Type</h3>
          <div className="h-64">
            {userTypeChartData ? (
              <Doughnut data={userTypeChartData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No revenue data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue by Plan */}
      {planChartData && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue by Plan</h3>
          <div className="h-64">
            <Bar data={planChartData} options={barChartOptions} />
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {transactionsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(transaction.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {transaction.planName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.userType === 'user'
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-green-600/20 text-green-400'
                      }`}>
                        {transaction.userType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                      {transaction.billingPeriod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'succeeded'
                          ? 'bg-green-600/20 text-green-400'
                          : transaction.status === 'failed'
                            ? 'bg-red-600/20 text-red-400'
                            : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {transactionsTotal > 10 && (
          <div className="p-4 border-t border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {((transactionsPage - 1) * 10) + 1} to {Math.min(transactionsPage * 10, transactionsTotal)} of {transactionsTotal} transactions
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchTransactions(transactionsPage - 1)}
                disabled={transactionsPage === 1 || transactionsLoading}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchTransactions(transactionsPage + 1)}
                disabled={transactionsPage * 10 >= transactionsTotal || transactionsLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;

