import React, { useState, useEffect } from 'react';
import { SlideModal } from '@/components/ui/slide-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/api/axios';
import toast from 'react-hot-toast';

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

  const [loading, setLoading] = useState(false);

  // Fetch industry categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.get<{ data: { categories: Array<{ id: string; name: string }> } }>('/industries');
        setIndustryCategories(response.data?.data?.categories || []);
      } catch (err) {
        console.error('Failed to load industry categories', err);
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
    }
  }, [company]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { companyName, ...formDataWithoutCompanyName } = formData;
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
      };

      console.log('Updating company profile with data:', updateData);
      console.log('Form data before processing:', formData);
      console.log('Description length:', formData.description?.length);
      console.log('Description content:', formData.description);
      
      const response = await api.put('/company/profile', updateData);
      console.log('Update response:', response.data);
      
      toast.success('Company profile updated successfully!');
      onProfileUpdated();
      onClose();
    } catch (error: unknown) {
      console.error('Error updating company profile:', error);
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string; message?: string } } }) : null;
      console.error('Error response:', axiosError?.response);
      console.error('Error response data:', axiosError?.response?.data);
      const errorMessage = axiosError?.response?.data?.error || axiosError?.response?.data?.message || 'Failed to update company profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Company Profile"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
            onClick={onClose}
            disabled={loading}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </div>
      </form>
    </SlideModal>
  );
};

export default EditCompanyProfileModal;
