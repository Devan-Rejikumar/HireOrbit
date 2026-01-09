import React, { useEffect, useState } from 'react';
import { subscriptionService, SubscriptionPlan } from '@/api/subscriptionService';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiUsers, FiBriefcase, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { MESSAGES } from '@/constants/messages';

const AdminSubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedPlanFeatures, setSelectedPlanFeatures] = useState<string[]>([]);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');
  const [filterUserType, setFilterUserType] = useState<'all' | 'user' | 'company'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 5;

  // Form state
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'user' | 'company'>('user');
  const [priceMonthly, setPriceMonthly] = useState<string>('');
  const [priceYearly, setPriceYearly] = useState<string>('');
  const [features, setFeatures] = useState<string>('');
  const [description, setDescription] = useState('');

  const loadPlans = async (page?: number) => {
    try {
      setLoading(true);
      setError(null);
      const pageToLoad = page ?? currentPage;
      const userTypeFilter = filterUserType !== 'all' ? filterUserType : undefined;
      const response = await subscriptionService.admin.getAllPlans(pageToLoad, itemsPerPage, userTypeFilter);
      setPlans(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string; message?: string } } }) : null;
      const errorMsg = axiosError?.response?.data?.error || axiosError?.response?.data?.message || MESSAGES.ERROR.PLAN_LOAD_FAILED;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadPlans(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUserType]);

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const resetForm = () => {
    setName('');
    setUserType('user');
    setPriceMonthly('');
    setPriceYearly('');
    setFeatures('');
    setDescription('');
    setEditingPlan(null);
    setShowForm(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(MESSAGES.VALIDATION.PLAN_NAME_REQUIRED);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      interface PlanData {
        name: string;
        userType: 'user' | 'company';
        description?: string;
        priceMonthly?: number;
        priceYearly?: number;
        features?: string[];
      }
      const planData: PlanData = {
        name: name.trim(),
        userType,
        description: description.trim() || undefined,
      };

      if (priceMonthly.trim()) {
        const monthly = parseFloat(priceMonthly);
        if (isNaN(monthly) || monthly < 0) {
          setError(MESSAGES.VALIDATION.INVALID_MONTHLY_PRICE);
          return;
        }
        planData.priceMonthly = monthly;
      }

      if (priceYearly.trim()) {
        const yearly = parseFloat(priceYearly);
        if (isNaN(yearly) || yearly < 0) {
          setError(MESSAGES.VALIDATION.INVALID_YEARLY_PRICE);
          return;
        }
        planData.priceYearly = yearly;
      }

      if (features.trim()) {
        planData.features = features
          .split(',')
          .map(f => f.trim())
          .filter(f => f.length > 0);
      }

      if (editingPlan) {
        await subscriptionService.admin.updatePlan(editingPlan.id, planData);
        toast.success(MESSAGES.SUCCESS.PLAN_UPDATED);
      } else {
        await subscriptionService.admin.createPlan(planData);
        toast.success(MESSAGES.SUCCESS.PLAN_CREATED);
      }

      resetForm();
      await loadPlans();
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string; message?: string } } }) : null;
      const errorMsg = axiosError?.response?.data?.error || axiosError?.response?.data?.message || MESSAGES.ERROR.PLAN_SAVE_FAILED;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setUserType(plan.userType);
    setPriceMonthly(plan.priceMonthly?.toString() || '');
    setPriceYearly(plan.priceYearly?.toString() || '');
    // Handle both string array and feature object array
    const featureNames = plan.features?.map(f => typeof f === 'string' ? f : f.name) || [];
    setFeatures(featureNames.join(', '));
    setDescription('');
    setShowForm(true);
  };

  const openDeleteModal = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPlanToDelete(null);
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    
    try {
      setDeleteLoading(true);
      setError(null);
      await subscriptionService.admin.deletePlan(planToDelete.id);
      toast.success(MESSAGES.SUCCESS.PLAN_DELETED);
      await loadPlans();
      closeDeleteModal();
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string; message?: string } } }) : null;
      const errorMsg = axiosError?.response?.data?.error || axiosError?.response?.data?.message || MESSAGES.ERROR.PLAN_DELETE_FAILED;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) return 'Free';
    return `₹${price.toFixed(2)}`;
  };

  // No need for client-side filtering since backend handles it
  const filteredPlans = plans;

  const openFeaturesModal = (plan: SubscriptionPlan) => {
    const featureNames = plan.features?.map(f => typeof f === 'string' ? f : f.name) || [];
    setSelectedPlanFeatures(featureNames);
    setSelectedPlanName(plan.name);
    setShowFeaturesModal(true);
  };

  const closeFeaturesModal = () => {
    setShowFeaturesModal(false);
    setSelectedPlanFeatures([]);
    setSelectedPlanName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Subscription Plan Management</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
          >
            <FiPlus />
            Add New Plan
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiPlus className="text-purple-400" />
              {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-white"
            >
              <FiX size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2 rounded-md bg-red-900/40 border border-red-500 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Premium, Basic"
                  className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">User Type *</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as 'user' | 'company')}
                  className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={!!editingPlan}
                >
                  <option value="user">User</option>
                  <option value="company">Company</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(e.target.value)}
                  placeholder="0.00 (leave empty for free)"
                  className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Yearly Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(e.target.value)}
                  placeholder="0.00 (leave empty for free)"
                  className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Features (comma-separated)</label>
                <input
                  type="text"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="e.g. ats_checker, unlimited_jobs, featured_jobs"
                  className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Separate multiple features with commas
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Plan description..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                disabled={loading}
              >
                <FiX />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FiPlus />
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl shadow-xl border border-purple-500/20 overflow-hidden">
        <div className="flex items-center justify-between mb-4 p-6">
          <h2 className="text-lg font-semibold text-white">All Subscription Plans</h2>
          <div className="flex items-center gap-3">
            {loading && (
              <span className="text-xs text-gray-400">Loading...</span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Filter:</span>
              <button
                onClick={() => setFilterUserType('all')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filterUserType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterUserType('user')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                  filterUserType === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <FiUsers size={14} />
                User
              </button>
              <button
                onClick={() => setFilterUserType('company')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                  filterUserType === 'company'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <FiBriefcase size={14} />
                Company
              </button>
            </div>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-400 text-sm">No subscription plans found. Create your first plan above.</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-400 text-sm">No {filterUserType === 'all' ? '' : filterUserType} subscription plans found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Monthly Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Yearly Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Features</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{plan.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        plan.userType === 'user'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-green-500/20 text-green-300 border border-green-500/40'
                      }`}>
                        {plan.userType === 'user' ? <FiUsers size={12} /> : <FiBriefcase size={12} />}
                        {plan.userType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {formatPrice(plan.priceMonthly)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {formatPrice(plan.priceYearly)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <button
                          onClick={() => openFeaturesModal(plan)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700 text-sm transition-colors"
                          title="View all features"
                        >
                          <FiEye size={16} className="mr-1" />
                          View
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(plan)}
                        className="inline-flex items-center px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-xs"
                      >
                        <FiEdit2 className="mr-1" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(plan)}
                        className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 text-xs"
                      >
                        <FiTrash2 className="mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} plans
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <FiChevronLeft className="h-4 w-4" />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                Next
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features Modal */}
      {showFeaturesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeFeaturesModal}>
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-purple-500/20" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Features - {selectedPlanName}
                </h3>
                <button
                  onClick={closeFeaturesModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              {selectedPlanFeatures.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 mb-4">
                    This plan includes the following features:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlanFeatures.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-md text-sm bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 mb-4">
                    This plan includes all basic features:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-md text-sm bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Apply to Jobs
                    </span>
                    <span className="px-3 py-1.5 rounded-md text-sm bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      View Job Listings
                    </span>
                    <span className="px-3 py-1.5 rounded-md text-sm bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Basic Profile
                    </span>
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeFeaturesModal}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && planToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-purple-500/20">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Delete Subscription Plan
              </h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete the plan <strong className="text-white">"{planToDelete.name}"</strong>? 
                This action cannot be undone.
              </p>
              {planToDelete.userType && (
                <p className="text-sm text-yellow-400 mb-4">
                  ⚠️ Note: This plan cannot be deleted if there are active subscriptions using it.
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionPlans;

