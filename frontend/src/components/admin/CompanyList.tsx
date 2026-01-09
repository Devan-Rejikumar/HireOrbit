import { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, X, ChevronLeft, ChevronRight, Clock, Check, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/api/axios';

type Company = {
  id: string;
  companyName: string;
  email: string;
  industry?: string;
  size?: string;
  description?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  isVerified: boolean;
  isBlocked: boolean;
  profileCompleted: boolean;
  rejectionReason?: string;
  createdAt: string;
  foundedYear?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
};

type CompaniesResponse = {
  success: boolean;
  data: {
    companies: Company[];
  };
  message: string;
  timestamp: string;
};

type CompanyDetailsResponse = {
  success: boolean;
  data: {
    company: Company;
  };
  message: string;
  timestamp: string;
};

type CompanyStatus = 'all' | 'pending' | 'approved' | 'rejected';

const CompanyList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<Company | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CompanyStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);

  useEffect(() => {
    fetchAllCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, statusFilter, searchTerm]);

  const fetchAllCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get<CompaniesResponse>('/company/admin/all');
      const companiesData = response.data.data?.companies || [];
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setTotalCompanies(Array.isArray(companiesData) ? companiesData.length : 0);
      setTotalPages(Math.ceil((Array.isArray(companiesData) ? companiesData.length : 0) / pageSize));
    } catch (error) {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;
    
    // Apply status filter
    switch (statusFilter) {
    case 'pending':
      filtered = companies.filter(c => c.profileCompleted && !c.isVerified && !c.rejectionReason);
      break;
    case 'approved':
      filtered = companies.filter(c => c.isVerified);
      break;
    case 'rejected':
      filtered = companies.filter(c => c.rejectionReason);
      break;
    default:
      filtered = companies;
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(company =>
        company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.contactPersonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.contactPersonEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    
    setFilteredCompanies(filtered);
  };

  const handleApprove = async (companyId: string) => {
    try {
      setActionLoading(companyId);
      await api.post(`/company/admin/${companyId}/approve`);
      
      // Update the company status in the list
      setCompanies(companies => 
        companies.map(c => 
          c.id === companyId 
            ? { ...c, isVerified: true, rejectionReason: undefined }
            : c,
        ),
      );
      toast.success('Company approved successfully! Approval email sent.');
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string } } }) : null;
      toast.error(axiosError?.response?.data?.error || 'Failed to approve company');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (companyId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(companyId);
      await api.post(`/company/admin/${companyId}/reject`, { reason });
      
      // Update the company status in the list
      setCompanies(companies => 
        companies.map(c => 
          c.id === companyId 
            ? { ...c, rejectionReason: reason, isVerified: false }
            : c,
        ),
      );
      setShowModal(false);
      setRejectionReason('');
      toast.success('Company rejected successfully! Rejection email sent.');
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string } } }) : null;
      toast.error(axiosError?.response?.data?.error || 'Failed to reject company');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (company: Company) => {
    setSelectedCompany(company);
    setShowModal(true);
    setRejectionReason('');
  };

  const fetchCompanyDetails = async (companyId: string) => {
    try {
      setDetailsLoading(true);
      const response = await api.get<CompanyDetailsResponse>(`/company/admin/${companyId}`);
      
      // Handle the actual response structure: { success: true, data: { company: {...} }, message: "...", timestamp: "..." }
      const companyData = response.data.data?.company;
      
      if (companyData) {
        setCompanyDetails(companyData);
        setShowDetailsModal(true);
      } else {
        toast.error('No company data received');
      }
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string } } }) : null;
      toast.error(axiosError?.response?.data?.error || 'Failed to fetch company details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewCompany = (company: Company) => {
    fetchCompanyDetails(company.id);
  };

  const getStatusBadge = (company: Company) => {
    if (!company.profileCompleted) {
      return <span className="flex items-center text-yellow-600"><Clock className="w-4 h-4 mr-1" />Incomplete</span>;
    }
    if (company.isVerified) {
      return <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1" />Approved</span>;
    }
    if (company.rejectionReason) {
      return <span className="flex items-center text-red-600"><XCircle className="w-4 h-4 mr-1" />Rejected</span>;
    }
    return <span className="flex items-center text-blue-600"><Clock className="w-4 h-4 mr-1" />Pending</span>;
  };

  const getStatusCounts = () => {
    const pending = companies.filter(c => c.profileCompleted && !c.isVerified && !c.rejectionReason).length;
    const approved = companies.filter(c => c.isVerified).length;
    const rejected = companies.filter(c => c.rejectionReason).length;
    return { pending, approved, rejected, total: companies.length };
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Company Management</h2>
        <button
          onClick={fetchAllCompanies}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md"
        >
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search companies by name, email, contact person, or industry..."
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

        {/* Filter Tabs */}
        <div className="mt-4 border-t border-gray-700 pt-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Companies', count: companies.length },
              { key: 'pending', label: 'Pending', count: companies.filter(c => c.profileCompleted && !c.isVerified && !c.rejectionReason).length },
              { key: 'approved', label: 'Approved', count: companies.filter(c => c.isVerified).length },
              { key: 'rejected', label: 'Rejected', count: companies.filter(c => c.rejectionReason).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as CompanyStatus)}
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


      {filteredCompanies.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg shadow-xl">
          <CheckCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchTerm ? 'No companies found matching your search.' : 
              statusFilter === 'pending' ? 'No Pending Applications!' :
                statusFilter === 'approved' ? 'No Approved Companies' :
                  statusFilter === 'rejected' ? 'No Rejected Companies' :
                    'No Companies Found'}
          </h3>
          <p className="text-gray-300">
            {searchTerm ? 'Try adjusting your search terms.' :
              statusFilter === 'pending' ? 'All company applications have been processed.' :
                statusFilter === 'approved' ? 'No companies have been approved yet.' :
                  statusFilter === 'rejected' ? 'No companies have been rejected yet.' :
                    'No company registrations found in the system.'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredCompanies.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((company) => (
                  <tr key={company.id} className="hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{company.companyName}</div>
                        <div className="text-sm text-gray-400">{company.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{company.contactPersonName || 'N/A'}</div>
                      <div className="text-sm text-gray-400">{company.contactPersonEmail || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{company.industry || 'N/A'}</div>
                      <div className="text-sm text-gray-400">{company.size || 'N/A'} employees</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(company)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {company.profileCompleted && !company.isVerified && !company.rejectionReason && (
                        <>
                          <button
                            onClick={() => handleApprove(company.id)}
                            disabled={actionLoading === company.id}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 shadow-md"
                          >
                            {actionLoading === company.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                            ) : (
                              <Check className="w-4 h-4 mr-1" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(company)}
                            disabled={actionLoading === company.id}
                            className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 shadow-md"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewCompany(company)}
                        disabled={detailsLoading}
                        className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 shadow-md"
                      >
                        {detailsLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                        ) : (
                          <Eye className="w-4 h-4 mr-1" />
                        )}
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-gray-800 px-4 py-3 border-t border-gray-700 sm:px-6">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-300">
                Showing <span className="font-medium text-white">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium text-white">
                  {Math.min(currentPage * pageSize, totalCompanies)}
                </span>{' '}
                of <span className="font-medium text-white">{totalCompanies}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-600 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 ${
                      currentPage === page
                        ? 'z-10 bg-purple-600 border-purple-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-600 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {showDetailsModal && companyDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {companyDetails.companyName}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company Name</label>
                      <p className="text-gray-900">{companyDetails.companyName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{companyDetails.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Industry</label>
                      <p className="text-gray-900">{companyDetails.industry || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company Size</label>
                      <p className="text-gray-900">{companyDetails.size || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Founded Year</label>
                      <p className="text-gray-900">{companyDetails.foundedYear || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Contact Person</label>
                      <p className="text-gray-900">{companyDetails.contactPersonName || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Contact Email</label>
                      <p className="text-gray-900">{companyDetails.contactPersonEmail || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{companyDetails.phone || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Website</label>
                      <p className="text-gray-900">{companyDetails.website || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Location</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-900">{companyDetails.address || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">City</label>
                      <p className="text-gray-900">{companyDetails.city || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">State</label>
                      <p className="text-gray-900">{companyDetails.state || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Country</label>
                      <p className="text-gray-900">{companyDetails.country || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Status</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Verification Status</label>
                      <div className="mt-1">
                        {companyDetails.isVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-4 h-4 mr-1" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Profile Status</label>
                      <p className="text-gray-900">
                        {companyDetails.profileCompleted ? 'Complete' : 'Incomplete'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Account Status</label>
                      <p className="text-gray-900">
                        {companyDetails.isBlocked ? 'Blocked' : 'Active'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Registration Date</label>
                      <p className="text-gray-900">
                        {new Date(companyDetails.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {companyDetails.description && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Company Description</h4>
                  <p className="text-gray-700 leading-relaxed">{companyDetails.description}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {companyDetails.rejectionReason && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-red-800 border-b border-red-200 pb-2 mb-4">Rejection Reason</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-700">{companyDetails.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                {companyDetails.profileCompleted && !companyDetails.isVerified && !companyDetails.rejectionReason && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleApprove(companyDetails.id);
                      }}
                      disabled={actionLoading === companyDetails.id}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve Company
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openRejectModal(companyDetails);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Company
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reject {selectedCompany.companyName}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedCompany.id, rejectionReason)}
                  disabled={!rejectionReason.trim() || actionLoading === selectedCompany.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedCompany.id ? 'Rejecting...' : 'Reject Company'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyList;
