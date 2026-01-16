import { Search, MapPin, Building2, Briefcase, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostJobModal from './PostJobModal';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import LogoutRequiredModal from './LogoutRequiredModal';
import toast from 'react-hot-toast';

const Hero = () => {
  const [searchData, setSearchData] = useState({
    title: '',
    location: '',
  });
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showLogoutRequiredModal, setShowLogoutRequiredModal] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const handleSearch = () => {
    // Validate that at least one field is filled
    if (!searchData.title.trim() && !searchData.location.trim()) {
      toast.error('Please enter a job title or location to search');
      return;
    }
    
    const params = new URLSearchParams();
    if (searchData.title) params.set('title', searchData.title);
    if (searchData.location) params.set('location', searchData.location);
    
    navigate(`/jobs?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePostJobClick = () => {
    if (isAuthenticated) {
      if (role === 'company') {
        navigate(ROUTES.COMPANY_POST_JOB);
      } else {
        setShowLogoutRequiredModal(true);
      }
    } else {
      setShowPostJobModal(true);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Animated Gradient Blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-violet-300/40 to-purple-400/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-amber-200/50 to-orange-300/40 rounded-full blur-[80px] translate-x-1/3 animate-pulse-slow-delayed"></div>
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-blue-200/30 to-cyan-200/30 rounded-full blur-[120px] translate-y-1/2 animate-pulse-slow"></div>

      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 opacity-[0.4]" style={{
        backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }}></div>

      {/* Floating Decorative Icons */}
      <div className="absolute top-[12%] left-[6%] hidden lg:block animate-float">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/30 rotate-12">
          <Zap className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="absolute top-[20%] right-[8%] hidden lg:block animate-float-delayed">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-400/30 -rotate-12">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Left Floating Card - Are you hiring? (Extreme Left) */}
      <div className="absolute left-4 xl:left-8 top-1/2 -translate-y-1/2 hidden lg:block z-20 animate-float">
        <div 
          onClick={handlePostJobClick}
          className="group relative w-56 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-2xl p-5 transform hover:scale-[1.05] transition-all duration-300 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Are you hiring?</h3>
                <p className="text-orange-100 text-xs">Post jobs & find candidates</p>
              </div>
            </div>
            <div className="flex items-center text-white font-medium text-sm mt-3 group-hover:gap-3 gap-2 transition-all">
              <span>Get Started</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right Floating Card - Looking for work? (Extreme Right) */}
      <div className="absolute right-4 xl:right-8 top-1/2 -translate-y-1/2 hidden lg:block z-20 animate-float-delayed">
        <div 
          onClick={() => navigate('/register')}
          className="group relative w-56 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-5 transform hover:scale-[1.05] transition-all duration-300 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Looking for work?</h3>
                <p className="text-blue-100 text-xs">Find your dream opportunity</p>
              </div>
            </div>
            <div className="flex items-center text-white font-medium text-sm mt-3 group-hover:gap-3 gap-2 transition-all">
              <span>Find Jobs</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Spiral Dotted Arrow - Left Side */}
      <svg className="absolute left-[14%] top-1/2 -translate-y-1/2 w-[180px] h-[120px] hidden xl:block" viewBox="0 0 180 120" fill="none">
        <path 
          d="M0 60 C30 60, 40 20, 80 20 C120 20, 130 60, 160 60 C170 60, 175 55, 180 50" 
          stroke="#9CA3AF" 
          strokeWidth="2" 
          strokeDasharray="6 4" 
          strokeLinecap="round"
          fill="none"
        />
        <path d="M175 45 L180 50 L175 55" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {/* Spiral Dotted Arrow - Right Side */}
      <svg className="absolute right-[14%] top-1/2 -translate-y-1/2 w-[180px] h-[120px] hidden xl:block" viewBox="0 0 180 120" fill="none">
        <path 
          d="M180 60 C150 60, 140 100, 100 100 C60 100, 50 60, 20 60 C10 60, 5 55, 0 50" 
          stroke="#9CA3AF" 
          strokeWidth="2" 
          strokeDasharray="6 4" 
          strokeLinecap="round"
          fill="none"
        />
        <path d="M5 45 L0 50 L5 55" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 lg:pt-32 pb-12">
        {/* Hero Header - Centered */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in-up">
            <span className="text-gray-900">Find Your</span>
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Dream Job
              </span>
              <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none">
                <path d="M2 8C50 2 150 2 198 8" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#f59e0b"/>
                    <stop offset="0.5" stopColor="#f97316"/>
                    <stop offset="1" stopColor="#eab308"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="inline-block ml-2 animate-bounce text-3xl">✨</span>
          </h1>

          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-10 animate-fade-in-up animation-delay-100">
            Connect with top employers and discover opportunities that match your skills, passions, and career aspirations
          </p>

          {/* Center Search Box */}
          <div className="max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            <div className="bg-white rounded-2xl p-3 shadow-xl shadow-gray-200/60 border border-gray-100">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors h-5 w-5" />
                  <Input 
                    placeholder="Job title, keywords, or company"
                    className="pl-12 h-13 text-base bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-amber-500/30 text-gray-900 placeholder:text-gray-400 rounded-xl transition-all"
                    value={searchData.title}
                    onChange={(e) => setSearchData({ ...searchData, title: e.target.value })}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="flex-1 relative group">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors h-5 w-5" />
                  <Input 
                    placeholder="City or remote"
                    className="pl-12 h-13 text-base bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-amber-500/30 text-gray-900 placeholder:text-gray-400 rounded-xl transition-all"
                    value={searchData.location}
                    onChange={(e) => setSearchData({ ...searchData, location: e.target.value })}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  className="h-13 px-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 transition-all duration-300 rounded-xl text-white font-bold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02]"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Action Cards */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 lg:hidden max-w-xl mx-auto">
          <div 
            onClick={handlePostJobClick}
            className="group relative flex-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur-lg opacity-40"></div>
            <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/25 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Are you hiring?</h3>
                  <p className="text-orange-100 text-sm">Post jobs & find candidates</p>
                </div>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/register')}
            className="group relative flex-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl blur-lg opacity-40"></div>
            <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/25 rounded-xl flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Looking for work?</h3>
                  <p className="text-blue-100 text-sm">Find your dream opportunity</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 lg:mt-32">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
            <div className="relative bg-gradient-to-r from-rose-600 via-red-500 to-pink-600 rounded-3xl p-8 md:p-10 overflow-hidden shadow-xl">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
              
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="text-center group cursor-default">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">50K+</div>
                  <div className="text-red-100 font-medium">Active Jobs</div>
                </div>
                <div className="text-center relative group cursor-default">
                  <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-white/25"></div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">10K+</div>
                  <div className="text-red-100 font-medium">Companies</div>
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-white/25"></div>
                </div>
                <div className="text-center group cursor-default">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">100K+</div>
                  <div className="text-red-100 font-medium">Success Stories</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(-50%) translateX(0); }
          50% { transform: translateY(calc(-50% - 15px)) translateX(0); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(-50%) translateX(0); }
          50% { transform: translateY(calc(-50% - 12px)) translateX(0); }
        }

        @keyframes float-icon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        @keyframes pulse-slow-delayed {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }

        @keyframes dash-reverse {
          to { stroke-dashoffset: 20; }
        }
        
        .absolute.left-4.animate-float,
        .absolute.right-4.animate-float-delayed {
          animation-name: float;
        }

        .absolute.right-4.animate-float-delayed {
          animation-name: float-delayed;
          animation-delay: 0.5s;
        }

        .absolute.top-\\[12\\%\\].animate-float,
        .absolute.top-\\[20\\%\\].animate-float-delayed {
          animation: float-icon 4s ease-in-out infinite;
        }

        .absolute.top-\\[20\\%\\].animate-float-delayed {
          animation-delay: 1.5s;
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animate-pulse-slow-delayed {
          animation: pulse-slow-delayed 10s ease-in-out infinite;
          animation-delay: 3s;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-dash {
          animation: dash 1s linear infinite;
        }

        .animate-dash-reverse {
          animation: dash-reverse 1s linear infinite;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .h-13 {
          height: 3.25rem;
        }
      `}</style>
      
      {/* Modals */}
      <PostJobModal
        isOpen={showPostJobModal}
        onClose={() => setShowPostJobModal(false)}
      />
      
      <LogoutRequiredModal
        isOpen={showLogoutRequiredModal}
        onClose={() => setShowLogoutRequiredModal(false)}
      />
    </section>
  );
};

export default Hero;
