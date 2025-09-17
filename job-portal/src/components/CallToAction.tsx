
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Briefcase } from 'lucide-react';

const CallToAction = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Find Your Next Opportunity?
          </h2>
          <p className="text-xl mb-12 text-blue-100">
            Join thousands of professionals who have already found their dream jobs through our platform
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 group">
              <Users className="h-16 w-16 mx-auto mb-6 text-blue-200 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-2xl font-bold mb-4">For Job Seekers</h3>
              <p className="text-blue-100 mb-6">Create your profile and get discovered by top employers</p>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 w-full">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 group">
              <Briefcase className="h-16 w-16 mx-auto mb-6 text-purple-200 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-2xl font-bold mb-4">For Employers</h3>
              <p className="text-blue-100 mb-6">Post jobs and find the perfect candidates for your team</p>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 w-full">
                Post a Job
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
