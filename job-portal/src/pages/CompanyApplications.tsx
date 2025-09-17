import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { applicationService } from '../api/applicationService';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { toast } from 'react-toastify';

interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: string;
  coverLetter: string;
  expectedSalary: string;
  availability: string;
  experience: string;
  resumeUrl?: string;
  appliedAt: string;
  jobTitle?: string;
  candidateName?: string;
}

const CompanyApplications: React.FC = () => {
  const { company } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    if (company?.id) {
      fetchApplications();
    }
  }, [company?.id]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getCompanyApplications(company!.id) as {
        data: { applications: Application[] }
      };
      setApplications(response.data.applications || []);
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      toast.success('Status updated successfully');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredApplications = selectedStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === selectedStatus);

  if (loading) return <div>Loading applications...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Applications</h1>
        <Select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-48"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredApplications.map((application) => (
          <Card key={application.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{application.jobTitle || 'Job Title'}</h3>
                <p className="text-gray-600">Applied: {new Date(application.appliedAt).toLocaleDateString()}</p>
                <p className="text-gray-600">Expected Salary: ₹{application.expectedSalary}</p>
                <p className="text-gray-600">Experience: {application.experience}</p>
                <p className="text-gray-600">Availability: {application.availability}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  application.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {application.status}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(application.id, 'shortlisted')}
                    disabled={application.status === 'shortlisted'}
                  >
                    Shortlist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(application.id, 'rejected')}
                    disabled={application.status === 'rejected'}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
            {application.resumeUrl && (
              <div className="mt-4">
                <a 
                  href={application.resumeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Resume
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No applications found</p>
        </div>
      )}
    </div>
  );
};

export default CompanyApplications;