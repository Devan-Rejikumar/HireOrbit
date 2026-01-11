import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { subscriptionService, SubscriptionStatusResponse } from '@/api/subscriptionService';
import { atsService } from '@/api/atsService';
import { FileCheck, Upload, Sparkles, ArrowLeft, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

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
  const [isExpired, setIsExpired] = useState(false);
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
      
      const subscription = response.data?.subscription;
      const isActive = response.data?.isActive === true;
      
      // Check if subscription has expired
      if (subscription && subscription.currentPeriodEnd) {
        const expiryDate = new Date(subscription.currentPeriodEnd);
        const now = new Date();
        const expired = expiryDate <= now;
        setIsExpired(expired);
        
        if (expired) {
          setIsPremium(false);
          return; // Don't navigate, show expiration message instead
        }
      }
      
      setIsPremium(isActive);
      
      if (!isActive && !isExpired) {
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
        keywordMatch: response.data.keywordMatch || 0,
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

  // Show expiration message
  if (isExpired && subscriptionStatus?.subscription) {
    const expiryDate = new Date(subscriptionStatus.subscription.currentPeriodEnd);
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-4xl mx-auto p-6 pt-20 sm:pt-24">
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Expired</h2>
              <p className="text-gray-600 mb-4">
                Your {subscriptionStatus.plan?.name || 'Premium'} subscription expired on{' '}
                <span className="font-semibold">{expiryDate.toLocaleDateString()}</span>
              </p>
              <p className="text-gray-600 mb-6">
                To continue using the ATS Score Checker and other premium features, please renew your subscription.
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  Renew Subscription
                </button>
                <button
                  onClick={() => navigate(ROUTES.USER_DASHBOARD)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isPremium) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 pt-20 sm:pt-24">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">How it works</h2>
              <p className="text-gray-700 text-xs sm:text-sm">
                Upload your resume and paste the job description. Our AI-powered ATS checker will analyze 
                your resume's compatibility with the job requirements and provide actionable insights to improve your match score.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Resume Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Upload Your Resume</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center hover:border-purple-400 transition-colors">
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
                  <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
                  {resumeFile ? (
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-none">{resumeFile.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">Click to upload resume</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">PDF or DOCX format</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Job Description</h3>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-48 sm:h-64 p-3 sm:p-4 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !resumeFile || !jobDescription.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">ATS Match Score</h3>
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-full text-2xl sm:text-4xl font-bold ${
                      score >= 90 ? 'bg-green-100 text-green-700' :
                        score >= 75 ? 'bg-blue-100 text-blue-700' :
                          score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                    }`}>
                      {score}%
                    </div>
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
                      {score >= 90 ? 'Excellent match!' :
                        score >= 75 ? 'Good match' :
                          score >= 60 ? 'Fair match' :
                            'Needs improvement'}
                    </p>
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    Strengths
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {analysis.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {analysis.improvements.map((improvement: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Keywords */}
                {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {analysis.missingKeywords.map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-0.5 sm:py-1 bg-red-100 text-red-700 rounded-full text-xs sm:text-sm font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
                <FileCheck className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-500">Upload your resume and job description to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

