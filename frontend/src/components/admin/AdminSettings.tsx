import React, { useState, useEffect, useRef } from 'react';
import api from '@/api/axios';
import { FiUpload, FiSave, FiImage, FiType, FiFileText, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ApiResponse } from '@/types/api';

interface SiteSettings {
  logoUrl: string | null;
  companyName: string | null;
  aboutPage: string | null;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    logoUrl: null,
    companyName: 'Hireorbit',
    aboutPage: null,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState<string>('');
  const [useUrlInput, setUseUrlInput] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<any>>('/settings');
      if (response.data?.success && response.data?.data) {
        setSettings({
          logoUrl: response.data.data.logoUrl || null,
          companyName: response.data.data.companyName || 'Hireorbit',
          aboutPage: response.data.data.aboutPage || null,
        });
        if (response.data.data.logoUrl) {
          setLogoPreview(response.data.data.logoUrl);
          setLogoUrlInput(response.data.data.logoUrl);
        }
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, or SVG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String);
      handleLogoUpload(base64String);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async (base64String: string) => {
    try {
      setUploading(true);
      const response = await api.put<ApiResponse<any>>('/settings/logo', {
        logo: base64String,
      });

      if (response.data?.success) {
        const newLogoUrl = response.data.data.logoUrl;
        setSettings(prev => ({ ...prev, logoUrl: newLogoUrl }));
        setLogoPreview(newLogoUrl);
        setLogoUrlInput(newLogoUrl);
        toast.success('Logo uploaded successfully!');
        // Refresh branding context
        window.dispatchEvent(new Event('branding-updated'));
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      toast.error(axiosError.response?.data?.error || 'Failed to upload logo');
      setLogoPreview(settings.logoUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUrlSave = async () => {
    if (!logoUrlInput.trim()) {
      toast.error('Please enter a valid logo URL');
      return;
    }

    // Validate URL format
    try {
      new URL(logoUrlInput.trim());
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      setUploading(true);
      const response = await api.put<ApiResponse<any>>('/settings', {
        logoUrl: logoUrlInput.trim(),
      });

      if (response.data?.success) {
        const newLogoUrl = response.data.data.logoUrl;
        setSettings(prev => ({ ...prev, logoUrl: newLogoUrl }));
        setLogoPreview(newLogoUrl);
        toast.success('Logo URL saved successfully!');
        // Refresh branding context
        window.dispatchEvent(new Event('branding-updated'));
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      toast.error(axiosError.response?.data?.error || 'Failed to save logo URL');
    } finally {
      setUploading(false);
    }
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, companyName: e.target.value }));
  };

  const handleAboutPageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSettings(prev => ({ ...prev, aboutPage: e.target.value }));
  };

  const handleSaveCompanyName = async () => {
    if (!settings.companyName?.trim()) {
      toast.error('Company name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      const response = await api.put<ApiResponse<any>>('/settings/company-name', {
        companyName: settings.companyName.trim(),
      });

      if (response.data?.success) {
        toast.success('Company name updated successfully!');
        window.dispatchEvent(new Event('branding-updated'));
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      toast.error(axiosError.response?.data?.error || 'Failed to update company name');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAboutPage = async () => {
    try {
      setSaving(true);
      const response = await api.put<ApiResponse<any>>('/settings/about-page', {
        aboutPage: settings.aboutPage || '',
      });

      if (response.data?.success) {
        toast.success('About page updated successfully!');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      toast.error(axiosError.response?.data?.error || 'Failed to update about page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <FiSettings className="text-purple-400" />
          Branding & Company Settings
        </h2>

        {/* Logo Upload Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <FiImage className="text-purple-400" size={18} />
            <h3 className="text-lg sm:text-xl font-semibold text-white">Company Logo</h3>
          </div>
          <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">
            Upload your company logo (PNG, JPG, or SVG) or enter a logo URL. This logo will be displayed across the platform in headers and chat watermark.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-700 rounded-lg border-2 border-gray-600 flex items-center justify-center overflow-hidden mx-auto sm:mx-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <FiImage size={28} className="mx-auto mb-2" />
                    <p className="text-xs">No Logo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3 sm:space-y-4 w-full">
              {/* Toggle between upload and URL */}
              <div className="flex gap-2">
                <button
                  onClick={() => setUseUrlInput(false)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm ${
                    !useUrlInput
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="hidden sm:inline">Upload File</span>
                  <span className="sm:hidden">Upload</span>
                </button>
                <button
                  onClick={() => setUseUrlInput(true)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm ${
                    useUrlInput
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="hidden sm:inline">Enter URL</span>
                  <span className="sm:hidden">URL</span>
                </button>
              </div>

              {!useUrlInput ? (
                /* File Upload */
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    <FiUpload size={16} />
                    {uploading ? 'Uploading...' : logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  <p className="text-gray-400 text-xs mt-2">
                    Recommended: 500x500px, Max size: 5MB
                  </p>
                </div>
              ) : (
                /* URL Input */
                <div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={logoUrlInput}
                      onChange={(e) => setLogoUrlInput(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="flex-1 px-3 sm:px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <button
                      onClick={handleLogoUrlSave}
                      disabled={uploading || !logoUrlInput.trim()}
                      className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm whitespace-nowrap"
                    >
                      <FiSave size={16} />
                      {uploading ? 'Saving...' : 'Save URL'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Enter a direct URL to your logo image
                  </p>
                </div>
              )}

              {logoPreview && (
                <button
                  onClick={async () => {
                    try {
                      await api.put('/settings', { logoUrl: null });
                      setLogoPreview(null);
                      setLogoUrlInput('');
                      setSettings(prev => ({ ...prev, logoUrl: null }));
                      toast.success('Logo removed successfully!');
                      window.dispatchEvent(new Event('branding-updated'));
                    } catch {
                      toast.error('Failed to remove logo');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Company Name Section */}
        <div className="mb-6 sm:mb-8 border-t border-gray-700 pt-4 sm:pt-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <FiType className="text-purple-400" size={18} />
            <h3 className="text-lg sm:text-xl font-semibold text-white">Company Name</h3>
          </div>
          <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">
            Set the company name that will be displayed as a fallback when no logo is available.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              value={settings.companyName || ''}
              onChange={handleCompanyNameChange}
              placeholder="Enter company name"
              className="flex-1 px-3 sm:px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              onClick={handleSaveCompanyName}
              disabled={saving}
              className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <FiSave size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* About Page Section */}
        <div className="border-t border-gray-700 pt-4 sm:pt-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <FiFileText className="text-purple-400" size={18} />
            <h3 className="text-lg sm:text-xl font-semibold text-white">About Page Content</h3>
          </div>
          <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">
            Edit the content that will be displayed on the public About page. You can use plain text or HTML.
          </p>
          <textarea
            value={settings.aboutPage || ''}
            onChange={handleAboutPageChange}
            placeholder="Enter about page content..."
            rows={8}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y font-mono text-xs sm:text-sm"
          />
          <div className="mt-3 sm:mt-4">
            <button
              onClick={handleSaveAboutPage}
              disabled={saving}
              className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <FiSave size={16} />
              {saving ? 'Saving...' : 'Save About Page'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

