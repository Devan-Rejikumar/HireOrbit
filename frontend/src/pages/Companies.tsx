import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Loader2, Building2 } from 'lucide-react';
import { CompanyCard } from '@/components/CompanyCard';
import CompanyDetailsModal from '@/components/CompanyDetailsModal';
import Header from '@/components/Header';
import api from '@/api/axios';
import { companyService } from '@/api/companyService';

interface Job {
  id: string;
  company: string;
  companyId?: string;
  location: string;
  description?: string;
}

interface Company {
  name: string;
  companyId?: string;
  location?: string;
  industry?: string;
  description?: string;
  jobCount: number;
  logo?: string;
  tags?: string[];
  // For details modal
  email?: string;
  size?: string;
  website?: string;
  foundedYear?: string | number;
  headquarters?: string;
  phone?: string;
  linkedinUrl?: string;
}

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      // Fetch all jobs to extract unique companies
      const response = await api.get<{
        success: boolean;
        data: { jobs: Job[] };
      }>('/jobs');
      
      const jobs = response.data?.data?.jobs || [];
      
      // Group jobs by company and count
      const companyMap = new Map<string, Company>();
      
      jobs.forEach((job) => {
        const companyName = job.company;
        if (!companyName) return;
        
        if (companyMap.has(companyName)) {
          const existing = companyMap.get(companyName)!;
          existing.jobCount += 1;
          // Update location if not set
          if (!existing.location && job.location) {
            existing.location = job.location;
          }
        } else {
          companyMap.set(companyName, {
            name: companyName,
            companyId: job.companyId,
            location: job.location,
            jobCount: 1,
            tags: ['Business'], // Default tag
          });
        }
      });
      
      // Fetch additional company details for companies with companyId
      const companiesWithIds = Array.from(companyMap.values()).filter(c => c.companyId);
      
      // Try to fetch company profiles for companies that have IDs
      for (const company of companiesWithIds.slice(0, 10)) { // Limit to first 10 to avoid too many requests
        try {
          const profileResponse = await companyService.searchCompanyByName(company.name);
          if (profileResponse.success && profileResponse.data?.company) {
            const profile = profileResponse.data.company;
            const existing = companyMap.get(company.name);
            if (existing) {
              existing.industry = profile.industry;
              existing.description = profile.description;
              existing.email = profile.email;
              existing.size = profile.companySize;
              existing.website = profile.website;
              existing.foundedYear = profile.foundedYear;
              existing.headquarters = profile.location;
              existing.phone = profile.phone;
              existing.linkedinUrl = profile.socialMedia?.linkedin;
              existing.logo = profile.logo;
              // Update tags based on industry - avoid duplicates
              if (profile.industry) {
                const industryLower = profile.industry.toLowerCase();
                const tagsSet = new Set([profile.industry]);
                
                // Add Technology tag only if industry doesn't already contain it
                if (!industryLower.includes('technology') && !industryLower.includes('tech')) {
                  if (industryLower.includes('software') || industryLower.includes('information') || industryLower.includes('computer')) {
                    tagsSet.add('Technology');
                  }
                }
                
                existing.tags = Array.from(tagsSet);
              }
            }
          }
        } catch (error) {
          // Silently fail - we'll use default values
          console.log(`Could not fetch details for ${company.name}`);
        }
      }
      
      // Convert map to array and sort by job count (descending)
      const companiesList = Array.from(companyMap.values())
        .sort((a, b) => b.jobCount - a.jobCount);
      
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter companies based on search query
  const filteredCompanies = useMemo(() => {
    let filtered = companies;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.industry?.toLowerCase().includes(query) ||
          company.description?.toLowerCase().includes(query),
      );
    }
    
    if (locationQuery.trim()) {
      const location = locationQuery.toLowerCase();
      filtered = filtered.filter(
        (company) => company.location?.toLowerCase().includes(location),
      );
    }
    
    return filtered;
  }, [companies, searchQuery, locationQuery]);

  const handleCompanyClick = async (company: Company) => {
    setSelectedCompany(company);
    
    // If we don't have full details, try to fetch them
    if (!company.email && company.name) {
      setLoadingDetails(true);
      try {
        const profileResponse = await companyService.searchCompanyByName(company.name);
        if (profileResponse.success && profileResponse.data?.company) {
          const profile = profileResponse.data.company;
          setSelectedCompany({
            ...company,
            industry: profile.industry,
            description: profile.description,
            email: profile.email,
            size: profile.companySize,
            website: profile.website,
            foundedYear: profile.foundedYear,
            headquarters: profile.location,
            phone: profile.phone,
            linkedinUrl: profile.socialMedia?.linkedin,
            logo: profile.logo,
          });
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setLoadingDetails(false);
      }
    }
    
    setIsDetailsModalOpen(true);
  };

  const handleSearch = () => {
    // Filter is already handled by useMemo, this can be used for additional logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <Header />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 lg:px-6">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Company Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Company title or keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Location Search */}
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="City, state or zip code"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading companies...</span>
            </div>
          )}

          {/* Companies Grid */}
          {!loading && (
            <>
              {filteredCompanies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCompanies.map((company, index) => (
                    <CompanyCard
                      key={`${company.name}-${company.companyId || index}`}
                      companyName={company.name}
                      companyId={company.companyId}
                      location={company.location}
                      industry={company.industry}
                      description={company.description}
                      jobCount={company.jobCount}
                      logo={company.logo}
                      tags={company.tags}
                      onClick={() => handleCompanyClick(company)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-lg">
                  <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchQuery || locationQuery ? 'No companies found' : 'No companies available'}
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery || locationQuery
                      ? 'Try adjusting your search terms'
                      : 'Check back later for new companies'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Company Details Modal */}
      {selectedCompany && (
        <CompanyDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedCompany(null);
          }}
          company={{
            id: selectedCompany.companyId || '',
            companyName: selectedCompany.name,
            email: selectedCompany.email || '',
            industry: selectedCompany.industry,
            size: selectedCompany.size,
            description: selectedCompany.description,
            website: selectedCompany.website,
            foundedYear: selectedCompany.foundedYear,
            headquarters: selectedCompany.headquarters || selectedCompany.location,
            phone: selectedCompany.phone,
            linkedinUrl: selectedCompany.linkedinUrl,
          }}
        />
      )}
    </div>
  );
};

export default Companies;

