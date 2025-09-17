import { MapPin, Clock, Building, DollarSign, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: string;
  jobType: string;
  requirements: string[];
  benefits: string[];
  createdAt: string;
}

const FeaturedJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        const response = await api.get<{success: boolean, data: {jobs: Job[]}, message: string}>('/jobs');
        console.log('FeaturedJobs API Response:', response.data);
        
        // Check if response has the expected structure
        if (response.data.success && response.data.data && response.data.data.jobs) {
          // Show only first 4 jobs as featured
          setJobs(response.data.data.jobs.slice(0, 4));
        } else {
          console.error('Unexpected API response structure:', response.data);
          setJobs([]);
        }
      } catch (error) {
        console.error('Error fetching featured jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedJobs();
  }, []);

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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-xl">Loading featured jobs...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Jobs</h2>
          <p className="text-xl text-gray-600">Latest opportunities from top companies</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {jobs.map((job) => (
            <Card key={job.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link 
                        to={`/jobs/${job.id}`}
                        className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors hover:underline"
                      >
                        {job.title}
                      </Link>
                      <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">
                        {job.jobType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 mb-2">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">{job.company}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                
                <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {job.jobType}
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Posted {getTimeAgo(job.createdAt)}</span>
                  <div className="flex gap-2">
                    <Link to={`/jobs/${job.id}`}>
                      <Button variant="outline" size="sm" className="hover:bg-gray-50">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link to={`/jobs/${job.id}`}>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button 
            size="lg" 
            variant="outline" 
            className="px-8"
            onClick={() => navigate('/jobs')}
          >
            View All Jobs
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobs;