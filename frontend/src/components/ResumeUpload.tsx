import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, Eye, X as CloseIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ResumeUploadProps {
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  currentResume?: string;
  isLoading?: boolean;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onUpload,
  onDelete,
  currentResume,
  isLoading = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your resume?')) {
      try {
        await onDelete();
        toast.success('Resume deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete resume');
      }
    }
  };

  const getCleanFileName = () => {
    if (currentResume) {
      const extension = currentResume.includes('.pdf') ? 'pdf' : 'doc';
      return `resume.${extension}`;
    }
    return 'resume.pdf';
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentResume) {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(currentResume)}&embedded=true`;
      window.open(googleViewerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-4">
      {currentResume ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Resume Uploaded</p>
                <p className="text-xs text-green-600">{getCleanFileName()}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleViewClick}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <Eye className="h-4 w-4" />
                <span>View</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Drag and drop your resume here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500">
            PDF or Word document, max 5MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleChange}
            className="hidden"
            disabled={isLoading}
          />
        </div>
      )}

      {!currentResume && (
        <div className="flex items-center justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Upload Resume</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Simple PDF Viewer Modal */}
      {showPdfViewer && currentResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Resume Viewer</h3>
              <button
                onClick={() => setShowPdfViewer(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={currentResume}
                className="w-full h-full border-0 rounded"
                title="Resume Preview"
                style={{ minHeight: '600px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;