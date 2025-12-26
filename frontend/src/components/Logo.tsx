import { useState } from 'react';
import { useBranding } from '@/context/BrandingContext';
import { Briefcase } from 'lucide-react';

interface LogoProps {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fallbackIcon?: 'briefcase' | 'letter';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  textClassName = '',
  iconClassName = '',
  showText = true,
  size = 'md',
  fallbackIcon = 'briefcase',
}) => {
  const { settings } = useBranding();
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', iconSize: 'h-4 w-4' },
    md: { icon: 'w-8 h-8', text: 'text-xl', iconSize: 'h-5 w-5' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', iconSize: 'h-6 w-6' },
  };

  const currentSize = sizeClasses[size];
  const defaultIconClass = `bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center ${iconClassName || ''}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {settings?.logoUrl && !imageError ? (
        <img
          src={settings.logoUrl}
          alt={settings.companyName || 'Company Logo'}
          className={`${currentSize.icon} rounded-full object-cover`}
          onError={() => {
            setImageError(true);
          }}
        />
      ) : (
        <div className={`${currentSize.icon} rounded-full ${defaultIconClass}`}>
          {fallbackIcon === 'letter' ? (
            <span className="text-white font-bold" style={{ fontSize: size === 'sm' ? '0.875rem' : size === 'md' ? '1rem' : '1.25rem' }}>
              {settings?.companyName?.[0]?.toUpperCase() || 'H'}
            </span>
          ) : (
            <Briefcase className={`${currentSize.iconSize} text-white`} />
          )}
        </div>
      )}
      {showText && (
        <h1 className={`${currentSize.text} font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent ${textClassName}`}>
          {settings?.companyName || 'HireOrbit'}
        </h1>
      )}
    </div>
  );
};

