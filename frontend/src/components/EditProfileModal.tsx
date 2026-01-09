import React, { useState, useRef } from 'react';
import { X, User, Camera, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileUpdateData {
  headline?: string;
  about?: string;
  location?: string;
  phone?: string;
  profilePicture?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfileUpdateData) => void;
  currentProfile: {
    headline?: string;
    about?: string;
    location?: string;
    phone?: string;
    profilePicture?: string;
  };
  currentUser: {
    name: string;
    email: string;
  };
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentProfile,
  currentUser,
}) => {
  const [formData, setFormData] = useState({
    headline: currentProfile.headline || '',
    about: currentProfile.about || '',
    location: currentProfile.location || '',
    phone: currentProfile.phone || '',
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(currentProfile.profilePicture || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setProfileImage(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUploading(true);
      
      // Convert image to base64 if selected
      let profilePictureData = null;
      if (profileImage) {
        const reader = new FileReader();
        profilePictureData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(profileImage);
        });
      }
      
      // Send JSON data with base64 image
      const submitData = {
        headline: formData.headline,
        about: formData.about,
        location: formData.location,
        phone: formData.phone,
        ...(profilePictureData && { profilePicture: profilePictureData }),
      };

      await onSave(submitData);
      
      // Close modal; let cleanup happen in handleClose
      onClose();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message?: string }).message
        : undefined;
      toast.error(errorMessage || 'Failed to save profile');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URL if it was created from a new file
    if (imagePreview && profileImage && imagePreview.startsWith('blob:')) {
      // Clear src first to avoid render attempts on revoked URL
      setImagePreview(null);
      URL.revokeObjectURL(imagePreview);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div 
                  className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-gray-500" />
                  )}
                  
                  {/* Upload overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-gray-300 p-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                    title="Upload new image"
                  >
                    <Upload className="h-3 w-3 text-gray-600" />
                  </button>
                  
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="bg-white border border-gray-300 p-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                      title="Remove image"
                    >
                      <X className="h-3 w-3 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Profile Picture
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Upload a professional photo. JPG, PNG up to 5MB.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {profileImage && (
                  <p className="text-xs text-green-600">
                    ✓ {profileImage.name} selected
                  </p>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Headline
                </label>
                <input
                  type="text"
                  id="headline"
                  name="headline"
                  value={formData.headline}
                  onChange={handleInputChange}
                  placeholder="e.g., Software Engineer at Tech Corp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., New York, NY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
                About
              </label>
              <textarea
                id="about"
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell us about yourself, your experience, and what you're looking for..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;