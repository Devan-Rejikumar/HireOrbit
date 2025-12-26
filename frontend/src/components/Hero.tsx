import { Search, MapPin, Briefcase, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostJobModal from './PostJobModal';

const Hero = () => {
  const [searchData, setSearchData] = useState({
    title: '',
    location: '',
  });
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
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

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-12">
        <div className="max-w-4xl mx-auto text-center text-white">
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            Find Your
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> Dream Job</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-200 animate-fade-in">
            Connect with top employers and discover opportunities that match your skills and aspirations
          </p>
          
         
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-12 animate-scale-in">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input 
                  placeholder="Job title, keywords, or company"
                  className="pl-12 h-14 text-lg border-0 focus:ring-2 focus:ring-blue-500"
                  value={searchData.title}
                  onChange={(e) => setSearchData({ ...searchData, title: e.target.value })}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input 
                  placeholder="City or remote"
                  className="pl-12 h-14 text-lg border-0 focus:ring-2 focus:ring-blue-500"
                  value={searchData.location}
                  onChange={(e) => setSearchData({ ...searchData, location: e.target.value })}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                <Search className="mr-2 h-5 w-5" />
                Search Jobs
              </Button>
            </div>
          </div>
          
       
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 animate-scale-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Are you hiring?
                </h3>
                <p className="text-gray-200 text-lg mb-6">
                  Post your job openings and find the perfect candidates
                </p>
                <Button 
                  onClick={() => setShowPostJobModal(true)}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto"
                >
                  <Building2 className="h-6 w-6" />
                  <span>Post a Job</span>
                </Button>
              </div>
            </div>

           
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 animate-scale-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Looking for work?
                </h3>
                <p className="text-gray-200 text-lg mb-6">
                  Create your profile and discover amazing job opportunities
                </p>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white font-bold py-4 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto"
                >
                  <Briefcase className="h-6 w-6" />
                  <span>Find Jobs</span>
                </Button>
              </div>
            </div>
          </div>

      
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center animate-fade-in">
              <div className="text-4xl font-bold text-yellow-400 mb-2">50K+</div>
              <div className="text-gray-300">Active Jobs</div>
            </div>
            <div className="text-center animate-fade-in">
              <div className="text-4xl font-bold text-green-400 mb-2">10K+</div>
              <div className="text-gray-300">Companies</div>
            </div>
            <div className="text-center animate-fade-in">
              <div className="text-4xl font-bold text-purple-400 mb-2">100K+</div>
              <div className="text-gray-300">Success Stories</div>
            </div>
          </div>
        </div>
      </div>
      
      
      <PostJobModal
        isOpen={showPostJobModal}
        onClose={() => setShowPostJobModal(false)}
      />
    </section>
  );
};

export default Hero;
