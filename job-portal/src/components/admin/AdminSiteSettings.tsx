import { useState, useEffect } from 'react';
import { settingsService, SiteSettings, Banner, ContentPage } from '@/api/settingsService';
import { Upload, X, Plus, Edit2, Trash2, GripVertical, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSiteSettings = () => {
  const [activeTab, setActiveTab] = useState<'logo' | 'banners' | 'content'>('logo');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [aboutPage, setAboutPage] = useState<ContentPage | null>(null);
  const [helpPage, setHelpPage] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    image: null as File | null,
    linkUrl: '',
    type: 'promotion' as 'placement' | 'testimonial' | 'promotion' | 'other',
  });
  const [contentForm, setContentForm] = useState({
    about: { title: '', content: '' },
    help: { title: '', content: '' },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, bannersRes, aboutRes, helpRes] = await Promise.all([
        settingsService.getSettings().catch(() => null),
        settingsService.getAllBanners().catch(() => ({ data: [] })),
        settingsService.getContentPage('about').catch(() => null),
        settingsService.getContentPage('help').catch(() => null),
      ]);

      if (settingsRes) setSettings(settingsRes.data);
      if (bannersRes) setBanners(bannersRes.data);
      if (aboutRes) {
        setAboutPage(aboutRes.data);
        setContentForm(prev => ({
          ...prev,
          about: { title: aboutRes.data.title, content: aboutRes.data.content },
        }));
      }
      if (helpRes) {
        setHelpPage(helpRes.data);
        setContentForm(prev => ({
          ...prev,
          help: { title: helpRes.data.title, content: helpRes.data.content },
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Please select a logo file');
      return;
    }

    try {
      const base64 = await fileToBase64(logoFile);
      const response = await settingsService.updateLogo(base64);
      setSettings(response.data);
      setLogoFile(null);
      setLogoPreview(null);
      toast.success('Logo updated successfully');
      // Reload settings to ensure we have the latest data
      const settingsRes = await settingsService.getSettings();
      if (settingsRes) setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error updating logo:', error);
      toast.error('Failed to update logo');
    }
  };

  const handleBannerSubmit = async () => {
    if (!bannerForm.title || !bannerForm.image) {
      toast.error('Title and image are required');
      return;
    }

    try {
      const base64 = await fileToBase64(bannerForm.image);
      
      if (editingBanner) {
        await settingsService.updateBanner(editingBanner.id, {
          title: bannerForm.title,
          image: base64,
          linkUrl: bannerForm.linkUrl || undefined,
          type: bannerForm.type,
        });
        toast.success('Banner updated successfully');
      } else {
        await settingsService.createBanner({
          title: bannerForm.title,
          image: base64,
          linkUrl: bannerForm.linkUrl || undefined,
          type: bannerForm.type,
        });
        toast.success('Banner created successfully');
      }

      setBannerForm({ title: '', image: null, linkUrl: '', type: 'promotion' });
      setEditingBanner(null);
      setShowBannerForm(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save banner';
      toast.error(errorMessage);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      await settingsService.deleteBanner(id);
      toast.success('Banner deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleReorderBanners = async (newOrder: Banner[]) => {
    try {
      await settingsService.reorderBanners(newOrder.map(b => b.id));
      setBanners(newOrder);
      toast.success('Banners reordered successfully');
    } catch (error) {
      console.error('Error reordering banners:', error);
      toast.error('Failed to reorder banners');
    }
  };

  const handleContentSave = async (slug: 'about' | 'help') => {
    const form = contentForm[slug];
    if (!form.title || !form.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      await settingsService.updateContentPage(slug, form.title, form.content);
      toast.success(`${slug === 'about' ? 'About' : 'Help'} page updated successfully`);
      loadData();
    } catch (error) {
      console.error(`Error updating ${slug} page:`, error);
      toast.error(`Failed to update ${slug} page`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-white">Site Settings</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('logo')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'logo' ? 'border-b-2 border-purple-600 text-purple-400' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Logo
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'banners' ? 'border-b-2 border-purple-600 text-purple-400' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Banners
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'content' ? 'border-b-2 border-purple-600 text-purple-400' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Content Pages
        </button>
      </div>

      {/* Logo Tab */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Current Logo</h3>
            {settings?.logoUrl ? (
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img src={settings.logoUrl} alt="Logo" className="h-20 w-auto" />
              </div>
            ) : (
              <p className="text-gray-400 mb-4">No logo uploaded</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Upload New Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setLogoFile(file);
                  setLogoPreview(URL.createObjectURL(file));
                }
              }}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {logoPreview && (
              <div className="mt-4 bg-white p-4 rounded-lg inline-block">
                <img src={logoPreview} alt="Preview" className="h-20 w-auto" />
              </div>
            )}
            <button
              onClick={handleLogoUpload}
              disabled={!logoFile}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Logo
            </button>
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Banners</h3>
            <button
              onClick={() => {
                setEditingBanner(null);
                setBannerForm({ title: '', image: null, linkUrl: '', type: 'promotion' });
                setShowBannerForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              Add Banner
            </button>
          </div>

          {/* Banner Form */}
          {(showBannerForm || editingBanner || bannerForm.title || bannerForm.image) && (
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h4 className="font-semibold">{editingBanner ? 'Edit Banner' : 'New Banner'}</h4>
              <input
                type="text"
                placeholder="Banner Title"
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setBannerForm({ ...bannerForm, image: file });
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              <input
                type="url"
                placeholder="Link URL (optional)"
                value={bannerForm.linkUrl}
                onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <select
                value={bannerForm.type}
                onChange={(e) => setBannerForm({ ...bannerForm, type: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="promotion">Promotion</option>
                <option value="placement">Placement</option>
                <option value="testimonial">Testimonial</option>
                <option value="other">Other</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleBannerSubmit}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingBanner ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setEditingBanner(null);
                    setBannerForm({ title: '', image: null, linkUrl: '', type: 'promotion' });
                    setShowBannerForm(false);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Banners List */}
          <div className="space-y-4">
            {banners.map((banner, index) => (
              <div key={banner.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                <img src={banner.imageUrl} alt={banner.title} className="w-32 h-20 object-cover rounded" />
                <div className="flex-1">
                  <h4 className="font-semibold">{banner.title}</h4>
                  <p className="text-sm text-gray-500">Type: {banner.type}</p>
                  <p className="text-sm text-gray-500">Order: {banner.order}</p>
                  <p className="text-sm text-gray-500">Status: {banner.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingBanner(banner);
                      setBannerForm({
                        title: banner.title,
                        image: null,
                        linkUrl: banner.linkUrl || '',
                        type: banner.type,
                      });
                      setShowBannerForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Pages Tab */}
      {activeTab === 'content' && (
        <div className="space-y-8">
          {/* About Page */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">About Page</h3>
            <input
              type="text"
              placeholder="Page Title"
              value={contentForm.about.title}
              onChange={(e) =>
                setContentForm({
                  ...contentForm,
                  about: { ...contentForm.about, title: e.target.value },
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <textarea
              placeholder="HTML Content"
              value={contentForm.about.content}
              onChange={(e) =>
                setContentForm({
                  ...contentForm,
                  about: { ...contentForm.about, content: e.target.value },
                })
              }
              rows={15}
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
            />
            <button
              onClick={() => handleContentSave('about')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Save className="w-4 h-4" />
              Save About Page
            </button>
          </div>

          {/* Help Page */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Help Page</h3>
            <input
              type="text"
              placeholder="Page Title"
              value={contentForm.help.title}
              onChange={(e) =>
                setContentForm({
                  ...contentForm,
                  help: { ...contentForm.help, title: e.target.value },
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <textarea
              placeholder="HTML Content"
              value={contentForm.help.content}
              onChange={(e) =>
                setContentForm({
                  ...contentForm,
                  help: { ...contentForm.help, content: e.target.value },
                })
              }
              rows={15}
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
            />
            <button
              onClick={() => handleContentSave('help')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Save className="w-4 h-4" />
              Save Help Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSiteSettings;

