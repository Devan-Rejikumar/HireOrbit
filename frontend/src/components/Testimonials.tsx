import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote, ArrowRight } from 'lucide-react';

const testimonials = [
  {
    name: 'Mathews Abraham',
    role: 'Software Engineer',
    company: 'TechCorp',
    // Add your image URL here (e.g., from Cloudinary, Imgur, or any CDN)
    imageUrl: 'https://i.pinimg.com/1200x/6a/37/8e/6a378e3f5dec6d1740174d92e5d54722.jpg',
    fallbackEmoji: '👩‍💻',
    content: 'I found my dream job within 2 weeks! The platform made it so easy to connect with the right employers.',
    rating: 5,
  },
  {
    name: 'Pooja Ponappan',
    role: 'Product Designer',
    company: 'DesignStudio',
    imageUrl: 'https://i.pinimg.com/1200x/8f/c2/a4/8fc2a4b8001e4ea2c99c3f78702fe238.jpg',
    fallbackEmoji: '👨‍🎨',
    content: 'Amazing experience! The quality of job listings and the application process is top-notch.',
    rating: 5,
  },
  {
    name: 'Harris Rauf',
    role: 'Marketing Manager',
    company: 'StartupXYZ',
    imageUrl: 'https://i.pinimg.com/1200x/df/0a/e9/df0ae9637223e10aa28512d98695272d.jpg',
    fallbackEmoji: '👩‍💼',
    content: 'This platform changed my career trajectory. I\'m now working at my ideal company!',
    rating: 5,
  },
];

// Individual testimonial card with image handling
const TestimonialCard = ({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const showEmoji = !testimonial.imageUrl || imageError;

  return (
    <Card 
      className="group relative cursor-pointer border-0 shadow-none bg-transparent overflow-visible"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Hover Glow Effect - Subtle */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-300/30 via-yellow-300/30 to-orange-300/30 rounded-3xl blur-lg opacity-0 group-hover:opacity-40 transition-all duration-300"></div>
      
      <CardContent className="relative p-0">
        <div className="bg-white rounded-3xl p-8 border border-amber-200/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          {/* Quote Icon */}
          <div className="absolute -top-4 -right-2 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/40 transform rotate-6 group-hover:rotate-12 transition-transform duration-300">
            <Quote className="w-5 h-5 text-white" />
          </div>

          {/* Person Image / Emoji Space */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Glowing ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 blur-sm opacity-60"></div>
              
              {/* Image container */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-amber-100 to-yellow-50 flex items-center justify-center">
                {showEmoji ? (
                  // Show emoji fallback
                  <span className="text-5xl">{testimonial.fallbackEmoji}</span>
                ) : (
                  // Show image from URL
                  <>
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-50">
                        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <img 
                      src={testimonial.imageUrl}
                      alt={testimonial.name}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  </>
                )}
              </div>
              
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-md"></div>
            </div>
          </div>
          
          {/* Star Rating */}
          <div className="flex justify-center gap-1 mb-5">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star 
                key={i} 
                className="h-5 w-5 fill-amber-400 text-amber-400 drop-shadow-sm" 
              />
            ))}
          </div>
          
          {/* Testimonial Content */}
          <p className="text-gray-700 mb-6 italic text-center leading-relaxed text-base">
            "{testimonial.content}"
          </p>
          
          {/* Divider */}
          <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full mx-auto mb-5"></div>
          
          {/* Author Info */}
          <div className="text-center">
            <h4 className="font-bold text-gray-900 text-lg mb-1">{testimonial.name}</h4>
            <div className="flex items-center justify-center gap-2 text-amber-700/80">
              <span className="text-sm font-medium">{testimonial.role}</span>
              <span className="text-amber-400">•</span>
              <span className="text-sm">{testimonial.company}</span>
            </div>
          </div>

          {/* Bottom accent line on hover */}
          <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </CardContent>
    </Card>
  );
};

const Testimonials = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Spiral Dotted Arrow - Left Side (spiraling from top-left to center) */}
      <svg className="absolute top-10 left-0 w-[300px] h-[400px] hidden lg:block opacity-60" viewBox="0 0 300 400" fill="none">
        <path 
          d="M10 20 C30 50, 80 40, 120 80 C160 120, 140 180, 100 220 C60 260, 80 320, 140 350 C200 380, 280 350, 290 300" 
          stroke="#D97706" 
          strokeWidth="2.5" 
          strokeDasharray="8 6" 
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrow head */}
        <path d="M285 305 L290 300 L295 305" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M288 308 L290 300" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>

      {/* Spiral Dotted Arrow - Right Side (spiraling from top-right to center) */}
      <svg className="absolute top-10 right-0 w-[300px] h-[400px] hidden lg:block opacity-60" viewBox="0 0 300 400" fill="none">
        <path 
          d="M290 20 C270 50, 220 40, 180 80 C140 120, 160 180, 200 220 C240 260, 220 320, 160 350 C100 380, 20 350, 10 300" 
          stroke="#D97706" 
          strokeWidth="2.5" 
          strokeDasharray="8 6" 
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrow head */}
        <path d="M15 305 L10 300 L5 305" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 308 L10 300" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>

      {/* Central Spiral Accent */}
      <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] hidden xl:block opacity-20" viewBox="0 0 600 600" fill="none">
        <path 
          d="M300 100 C400 120, 480 180, 480 280 C480 380, 400 450, 300 480 C200 510, 120 460, 100 360 C80 260, 140 180, 240 160 C340 140, 380 200, 380 280 C380 360, 320 400, 260 400" 
          stroke="#B45309" 
          strokeWidth="1.5" 
          strokeDasharray="4 8" 
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Background Decorations - Light */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-200/20 to-yellow-200/15 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-orange-200/20 to-amber-200/15 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-yellow-100/20 to-amber-100/15 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
        backgroundSize: '32px 32px'
      }}></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-amber-300 px-5 py-2.5 rounded-full mb-6 shadow-lg shadow-amber-200/40">
            <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-amber-700">Real Stories, Real Results</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-5">
            Success{' '}
            <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent">Stories</span>
          </h2>
          <p className="text-lg text-amber-800/70 max-w-2xl mx-auto">
            Hear from professionals who found their perfect match through our platform
          </p>
        </div>
        
        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={testimonial.name} 
              testimonial={testimonial} 
              index={index} 
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <a 
            href="#" 
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white font-semibold px-8 py-4 rounded-full shadow-xl shadow-amber-400/40 hover:shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 group"
          >
            <span>Join Our Community</span>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
