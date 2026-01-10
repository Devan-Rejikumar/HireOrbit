import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { FileText, Search, CheckCircle, XCircle, Clock, Calendar, IndianRupee, Eye, User, Loader2, Filter } from 'lucide-react';
import { CompanyLayout } from '@/components/CompanyLayout';
import { offerService, Offer, OfferStatus } from '@/api/offerService';
import OfferDetailsModal from '@/components/OfferDetailsModal';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/Pagination';

const CompanyOffersPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OfferStatus | 'ALL'>('ALL');
  const [noticePeriodFilter, setNoticePeriodFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOffers, setTotalOffers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchOffers();
    }
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1); // Reset to page 1 when filters change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, noticePeriodFilter, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOffers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, searchQuery]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await offerService.getCompanyOffers(
        currentPage,
        10,
        statusFilter !== 'ALL' ? statusFilter : undefined,
        searchQuery || undefined,
      );
      setOffers(response.data.offers);
      setTotalPages(response.data.pagination.totalPages);
      setTotalOffers(response.data.pagination.total || 0);
    } catch (_error) {
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
    fetchOffers();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Calculate notice period based on joining date
  // Maps to the same values used in job application: immediate, 2-weeks, 1-month, 2-months, 3-months
  const getNoticePeriod = (joiningDate: string): string => {
    const today = new Date();
    const joining = new Date(joiningDate);
    const diffTime = joining.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Map days to notice period categories matching application form values
    if (diffDays <= 0) return 'immediate';
    if (diffDays <= 7) return 'immediate';
    if (diffDays <= 21) return '2-weeks'; // ~2 weeks (14 days) with some buffer
    if (diffDays <= 45) return '1-month'; // ~1 month (30 days) with some buffer
    if (diffDays <= 75) return '2-months'; // ~2 months (60 days) with some buffer
    return '3-months'; // 3+ months
  };

  // Filter offers for display (client-side filtering for notice period)
  const filteredOffersForDisplay = offers.filter(offer => {
    // Notice period filter
    if (noticePeriodFilter !== 'ALL') {
      const noticePeriod = getNoticePeriod(offer.joiningDate);
      if (noticePeriodFilter !== noticePeriod) return false;
    }
    return true;
  });

  return (
    <>
    <CompanyLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Offers</h1>
            <p className="text-gray-600">Manage and track all job offers sent to candidates</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by candidate name or job title..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Dropdowns - Top Right */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as OfferStatus | 'ALL');
                    setCurrentPage(1);
                  }}
                  className="flex h-10 items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EXPIRED">Expired</option>
                </select>
                <select
                  value={noticePeriodFilter}
                  onChange={(e) => {
                    setNoticePeriodFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-10 items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="ALL">All Notice Periods</option>
                  <option value="immediate">Immediate</option>
                  <option value="2-weeks">2 weeks notice</option>
                  <option value="1-month">1 month notice</option>
                  <option value="2-months">2 months notice</option>
                  <option value="3-months">3 months notice</option>
                </select>
              </div>
        </div>
      </div>

      {/* Offers List */}
      {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading offers...</p>
              </div>
            </div>
          ) : filteredOffersForDisplay.length === 0 ? (
            <Card className="p-12 text-center">
              <CardContent>
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No offers found</h3>
                <p className="text-gray-500 mb-4">
                  {statusFilter !== 'ALL'
                    ? `You don't have any ${statusFilter.toLowerCase()} offers`
                    : 'You haven\'t sent any offers yet'}
                </p>
                <Button
                  onClick={() => navigate(ROUTES.COMPANY_APPLICATIONS)}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Go to Applications
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOffersForDisplay.map((offer) => (
                <Card key={offer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-semibold text-gray-900">{offer.jobTitle}</h3>
                          {getStatusBadge(offer.status)}
                        </div>

                        {offer.candidateName && (
                          <div className="flex items-center gap-2 text-gray-600 mb-3">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{offer.candidateName}</span>
                            {offer.candidateEmail && (
                              <span className="text-sm text-gray-500">({offer.candidateEmail})</span>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <IndianRupee className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{formatCurrency(offer.ctc)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>Joining: {formatDate(offer.joiningDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>Expires: {formatDate(offer.offerExpiryDate)}</span>
                          </div>
                        </div>

                        {offer.location && (
                          <p className="text-sm text-gray-500 mt-2">Location: {offer.location}</p>
                        )}
                      </div>

                      <Button
                        onClick={() => handleViewOffer(offer)}
                        className="ml-4 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 flex-shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalOffers}
                pageSize={10}
                onPageChange={setCurrentPage}
                itemName="offers"
                className="mt-6"
              />
            </div>
          )}
    </CompanyLayout>

    {/* Offer Details Modal */}
      {selectedOffer && (
        <OfferDetailsModal
          isOpen={showDetailsModal}
          onClose={handleModalClose}
          offer={selectedOffer}
          onUpdate={fetchOffers}
          isUser={false}
        />
      )}
    </>
  );
};

export default CompanyOffersPage;
