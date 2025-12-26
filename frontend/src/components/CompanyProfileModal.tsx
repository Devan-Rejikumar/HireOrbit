import React, { useState, useEffect } from 'react';
import { X, Building2, Globe, Mail, Phone, MapPin, Calendar, Users, ExternalLink } from 'lucide-react';
import { companyService, CompanyProfile } from '../api/companyService';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  companyName,
}) => {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && companyName) {
      fetchCompanyProfile();
    } else {
      // Reset state when modal closes
      setCompany(null);
      setLoading(false);
      setError(null);
    }
  }, [isOpen, companyName]);

  const fetchCompanyProfile = async () => {
    if (!companyName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await companyService.searchCompanyByName(companyName);
      
      if (response.success && response.data && response.data.company) {
        setCompany(response.data.company);
      } else {
        setError('Company not found');
      }
    } catch (err: unknown) {
      console.error('Error fetching company profile:', err);
      setError('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Company Profile</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={fetchCompanyProfile}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {company && (
              <div className="space-y-6">
                {/* Company Header */}
                <div className="text-center">
                  {company.logo && (
                    <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="w-20 h-20 mx-auto mb-4 rounded-lg object-cover"
                    />
                  )}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{company.name}</h3>
                  <p className="text-gray-600">{company.industry}</p>
                </div>

                {/* Company Details */}
                <div className="space-y-4">
                  {company.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{company.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {company.companySize && (
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Company Size</p>
                          <p className="text-sm text-gray-600">{company.companySize}</p>
                        </div>
                      </div>
                    )}

                    {company.foundedYear && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Founded</p>
                          <p className="text-sm text-gray-600">{company.foundedYear}</p>
                        </div>
                      </div>
                    )}

                    {company.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Location</p>
                          <p className="text-sm text-gray-600">{company.location}</p>
                        </div>
                      </div>
                    )}

                    {company.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Website</p>
                          <a
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            {company.website}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    )}

                    {company.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <a
                            href={`mailto:${company.email}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {company.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {company.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Phone</p>
                          <a
                            href={`tel:${company.phone}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {company.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {company.socialMedia?.linkedin && (
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">LinkedIn</p>
                          <a
                            href={company.socialMedia.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            View Profile
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileModal;