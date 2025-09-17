
import { Card, CardContent } from '@/components/ui/card';

const companies = [
  { name: 'TechCorp', logo: '🏢', jobs: 45 },
  { name: 'InnovateLab', logo: '🚀', jobs: 32 },
  { name: 'DesignStudio', logo: '🎨', jobs: 28 },
  { name: 'DataWorks', logo: '📊', jobs: 41 },
  { name: 'CloudTech', logo: '☁️', jobs: 37 },
  { name: 'StartupXYZ', logo: '⚡', jobs: 23 },
];

const CompanyShowcase = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Top Companies Hiring</h2>
          <p className="text-xl text-gray-300">Join industry leaders and innovative startups</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {companies.map((company, index) => (
            <Card key={company.name} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {company.logo}
                </div>
                <h3 className="font-bold text-white mb-2">{company.name}</h3>
                <p className="text-gray-300 text-sm">{company.jobs} open positions</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyShowcase;
