import React, { useState } from 'react';
import { X, FileText, Calendar, MapPin, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Offer, offerService } from '@/api/offerService';
import toast from 'react-hot-toast';

interface OfferDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | null;
  onUpdate: () => void;
  isUser?: boolean; // If true, show accept/reject buttons
}

const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({
  isOpen,
  onClose,
  offer,
  onUpdate,
  isUser = false,
}) => {
  const [processing, setProcessing] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);

  if (!isOpen || !offer) return null;

  const getStatusBadge = (status: Offer['status']) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
      ACCEPTED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Accepted' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejected' },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: 'Expired' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const handleDownloadPdf = async () => {
    if (!offer.pdfUrl) {
      toast.error('PDF not available');
      return;
    }

    try {
      const blob = await offerService.downloadOfferPdf(offer.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `offer_${offer.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Offer letter downloaded');
    } catch (error) {
      toast.error('Failed to download offer letter');
    }
  };

  const handleAccept = async () => {
    if (!confirm('Are you sure you want to accept this offer?')) return;

    try {
      setProcessing(true);
      setActionType('accept');
      await offerService.acceptOffer(offer.id);
      toast.success('Offer accepted successfully!');
      onUpdate();
      onClose();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to accept offer';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this offer? This action cannot be undone.')) return;

    try {
      setProcessing(true);
      setActionType('reject');
      await offerService.rejectOffer(offer.id);
      toast.success('Offer rejected');
      onUpdate();
      onClose();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reject offer';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setActionType(null);
    }
  };

  const canAcceptOrReject = isUser && offer.status === 'PENDING' && new Date(offer.offerExpiryDate) > new Date();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Offer Letter Details</h2>
                <p className="text-sm text-gray-500">{offer.jobTitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(offer.status)}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={processing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Offer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CTC */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                  <span className="text-lg font-semibold">₹</span>
                  <span>CTC (Cost to Company)</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(offer.ctc)}</p>
              </div>

              {/* Location */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </div>
                <p className="text-xl font-semibold text-gray-900">{offer.location}</p>
              </div>

              {/* Joining Date */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joining Date</span>
                </div>
                <p className="text-xl font-semibold text-gray-900">{formatDate(offer.joiningDate)}</p>
              </div>

              {/* Expiry Date */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Offer Expires On</span>
                </div>
                <p className={`text-xl font-semibold ${new Date(offer.offerExpiryDate) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(offer.offerExpiryDate)}
                </p>
              </div>
            </div>

            {/* Offer Message */}
            {offer.offerMessage && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{offer.offerMessage}</p>
              </div>
            )}

            {/* Candidate/Company Info */}
            {offer.candidateName && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Candidate:</span> {offer.candidateName}
                  {offer.candidateEmail && ` (${offer.candidateEmail})`}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                {offer.pdfUrl && (
                  <button
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>

              {canAcceptOrReject && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="inline-flex items-center space-x-2 px-6 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{actionType === 'reject' && processing ? 'Rejecting...' : 'Reject Offer'}</span>
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={processing}
                    className="inline-flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{actionType === 'accept' && processing ? 'Accepting...' : 'Accept Offer'}</span>
                  </button>
                </div>
              )}

              {!canAcceptOrReject && isUser && (
                <div className="text-sm text-gray-500">
                  {offer.status !== 'PENDING' && 'This offer has already been processed'}
                  {offer.status === 'PENDING' && new Date(offer.offerExpiryDate) <= new Date() && 'This offer has expired'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDetailsModal;

