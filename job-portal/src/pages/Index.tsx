import { lazy, Suspense } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
// import JobCategories from '@/components/JobCategories';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';
import { LazyComponent } from '@/components/LazyComponent';

// Lazy load below-the-fold components
const FeaturedJobs = lazy(() => import('@/components/FeaturedJobs'));
const CompanyShowcase = lazy(() => import('@/components/CompanyShowcase'));
const Testimonials = lazy(() => import('@/components/Testimonials'));

// Loading placeholder
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
);

import BannerCarousel from '@/components/BannerCarousel';

const Index = () => {
  console.log('Rendering job portal landing page');
  
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      {/* <JobCategories /> */}
      
      {/* Lazy load FeaturedJobs when it comes into view */}
      <LazyComponent fallback={<ComponentLoader />}>
        <Suspense fallback={<ComponentLoader />}>
          <FeaturedJobs />
        </Suspense>
      </LazyComponent>
      
      {/* Banner Carousel - after Featured Jobs */}
      <div className="container mx-auto px-4 py-8">
        <BannerCarousel />
      </div>
      
      {/* Lazy load CompanyShowcase when it comes into view */}
      <LazyComponent fallback={<ComponentLoader />}>
        <Suspense fallback={<ComponentLoader />}>
          <CompanyShowcase />
        </Suspense>
      </LazyComponent>
      
      {/* Lazy load Testimonials when it comes into view */}
      <LazyComponent fallback={<ComponentLoader />}>
        <Suspense fallback={<ComponentLoader />}>
          <Testimonials />
        </Suspense>
      </LazyComponent>
      
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
