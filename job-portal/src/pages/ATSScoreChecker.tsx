import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FaCloudUploadAlt, FaCheckCircle, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import { atsService, AtsAnalysisResult } from '../api/atsService';
import Header from '../components/Header';

const calculateColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
};

export const ATSScoreChecker: React.FC = () => {
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsAnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!resume || !jobDescription) {
      toast.error('Please upload a resume and provide a job description.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await atsService.analyzeResume(resume, jobDescription);
      setResult(data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white font-sans">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-10 max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            AI Resume Scorer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Optimize your resume for Applicant Tracking Systems. Upload your CV and the Job Description to see how well you match.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Input Section */}
          <motion.div 
             initial={{ x: -50, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.1 }}
             className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg"><FaCloudUploadAlt /></span>
              Upload Details
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Resume (PDF)</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer relative bg-gray-50 dark:bg-gray-900">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
                  <p className="font-medium">{resume ? resume.name : 'Click or drop PDF here'}</p>
                  <p className="text-xs text-gray-400 mt-1">Max 5MB</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-40 p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all start-0 outline-none resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform transform active:scale-95 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-blue-500/30'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                  Analyzing...
                </span>
              ) : (
                'Analyze Match'
              )}
            </button>
          </motion.div>

          {/* Results Placeholder / View */}
          <motion.div 
             initial={{ x: 50, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="relative"
          >
             <AnimatePresence mode='wait'>
                {!result ? (
                   <motion.div 
                     key="placeholder"
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }}
                     className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 h-full flex flex-col items-center justify-center text-center opacity-60"
                   >
                     <img 
                       src="https://cdn-icons-png.flaticon.com/512/2641/2641409.png" // Generic illustration placeholder or use icon
                       alt="AI Analysis" 
                       className="w-32 h-32 mb-4 opacity-50 grayscale" 
                     />
                     <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                     <p className="text-gray-500">Your results including match score, missing keywords, and detailed insights will appear here.</p>
                   </motion.div>
                ) : (
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 h-full overflow-y-auto custom-scrollbar"
                  >
                     <div className="flex items-center justify-between mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                        <div>
                          <h2 className="text-2xl font-bold">Analysis Results</h2>
                          <p className="text-sm text-gray-500">AI-powered insights</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={`text-5xl font-black ${calculateColor(result.score)}`}>
                            {result.score}%
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Match Score</span>
                        </div>
                     </div>

                     <div className="space-y-6">
                        {/* Analysis Summary */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                           <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                             <FaLightbulb /> Summary
                           </h4>
                           <p className="text-sm leading-relaxed">{result.analysis}</p>
                        </div>

                        {/* Keywords */}
                        <div>
                           <h4 className="font-semibold mb-3 flex items-center gap-2">
                             <FaCheckCircle className="text-green-500"/> Matching Keywords
                           </h4>
                           <div className="flex flex-wrap gap-2">
                              {result.matchingKeywords.map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                  {kw}
                                </span>
                              ))}
                              {result.matchingKeywords.length === 0 && <span className="text-gray-400 italic text-sm">No exact matches found.</span>}
                           </div>
                        </div>

                        <div>
                           <h4 className="font-semibold mb-3 flex items-center gap-2">
                             <FaExclamationTriangle className="text-red-500"/> Missing Keywords
                           </h4>
                           <div className="flex flex-wrap gap-2">
                              {result.missingKeywords.map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                                  {kw}
                                </span>
                              ))}
                               {result.missingKeywords.length === 0 && <span className="text-gray-400 italic text-sm">Great job! No major keywords missing.</span>}
                           </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                           <h4 className="font-semibold mb-3">Recommendations</h4>
                           <ul className="space-y-2">
                              {result.recommendations.map((rec, i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                  <span className="text-blue-500 font-bold">•</span>
                                  {rec}
                                </li>
                              ))}
                           </ul>
                        </div>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ATSScoreChecker;
