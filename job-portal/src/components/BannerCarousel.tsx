import { useEffect, useState } from 'react';
import { settingsService, Banner } from '@/api/settingsService';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await settingsService.getActiveBanners();
        const bannersData = Array.isArray(response.data) ? response.data : [];
        setBanners(bannersData);
        if (bannersData.length > 0) {
          setCurrentIndex(0);
        } else {
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Ensure currentIndex is always valid
  useEffect(() => {
    if (banners.length > 0 && currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (banners.length === 0) return 0;
        return (prev + 1) % banners.length;
      });
    }, 5000); // Auto-rotate every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = () => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToSlide = (index: number) => {
    if (index < 0 || index >= banners.length) return;
    setCurrentIndex(index);
  };

  if (loading) {
    return null;
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  // Safety check - ensure currentBanner exists
  if (!currentBanner) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Heading */}
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Special Offers & Announcements</h2>
        <p className="text-gray-600">Discover exciting opportunities and latest updates</p>
      </div>

      {/* Banner Carousel */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 mb-8 overflow-hidden rounded-lg shadow-lg">
        {currentBanner.linkUrl ? (
          <a
            href={currentBanner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
          </a>
        ) : (
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="w-full h-full object-cover"
          />
        )}

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default BannerCarousel;

