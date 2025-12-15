import api from './axios';

export interface SiteSettings {
  id: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
  type: 'placement' | 'testimonial' | 'promotion' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface ContentPage {
  id: string;
  slug: 'about' | 'help';
  title: string;
  content: string; // HTML content
  updatedAt: string;
  updatedBy: string | null;
}

export const settingsService = {
  // Public endpoints
  async getSettings(): Promise<{ data: SiteSettings }> {
    const response = await api.get<{ success: boolean; data: { settings: SiteSettings }; message: string }>('/public/settings');
    return { data: response.data.data.settings };
  },

  async getActiveBanners(): Promise<{ data: Banner[] }> {
    const response = await api.get<{ success: boolean; data: { banners: Banner[] }; message: string }>('/public/banners');
    return { data: response.data.data.banners };
  },

  async getContentPage(slug: 'about' | 'help'): Promise<{ data: ContentPage }> {
    const response = await api.get<{ success: boolean; data: { page: ContentPage }; message: string }>(`/public/content-pages/${slug}`);
    return { data: response.data.data.page };
  },

  // Admin endpoints
  async updateLogo(logoDataUri: string): Promise<{ data: SiteSettings }> {
    const response = await api.put<{ success: boolean; data: { settings: SiteSettings }; message: string }>('/admin/settings/logo', {
      logo: logoDataUri,
    });
    return { data: response.data.data.settings };
  },

  async getAllBanners(): Promise<{ data: Banner[] }> {
    const response = await api.get<{ success: boolean; data: { banners: Banner[] }; message: string }>('/admin/banners');
    return { data: response.data.data.banners };
  },

  async getBannerById(id: string): Promise<{ data: Banner }> {
    const response = await api.get<{ success: boolean; data: { banner: Banner }; message: string }>(`/admin/banners/${id}`);
    return { data: response.data.data.banner };
  },

  async createBanner(data: {
    title: string;
    image: string; // base64 data URI
    linkUrl?: string;
    type: 'placement' | 'testimonial' | 'promotion' | 'other';
  }): Promise<{ data: Banner }> {
    const response = await api.post<{ success: boolean; data: { banner: Banner }; message: string }>('/admin/banners', data);
    return { data: response.data.data.banner };
  },

  async updateBanner(id: string, data: {
    title?: string;
    image?: string; // base64 data URI
    linkUrl?: string;
    isActive?: boolean;
    type?: 'placement' | 'testimonial' | 'promotion' | 'other';
  }): Promise<{ data: Banner }> {
    const response = await api.put<{ success: boolean; data: { banner: Banner }; message: string }>(`/admin/banners/${id}`, data);
    return { data: response.data.data.banner };
  },

  async deleteBanner(id: string): Promise<void> {
    await api.delete(`/admin/banners/${id}`);
  },

  async reorderBanners(ids: string[]): Promise<void> {
    await api.put('/admin/banners/reorder', { ids });
  },

  async updateContentPage(slug: 'about' | 'help', title: string, content: string): Promise<{ data: ContentPage }> {
    const response = await api.put<{ success: boolean; data: { page: ContentPage }; message: string }>(`/admin/content-pages/${slug}`, {
      title,
      content,
    });
    return { data: response.data.data.page };
  },
};

