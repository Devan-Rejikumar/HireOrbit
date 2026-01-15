import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Briefcase, Sparkles, Rocket } from 'lucide-react';

const CallToAction = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Spiral Dotted Arrow - Left */}
      <svg className="absolute top-8 left-[5%] w-[200px] h-[300px] hidden lg:block opacity-50" viewBox="0 0 200 300" fill="none">
        <path 
          d="M10 20 C40 40, 70 30, 100 60 C130 90, 110 140, 80 170 C50 200, 70 250, 130 270" 
          stroke="#3B82F6" 
          strokeWidth="2" 
          strokeDasharray="6 5" 
          strokeLinecap="round"
          fill="none"
        />
        <path d="M125 275 L130 270 L135 275" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {/* Spiral Dotted Arrow - Right */}
      <svg className="absolute top-8 right-[5%] w-[200px] h-[300px] hidden lg:block opacity-50" viewBox="0 0 200 300" fill="none">
        <path 
          d="M190 20 C160 40, 130 30, 100 60 C70 90, 90 140, 120 170 C150 200, 130 250, 70 270" 
          stroke="#3B82F6" 
          strokeWidth="2" 
          strokeDasharray="6 5" 
          strokeLinecap="round"
          fill="none"
        />
        <path d="M75 275 L70 270 L65 275" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-200/25 to-indigo-200/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-indigo-200/25 to-blue-200/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/20 to-indigo-100/15 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
        backgroundSize: '32px 32px'
      }}></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main CTA Card */}
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white border border-blue-200 px-5 py-2.5 rounded-full mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-700">Start Your Journey Today</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-5">
              Ready to Find Your{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
                Next Opportunity?
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of professionals who have already found their dream jobs through our platform
            </p>
          </div>
          
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Job Seekers Card */}
            <div className="group relative">
              {/* Hover Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-300/40 to-indigo-300/40 rounded-3xl blur-lg opacity-0 group-hover:opacity-50 transition-all duration-300"></div>
              
              <div className="relative bg-white rounded-3xl p-8 lg:p-10 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                {/* Decorative corner gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/60 to-transparent rounded-bl-full"></div>
                
                {/* Icon */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-400/30 group-hover:scale-105 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">For Job Seekers</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Create your profile and get discovered by top employers looking for talent like you
                </p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">Free Profile</span>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">AI Matching</span>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">Easy Apply</span>
                </div>
                
                {/* CTA Button */}
                <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-400/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 group/btn">
                  <span>Get Started Free</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
            
            {/* Employers Card */}
            <div className="group relative">
              {/* Hover Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-300/40 to-blue-300/40 rounded-3xl blur-lg opacity-0 group-hover:opacity-50 transition-all duration-300"></div>
              
              <div className="relative bg-white rounded-3xl p-8 lg:p-10 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                {/* Decorative corner gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/60 to-transparent rounded-bl-full"></div>
                
                {/* Icon */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-400/30 group-hover:scale-105 transition-transform duration-300">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">For Employers</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Post jobs and find the perfect candidates for your team with our smart matching
                </p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full">Quick Posting</span>
                  <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full">Top Talent</span>
                  <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full">ATS Tools</span>
                </div>
                
                {/* CTA Button */}
                <Button size="lg" variant="outline" className="w-full border-2 border-blue-400 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white hover:border-transparent font-semibold py-6 rounded-xl transition-all duration-300 group/btn">
                  <span>Post a Job</span>
                  <Rocket className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="text-center p-4">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mb-1">10K+</div>
              <div className="text-sm text-gray-500 font-medium">Active Jobs</div>
            </div>
            <div className="text-center p-4 border-x border-gray-200">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mb-1">5K+</div>
              <div className="text-sm text-gray-500 font-medium">Companies</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mb-1">50K+</div>
              <div className="text-sm text-gray-500 font-medium">Job Seekers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
