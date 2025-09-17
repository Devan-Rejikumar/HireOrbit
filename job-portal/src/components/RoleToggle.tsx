import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Building2 } from 'lucide-react';
import { Role } from '@/context/AuthContext';

interface RoleToggleProps {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleToggle: React.FC<RoleToggleProps> = ({ role, setRole }) => {
  return (
    <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-lg">
      <Button
        type="button"
        variant={role === 'jobseeker' ? 'default' : 'ghost'}
        onClick={() => setRole('jobseeker')}
        className={`flex-1 h-10 transition-all duration-200 ${
          role === 'jobseeker'
            ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
        }`}
      >
        <User className="w-4 h-4 mr-2" />
        Job Seeker
      </Button>
      <Button
        type="button"
        variant={role === 'company' ? 'default' : 'ghost'}
        onClick={() => setRole('company')}
        className={`flex-1 h-10 transition-all duration-200 ${
          role === 'company'
            ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
        }`}
      >
        <Building2 className="w-4 h-4 mr-2" />
        Company
      </Button>
    </div>
  );
};

export default RoleToggle;