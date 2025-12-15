import { useEffect, useState } from 'react';
import { settingsService, ContentPage } from '@/api/settingsService';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const HelpPage = () => {
  const [content, setContent] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await settingsService.getContentPage('help');
        setContent(response.data);
      } catch (error) {
        console.error('Error fetching help content:', error);
        // Set default content if API fails
        setContent({
          id: 'default',
          slug: 'help',
          title: 'Help & Support',
          content: '<p>Need help? Contact our support team for assistance.</p>',
          updatedAt: new Date().toISOString(),
          updatedBy: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">{content?.title || 'Help & Support'}</h1>
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content?.content || '<p>Content coming soon...</p>' }}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HelpPage;

