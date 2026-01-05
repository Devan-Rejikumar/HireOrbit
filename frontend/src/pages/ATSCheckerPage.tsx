import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { subscriptionService, SubscriptionStatusResponse } from '@/api/subscriptionService';
import { atsService } from '@/api/atsService';
import { FileCheck, Upload, Sparkles, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ATSAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
  keywordMatch: number;
}

export const ATSCheckerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);

  useEffect(() => {
    checkPremiumAccess();
  }, []);

  const checkPremiumAccess = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(response.data);
      // Check if user has any active subscription (not just premium)
      const isActive = response.data?.isActive === true;
      setIsPremium(isActive);
      
      if (!isActive) {
        toast.error('ATS Score Checker is available only for users with an active subscription. Please upgrade to access it.');
        navigate(ROUTES.SUBSCRIPTIONS);
      }
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { status?: number } }) : null;
      if (axiosError && (axiosError.response?.status === 401 || axiosError.response?.status === 403)) {
        toast.error('ATS Score Checker is a Premium feature. Please upgrade to access it.');
        navigate(ROUTES.SUBSCRIPTIONS);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      const allowedExtensions = ['.pdf', '.docx', '.doc'];
      
      const isValidType = allowedTypes.includes(file.type) || 
                         allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValidType) {
        toast.error('Please upload a PDF or DOCX file');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      toast.error('Please upload your resume and enter a job description');
      return;
    }

    try {
      setAnalyzing(true);
      
      const response = await atsService.analyzeResume(resumeFile, jobDescription);
      
      setScore(response.data.score);
      setAnalysis({
        score: response.data.score,
        strengths: response.data.strengths || [],
        improvements: response.data.improvements || [],
        missingKeywords: response.data.missingKeywords || [],
        keywordMatch: response.data.keywordMatch,
      });
      
      toast.success('Resume analysis complete!');
    } catch (error: unknown) {
      // Handle specific error messages
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
        if (axiosError.response?.status === 403) {
          toast.error(axiosError.response.data?.message || 'This feature requires an active subscription');
          navigate(ROUTES.SUBSCRIPTIONS);
        } else {
          toast.error(axiosError.response?.data?.message || 'Failed to analyze resume. Please try again.');
        }
      } else {
        toast.error('Failed to analyze resume. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(ROUTES.USER_DASHBOARD)}
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <FileCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ATS Score Checker</h1>
                  <p className="text-sm text-gray-600">Optimize your resume for job applications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">How it works</h2>
              <p className="text-gray-700 text-sm">
                Upload your resume and paste the job description. Our AI-powered ATS checker will analyze 
                your resume's compatibility with the job requirements and provide actionable insights to improve your match score.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Resume Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Your Resume</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  {resumeFile ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{resumeFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Click to upload resume</p>
                      <p className="text-xs text-gray-500 mt-1">PDF or DOCX format</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !resumeFile || !jobDescription.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-5 w-5" />
                  <span>Analyze Resume</span>
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {score !== null && analysis ? (
              <>
                {/* Score Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ATS Match Score</h3>
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold ${
                      score >= 90 ? 'bg-green-100 text-green-700' :
                        score >= 75 ? 'bg-blue-100 text-blue-700' :
                          score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                    }`}>
                      {score}%
                    </div>
                    <p className="mt-4 text-sm text-gray-600">
                      {score >= 90 ? 'Excellent match!' :
                        score >= 75 ? 'Good match' :
                          score >= 60 ? 'Fair match' :
                            'Needs improvement'}
                    </p>
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {analysis.improvements.map((improvement: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Keywords */}
                {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FileCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Upload your resume and job description to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

