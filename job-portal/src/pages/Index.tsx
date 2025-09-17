
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import JobCategories from '@/components/JobCategories';
import FeaturedJobs from '@/components/FeaturedJobs';
import CompanyShowcase from '@/components/CompanyShowcase';
import Testimonials from '@/components/Testimonials';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';

const Index = () => {
  console.log('Rendering job portal landing page');
  
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <JobCategories />
      <FeaturedJobs />
      <CompanyShowcase />
      <Testimonials />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
