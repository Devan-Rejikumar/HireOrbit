
import { Code, Heart, Briefcase, Palette, Calculator, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
  { name: 'Technology', icon: Code, jobs: '15,420', color: 'from-blue-500 to-cyan-500' },
  { name: 'Healthcare', icon: Heart, jobs: '8,750', color: 'from-red-500 to-pink-500' },
  { name: 'Business', icon: Briefcase, jobs: '12,340', color: 'from-green-500 to-emerald-500' },
  { name: 'Design', icon: Palette, jobs: '5,680', color: 'from-purple-500 to-violet-500' },
  { name: 'Finance', icon: Calculator, jobs: '7,920', color: 'from-yellow-500 to-orange-500' },
  { name: 'Logistics', icon: Truck, jobs: '4,560', color: 'from-indigo-500 to-blue-500' },
];

const JobCategories = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Browse Jobs by Category</h2>
          <p className="text-xl text-gray-600">Discover opportunities in your field of expertise</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Card key={category.name} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${category.color} p-6 text-white`}>
                  <category.icon className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                  <p className="text-white/90">{category.jobs} open positions</p>
                </div>
                <div className="p-6 bg-white">
                  <p className="text-gray-600">Explore all {category.name.toLowerCase()} opportunities</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobCategories;
