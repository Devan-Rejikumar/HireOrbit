import React from 'react';
import { FiX } from 'react-icons/fi';

export interface JobReport {
  id: string;
  jobId: string;
  userId: string;
  reason: string;
  createdAt: string;
}

export interface ReportedJobData {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
  };
  reports: JobReport[];
  reportCount: number;
}

interface JobReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedJob: ReportedJobData | null;
}

const JobReportsModal: React.FC<JobReportsModalProps> = ({
  isOpen,
  onClose,
  reportedJob,
}) => {
  if (!isOpen || !reportedJob) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">All Reports for Job</h3>
              <p className="text-sm text-gray-400 mt-1">{reportedJob.job.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {reportedJob.job.company} • {reportedJob.job.location}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-sm font-medium bg-red-900 text-red-200 rounded">
                {reportedJob.reportCount} {reportedJob.reportCount === 1 ? 'Report' : 'Reports'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {reportedJob.reports.map((report, index) => (
              <div
                key={report.id}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-red-200">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-white">
                        Report #{index + 1}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(report.createdAt)}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 mb-1">Reason:</div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {report.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobReportsModal;

