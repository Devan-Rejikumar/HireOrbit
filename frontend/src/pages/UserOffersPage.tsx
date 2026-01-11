import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, Search, CheckCircle, XCircle, Clock, Calendar, IndianRupee, Eye, User, MessageSquare, Lock, Home, Briefcase, Settings, Filter, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { offerService, Offer, OfferStatus } from '@/api/offerService';
import OfferDetailsModal from '@/components/OfferDetailsModal';
import { NotificationBell } from '@/components/NotificationBell';
import { MessagesDropdown } from '@/components/MessagesDropdown';
import { useTotalUnreadCount } from '@/hooks/useChat';
import toast from 'react-hot-toast';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import Header from '@/components/Header';

const UserOffersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OfferStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(user?.id || null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchOffers();
    }
  }, [user?.id, currentPage, statusFilter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await offerService.getUserOffers(
        currentPage,
        10,
        statusFilter !== 'ALL' ? statusFilter : undefined,
      );
      setOffers(response.data.offers);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: OfferStatus) => {
    const config = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
      ACCEPTED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Accepted' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejected' },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: 'Expired' },
    };

    const { bg, text, icon: Icon, label } = config[status];
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </span>
    );
  };

  const handleViewOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowDetailsModal(true);
  };

  const handleModalClose = () => {
    setShowDetailsModal(false);
    setSelectedOffer(null);
    fetchOffers(); // Refresh offers after action
  };

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

  const filteredOffers = searchQuery
    ? offers.filter(offer =>
      offer.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.location.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : offers;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Mobile Menu Button */}
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
        {/* Sidebar */}
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left relative transition-all duration-200 group ${
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pl-10 lg:pl-0">
          {/* Search & Filter Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <input
                    type="text"
                    placeholder="Search by job title or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as OfferStatus | 'ALL');
                    setCurrentPage(1);
                  }}
                  className="flex h-10 items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Offers List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading offers...</p>
              </div>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No offers found</h3>
              <p className="text-gray-500">
                {statusFilter !== 'ALL'
                  ? `You don't have any ${statusFilter.toLowerCase()} offers`
                  : 'You haven\'t received any offers yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:gap-4 mb-4 sm:mb-6">
                {filteredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{offer.jobTitle}</h3>
                          {getStatusBadge(offer.status)}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mt-3 sm:mt-4">
                          <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                            <IndianRupee className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{formatCurrency(offer.ctc)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">Joining: {formatDate(offer.joiningDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                            <span className="truncate">Expires: {formatDate(offer.offerExpiryDate)}</span>
                          </div>
                        </div>

                        {offer.location && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-2">Location: {offer.location}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleViewOffer(offer)}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm sm:text-base">View Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 bg-white rounded-xl shadow-sm border border-gray-100 px-4 sm:px-6 py-4">
                  <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, filteredOffers.length)}</span> of{' '}
                    <span className="font-medium">{filteredOffers.length}</span> results
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    <span className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
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
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 transition-colors min-w-[60px]"
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
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-colors min-w-[60px] text-blue-600"
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Offers</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="lg:hidden h-16" />

      {/* Offer Details Modal */}
      {selectedOffer && (
        <OfferDetailsModal
          isOpen={showDetailsModal}
          onClose={handleModalClose}
          offer={selectedOffer}
          onUpdate={fetchOffers}
          isUser={true}
        />
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default UserOffersPage;

