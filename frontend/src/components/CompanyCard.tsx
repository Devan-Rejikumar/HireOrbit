import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CompanyCardProps {
  companyName: string;
  companyId?: string;
  location?: string;
  industry?: string;
  description?: string;
  jobCount: number;
  logo?: string;
  tags?: string[];
  onClick?: () => void;
}

export const CompanyCard = ({ 
  companyName, 
  companyId,
  location, 
  industry,
  description,
  jobCount,
  logo,
  tags = [],
  onClick,
}: CompanyCardProps) => {
  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-purple-300 bg-white"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Company Logo */}
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            {logo ? (
              <img src={logo} alt={companyName} className="w-full h-full rounded-lg object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">
                {companyName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Job Count Badge */}
          <Badge className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {jobCount} {jobCount === 1 ? 'Job' : 'Jobs'}
          </Badge>
        </div>

        {/* Company Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
          {companyName}
        </h3>

        {/* Description */}
        {description ? (
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {description}
          </p>
        ) : (
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {companyName} is actively hiring and looking for talented professionals to join their team.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

