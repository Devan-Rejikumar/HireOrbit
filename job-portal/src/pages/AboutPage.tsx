import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { settingsService, ContentPage } from '@/api/settingsService';
import Footer from '@/components/Footer';

const AboutPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await settingsService.getContentPage('about');
        console.log('About page response:', response);
        if (response && response.data) {
          setContent(response.data);
        } else {
          console.warn('No content data in response');
          setContent({
            id: 'default',
            slug: 'about',
            title: 'About Us',
            content: '<p>Welcome to HireOrbit! We are dedicated to connecting talented professionals with amazing opportunities.</p>',
            updatedAt: new Date().toISOString(),
            updatedBy: null,
          });
        }
      } catch (error) {
        console.error('Error fetching about content:', error);
        // Set default content if API fails
        setContent({
          id: 'default',
          slug: 'about',
          title: 'About Us',
          content: '<p>Welcome to HireOrbit! We are dedicated to connecting talented professionals with amazing opportunities.</p>',
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
        <div className="container mx-auto px-4 pt-8 pb-16">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </button>
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
      <div className="container mx-auto px-4 pt-8 pb-16">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </button>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">{content?.title || 'About Us'}</h1>
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

export default AboutPage;

