import { useState, useMemo, useEffect } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CompanyDetailsModal from '@/components/CompanyDetailsModal';
import { companyService } from '@/api/companyService';
import { useJobs, type Job } from '@/hooks/useJobs';

interface Company {
  name: string;
  companyId?: string;
  location?: string;
  industry?: string;
  description?: string;
  jobCount: number;
  logo?: string;
  email?: string;
  size?: string;
  website?: string;
  foundedYear?: string | number;
  headquarters?: string;
  phone?: string;
  linkedinUrl?: string;
}

const CompanyShowcase = () => {
  const { data: jobsData, isLoading: jobsLoading } = useJobs();
  const jobs: Job[] = Array.isArray(jobsData) ? jobsData : [];
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Memoize top companies calculation from jobs
  const topCompanies = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    
    // Group jobs by company and count
    const companyMap = new Map<string, Company>();
    
    jobs.forEach((job) => {
      const companyName = job.company;
      if (!companyName) return;
      
      if (companyMap.has(companyName)) {
        const existing = companyMap.get(companyName)!;
        existing.jobCount += 1;
        if (!existing.location && job.location) {
          existing.location = job.location;
        }
      } else {
        companyMap.set(companyName, {
          name: companyName,
          companyId: job.companyId,
          location: job.location,
          jobCount: 1,
        });
      }
    });
    
    // Sort by job count and take top 6 companies
    return Array.from(companyMap.values())
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 6);
  }, [jobs]);

  // Create a stable string representation of topCompanies for comparison
  const topCompaniesKey = useMemo(() => {
    return topCompanies.map(c => `${c.name}-${c.companyId || ''}-${c.jobCount}`).join('|');
  }, [topCompanies]);

  // Fetch company profiles when topCompanies changes
  useEffect(() => {
    let isMounted = true;

    const fetchProfiles = async () => {
      if (topCompanies.length === 0) {
        if (isMounted) {
          setCompanies([]);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
      }
      
      const companiesWithProfiles: Company[] = [];
      
      // Fetch company profiles only for registered companies (those with companyId)
      // Add delays between requests to avoid rate limiting
      for (let i = 0; i < topCompanies.length; i++) {
        if (!isMounted) break; // Stop if component unmounted
        
        const company = { ...topCompanies[i] };
        if (!company.companyId) {
          companiesWithProfiles.push(company);
          continue; // Skip companies without IDs
        }
        
        // Add delay between requests (except first one) to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
        }
        
        try {
          const profileResponse = await companyService.searchCompanyByName(company.name);
          if (profileResponse.success && profileResponse.data?.company) {
            const profile = profileResponse.data.company;
            company.industry = profile.industry;
            company.description = profile.description;
            company.email = profile.email;
            company.size = profile.companySize;
            company.website = profile.website;
            company.foundedYear = profile.foundedYear;
            company.headquarters = profile.location;
            company.phone = profile.phone;
            company.linkedinUrl = profile.socialMedia?.linkedin;
            company.logo = profile.logo;
          }
        } catch (error: unknown) {
          // Silently skip - company profile doesn't exist or rate limited
          const isAxiosError = error && typeof error === 'object' && 'response' in error;
          const axiosError = isAxiosError ? (error as { response?: { status?: number } }) : null;
          if (axiosError?.response?.status !== 429) {
            // Silent skip for expected 404s
          }
        }
        
        companiesWithProfiles.push(company);
      }
      
      if (isMounted) {
        setCompanies(companiesWithProfiles);
        setLoading(false);
      }
    };

    fetchProfiles();

    return () => {
      isMounted = false;
    };
  }, [topCompaniesKey]);

  const handleCompanyClick = async (company: Company) => {
    setSelectedCompany(company);
    
    // Fetch full details if not already loaded and company is registered
    if (!company.email && company.companyId) {
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
      } catch (error: unknown) {
        // Silently skip - profile doesn't exist
      } finally {
        setLoadingDetails(false);
      }
    }
    
    setIsDetailsModalOpen(true);
  };

  return (
    <>
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Top Companies Hiring</h2>
            <p className="text-xl text-gray-300">Join industry leaders and innovative startups</p>
          </div>
          
          {(jobsLoading || loading) ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <span className="ml-3 text-gray-300">Loading companies...</span>
            </div>
          ) : companies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {companies.map((company, index) => (
                <Card 
                  key={`${company.name}-${company.companyId || index}`}
                  onClick={() => handleCompanyClick(company)}
                  className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <Building2 className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <h3 className="font-bold text-white mb-2 line-clamp-2">{company.name}</h3>
                    <p className="text-gray-300 text-sm">{company.jobCount} {company.jobCount === 1 ? 'position' : 'positions'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">No companies available at the moment</p>
            </div>
          )}
        </div>
      </section>

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
    </>
  );
};

export default CompanyShowcase;
