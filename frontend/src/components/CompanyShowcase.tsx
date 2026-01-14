import { useState, useMemo, useEffect, useRef } from 'react';
import { Building2, Loader2, Briefcase, MapPin, ArrowRight, Sparkles } from 'lucide-react';
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
  
  // Memoize jobs array to ensure stable reference
  const jobs: Job[] = useMemo(() => {
    return Array.isArray(jobsData) ? jobsData : [];
  }, [jobsData]);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [, setLoadingDetails] = useState(false);
  const prevCompaniesKeyRef = useRef<string>('');
  const isFetchingRef = useRef<boolean>(false);

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

  // Fetch company profiles when topCompanies changes
  useEffect(() => {
    const fetchProfiles = async () => {
      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        return;
      }

      if (topCompanies.length === 0) {
        // Only update state if it's different from current state to prevent infinite loops
        const emptyKey = '';
        if (prevCompaniesKeyRef.current !== emptyKey) {
          setCompanies([]);
          setLoading(false);
          prevCompaniesKeyRef.current = emptyKey;
        }
        return;
      }

      // Create a stable reference key from topCompanies to prevent unnecessary re-fetches
      const companiesKey = topCompanies.map(c => `${c.name}-${c.companyId || ''}`).join(',');
      
      // Skip if companies haven't actually changed
      if (prevCompaniesKeyRef.current === companiesKey) {
        return;
      }
      
      prevCompaniesKeyRef.current = companiesKey;
      isFetchingRef.current = true;

      setLoading(true);
      const companiesWithProfiles: Company[] = [];
      
      // Fetch company profiles only for registered companies (those with companyId)
      // Add delays between requests to avoid rate limiting
      for (let i = 0; i < topCompanies.length; i++) {
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
      
      setCompanies(companiesWithProfiles);
      setLoading(false);
      isFetchingRef.current = false;
    };

    fetchProfiles();
  }, [topCompanies]);

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
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
        {/* Spiral Dotted Arrow - Top Left (pointing up toward Featured Jobs) */}
        <svg className="absolute top-8 left-[8%] w-[180px] h-[100px] hidden xl:block" viewBox="0 0 180 100" fill="none">
          <path 
            d="M180 80 C140 80, 130 50, 90 50 C50 50, 40 20, 0 20" 
            stroke="#10b981" 
            strokeWidth="2" 
            strokeDasharray="6 4" 
            strokeLinecap="round"
            fill="none"
          />
          <path d="M5 15 L0 20 L5 25" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* Spiral Dotted Arrow - Top Right (pointing up toward Featured Jobs) */}
        <svg className="absolute top-8 right-[8%] w-[180px] h-[100px] hidden xl:block" viewBox="0 0 180 100" fill="none">
          <path 
            d="M0 80 C40 80, 50 50, 90 50 C130 50, 140 20, 180 20" 
            stroke="#10b981" 
            strokeWidth="2" 
            strokeDasharray="6 4" 
            strokeLinecap="round"
            fill="none"
          />
          <path d="M175 15 L180 20 L175 25" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/30 to-teal-200/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-violet-200/25 to-purple-200/15 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-amber-200/20 to-orange-200/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Subtle Dot Pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}></div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white border border-emerald-200 px-5 py-2.5 rounded-full mb-6 shadow-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              <span className="text-sm font-medium text-emerald-700">Featured Employers</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-5">
              Top Companies{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">Hiring</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Join industry leaders and innovative startups looking for talent like you
            </p>
          </div>
          
          {(jobsLoading || loading) ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
              <span className="text-gray-500 font-medium">Loading top companies...</span>
            </div>
          ) : companies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company, index) => (
                <div 
                  key={`${company.name}-${company.companyId || index}`}
                  onClick={() => handleCompanyClick(company)}
                  className="group relative cursor-pointer"
                  style={{
                    animation: `float 4s ease-in-out infinite`,
                    animationDelay: `${index * 0.3}s`
                  }}
                >
                  {/* Lighter Hover Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300/20 via-teal-300/20 to-green-300/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  
                  {/* Card */}
                  <div className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden hover:-translate-y-1">
                    {/* Top Gradient Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Header Row */}
                      <div className="flex items-start gap-4 mb-5">
                        {/* Company Logo */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20 group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300">
                          {company.logo ? (
                            <img src={company.logo} alt={company.name} className="w-full h-full rounded-2xl object-cover" />
                          ) : (
                            <Building2 className="h-7 w-7 text-white" />
                          )}
                        </div>
                        
                        {/* Company Name & Industry */}
                        <div className="flex-1 min-w-0 pt-1">
                          <h3 className="font-bold text-gray-900 text-lg mb-1 truncate group-hover:text-emerald-600 transition-colors">{company.name}</h3>
                          {company.industry && (
                            <p className="text-sm text-gray-700 truncate">{company.industry}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Stats Row */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                          <Briefcase className="w-4 h-4 text-gray-900" />
                          <span className="text-gray-900 text-sm font-bold">{company.jobCount} {company.jobCount === 1 ? 'opening' : 'openings'}</span>
                        </div>
                        {company.location && (
                          <div className="flex items-center gap-1.5 text-gray-800">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm truncate max-w-[100px]">{company.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* CTA Row */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-600">Click to explore</span>
                        <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm group-hover:gap-3 transition-all">
                          <span>View Company</span>
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                            <ArrowRight className="w-3.5 h-3.5 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No companies available</h3>
              <p className="text-gray-500">Check back soon for new opportunities</p>
            </div>
          )}
        </div>

        {/* Floating Animation Keyframes */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
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
