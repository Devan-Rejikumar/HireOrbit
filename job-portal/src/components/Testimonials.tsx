
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Software Engineer',
    company: 'TechCorp',
    image: '👩‍💻',
    content: 'I found my dream job within 2 weeks! The platform made it so easy to connect with the right employers.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Product Designer',
    company: 'DesignStudio',
    image: '👨‍🎨',
    content: 'Amazing experience! The quality of job listings and the application process is top-notch.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Marketing Manager',
    company: 'StartupXYZ',
    image: '👩‍💼',
    content: 'This platform changed my career trajectory. I\'m now working at my ideal company!',
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
          <p className="text-xl text-gray-600">Hear from professionals who found their perfect match</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.name} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">{testimonial.image}</div>
                
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
