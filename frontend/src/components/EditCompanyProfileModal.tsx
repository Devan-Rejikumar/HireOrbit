import React, { useState, useEffect, useRef } from 'react';
import { SlideModal } from '@/components/ui/slide-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Camera, Upload, Building2 } from 'lucide-react';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { MESSAGES } from '@/constants/messages';

interface Company {
  id: string;
  companyName: string;
  email: string;
  industry?: string;
  size?: string;
  website?: string;
  description?: string;
  logo?: string;
  foundedYear?: number;
  headquarters?: string;
  phone?: string;
  linkedinUrl?: string;
  businessType?: string;
  contactPersonName?: string;
  contactPersonTitle?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
}

interface EditCompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onProfileUpdated: () => void;
}

const EditCompanyProfileModal: React.FC<EditCompanyProfileModalProps> = ({
  isOpen,
  onClose,
  company,
  onProfileUpdated,
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    size: '',
    website: '',
    description: '',
    foundedYear: '',
    headquarters: '',
    phone: '',
    linkedinUrl: '',
    businessType: '',
    contactPersonName: '',
    contactPersonTitle: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
  });
  const [industryCategories, setIndustryCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  // Fetch industry categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.get<{ data: { categories: Array<{ id: string; name: string }> } }>('/industries');
        setIndustryCategories(response.data?.data?.categories || []);
      } catch (err) {
        setIndustryCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Populate form when company data changes
  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.companyName || '',
        industry: company.industry || '',
        size: company.size || '',
        website: company.website || '',
        description: company.description || '',
        foundedYear: company.foundedYear?.toString() || '',
        headquarters: company.headquarters || '',
        phone: company.phone || '',
        linkedinUrl: company.linkedinUrl || '',
        businessType: company.businessType || '',
        contactPersonName: company.contactPersonName || '',
        contactPersonTitle: company.contactPersonTitle || '',
        contactPersonEmail: company.contactPersonEmail || '',
        contactPersonPhone: company.contactPersonPhone || '',
      });
      // Set logo preview if company has logo
      if (company.logo) {
        setLogoPreview(company.logo);
      } else {
        setLogoPreview(null);
      }
    }
  }, [company]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setLogoImage(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  };

  const handleRemoveLogo = () => {
    setLogoImage(null);
    if (company?.logo) {
      setLogoPreview(company.logo);
    } else {
      setLogoPreview(null);
    }
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { companyName, ...formDataWithoutCompanyName } = formData;
      
      // Convert logo to base64 if selected
      let logoData = null;
      if (logoImage) {
        setIsUploadingLogo(true);
        const reader = new FileReader();
        logoData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoImage);
        });
        setIsUploadingLogo(false);
      }

      const updateData = {
        ...formDataWithoutCompanyName,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
        // Convert empty strings to undefined for optional fields
        website: formData.website || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        contactPersonEmail: formData.contactPersonEmail || undefined,
        phone: formData.phone || undefined,
        businessType: formData.businessType || undefined,
        headquarters: formData.headquarters || undefined,
        description: formData.description || undefined,
        ...(logoData && { logo: logoData }),
      };

      await api.put('/company/profile', updateData);
      
      toast.success(MESSAGES.SUCCESS.COMPANY_PROFILE_UPDATED);
      
      // Clean up preview URL if it was created from a new file
      if (logoPreview && logoImage && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
      
      setLogoImage(null);
      onProfileUpdated();
      onClose();
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string; message?: string } } }) : null;
      const errorMessage = axiosError?.response?.data?.error || axiosError?.response?.data?.message || 'Failed to update company profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsUploadingLogo(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URL if it was created from a new file
    if (logoPreview && logoImage && logoPreview.startsWith('blob:')) {
      setLogoPreview(company?.logo || null);
      URL.revokeObjectURL(logoPreview);
    }
    setLogoImage(null);
    onClose();
  };

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Company Profile"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Logo Section */}
        <div className="flex items-center space-x-6 pb-4 border-b">
          <div className="relative group">
            <div 
              className="w-24 h-24 bg-gray-300 rounded-lg border-4 border-white flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => logoInputRef.current?.click()}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt={company?.companyName || 'Company logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="h-12 w-12 text-gray-500" />
              )}
              
              {/* Upload overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex flex-col items-center text-white">
                  <Camera className="h-4 w-4 mb-1" />
                  <span className="text-xs">Change</span>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="absolute -bottom-2 -right-2 flex gap-1">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="bg-white border border-gray-300 p-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                title="Upload new logo"
              >
                <Upload className="h-3 w-3 text-gray-600" />
              </button>
              
              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="bg-white border border-gray-300 p-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                  title="Remove logo"
                >
                  <X className="h-3 w-3 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Company Logo
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Upload your company logo. JPG, PNG up to 5MB.
            </p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
            />
            {logoImage && (
              <p className="text-xs text-green-600">
                ✓ {logoImage.name} selected
              </p>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
          
          <div>
            <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
              Company Name *
            </Label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              disabled
              className="mt-1 bg-gray-50 cursor-not-allowed"
              placeholder="Company name cannot be changed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Company name cannot be modified after registration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                Industry *
              </Label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                disabled={loadingCategories}
                className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{loadingCategories ? 'Loading categories...' : 'Select Industry'}</option>
                {industryCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
                <option value="Retail">Retail</option>
                <option value="Consulting">Consulting</option>
                <option value="Media">Media</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="size" className="text-sm font-medium text-gray-700">
                Company Size *
              </Label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="200+">200+ employees</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="website" className="text-sm font-medium text-gray-700">
              Website
            </Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Company Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell us about your company, its mission, and what makes it unique..."
              className="mt-1"
            />
          </div>
        </div>

        {/* Company Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Company Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="foundedYear" className="text-sm font-medium text-gray-700">
                Founded Year
              </Label>
              <Input
                id="foundedYear"
                name="foundedYear"
                type="number"
                value={formData.foundedYear}
                onChange={handleInputChange}
                min="1900"
                max="2024"
                placeholder="2020"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="headquarters" className="text-sm font-medium text-gray-700">
                Headquarters
              </Label>
              <Input
                id="headquarters"
                name="headquarters"
                value={formData.headquarters}
                onChange={handleInputChange}
                placeholder="City, Country"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="businessType" className="text-sm font-medium text-gray-700">
                Business Type
              </Label>
              <Input
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                placeholder="e.g., Corporation, LLC, Startup"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="linkedinUrl" className="text-sm font-medium text-gray-700">
              LinkedIn URL
            </Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              value={formData.linkedinUrl}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/company/your-company"
              className="mt-1"
            />
          </div>
        </div>

        {/* Contact Person */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Person</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPersonName" className="text-sm font-medium text-gray-700">
                Contact Person Name *
              </Label>
              <Input
                id="contactPersonName"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleInputChange}
                required
                placeholder="John Doe"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contactPersonTitle" className="text-sm font-medium text-gray-700">
                Title *
              </Label>
              <Input
                id="contactPersonTitle"
                name="contactPersonTitle"
                value={formData.contactPersonTitle}
                onChange={handleInputChange}
                required
                placeholder="HR Manager"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPersonEmail" className="text-sm font-medium text-gray-700">
                Contact Email
              </Label>
              <Input
                id="contactPersonEmail"
                name="contactPersonEmail"
                type="email"
                value={formData.contactPersonEmail}
                onChange={handleInputChange}
                placeholder="john@company.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contactPersonPhone" className="text-sm font-medium text-gray-700">
                Contact Phone
              </Label>
              <Input
                id="contactPersonPhone"
                name="contactPersonPhone"
                value={formData.contactPersonPhone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || isUploadingLogo}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading || isUploadingLogo ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                {isUploadingLogo ? 'Uploading logo...' : 'Updating...'}
              </>
            ) : (
              'Update Profile'
            )}
          </Button>
        </div>
      </form>
    </SlideModal>
  );
};

export default EditCompanyProfileModal;
