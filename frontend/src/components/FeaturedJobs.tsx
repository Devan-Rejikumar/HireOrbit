import { MapPin, Clock, Building, IndianRupee, ArrowRight, Briefcase, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Link } from 'react-router-dom';
import { useFeaturedJobs, type Job } from '@/hooks/useJobs';
import { ROUTES } from '@/constants/routes';

const FeaturedJobs = () => {
  const { data: jobsData, isLoading: loading } = useFeaturedJobs();
  const jobs: Job[] = Array.isArray(jobsData) ? jobsData : [];
  const navigate = useNavigate();

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-violet-200/20 to-purple-200/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-200/20 to-orange-200/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full mb-4" style={{ animation: 'spin 1s linear infinite' }}></div>
            <span className="text-gray-500 font-medium">Loading featured jobs...</span>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </section>
    );
  }

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-violet-200/25 to-purple-200/15 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-200/25 to-orange-200/15 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3"></div>
      

      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
        backgroundSize: '32px 32px'
      }}></div>

      {/* Spiral Dotted Arrow - Left Side (pointing to "F" in Featured) */}
      <svg className="absolute left-[8%] top-[140px] w-[180px] h-[100px] hidden xl:block" viewBox="0 0 180 100" fill="none">
        <path 
          d="M0 50 C40 50, 50 20, 90 20 C130 20, 140 50, 180 50" 
          stroke="#9CA3AF" 
          strokeWidth="2" 
          strokeDasharray="6 4" 
          strokeLinecap="round"
          fill="none"
        />
        <path d="M175 45 L180 50 L175 55" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {/* Spiral Dotted Arrow - Right Side (pointing to "s" in Jobs) */}
      <svg className="absolute right-[8%] top-[140px] w-[180px] h-[100px] hidden xl:block" viewBox="0 0 180 100" fill="none">
        <path 
          d="M180 50 C140 50, 130 80, 90 80 C50 80, 40 50, 0 50" 
          stroke="#9CA3AF" 
          strokeWidth="2" 
          strokeDasharray="6 4" 
          strokeLinecap="round"
          fill="none"
        />
        <path d="M5 45 L0 50 L5 55" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full mb-5 shadow-sm">
            <Briefcase className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-medium text-gray-600">Career Opportunities</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Featured <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Jobs</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Explore the latest opportunities from leading companies
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div 
              key={job.id} 
              className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-violet-200 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <Link 
                      to={ROUTES.JOB_DETAILS(job.id)}
                      className="text-xl font-bold text-gray-900 hover:text-violet-600 transition-colors"
                    >
                      {job.title}
                    </Link>
                    <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 font-semibold text-xs px-3 py-1">
                      {job.jobType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Building className="h-4 w-4 text-violet-600" />
                    </div>
                    <span className="font-bold text-gray-800">{job.company}</span>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-600 mb-5 line-clamp-2 leading-relaxed">{job.description}</p>
              
              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 mb-5 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-800">{job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="font-semibold text-gray-800">{job.jobType}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <IndianRupee className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="font-bold text-gray-900">{job.salary}</span>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Posted {getTimeAgo(job.createdAt)}</span>
                </div>
                <div className="flex gap-3">
                  <Link to={ROUTES.JOB_DETAILS(job.id)}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="font-semibold text-gray-700 border-gray-300 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700"
                    >
                      View Details
                    </Button>
                  </Link>
                  <Link to={ROUTES.JOB_DETAILS(job.id)}>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-md shadow-violet-500/25"
                    >
                      Apply Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* View All Button */}
        <div className="text-center mt-14">
          <Button 
            size="lg" 
            variant="outline"
            className="px-10 py-6 text-base font-bold border-2 border-gray-300 text-gray-800 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-700 group"
            onClick={() => navigate(ROUTES.JOBS)}
          >
            View All Jobs
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobs;

