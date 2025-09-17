import React from 'react';
import { FormField } from './FormField';

interface ExperienceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export const ExperienceSelector: React.FC<ExperienceSelectorProps> = ({
  value,
  onChange,
  error,
  className,
}) => {
  const experienceOptions = [
    { value: 'fresher', label: 'Fresher (0 years)' },
    { value: '0-1', label: '0-1 years' },
    { value: '1-2', label: '1-2 years' },
    { value: '2-3', label: '2-3 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5-7', label: '5-7 years' },
    { value: '7-10', label: '7-10 years' },
    { value: '10+', label: '10+ years' },
  ];

  return (
    <FormField label="Experience Level" required error={error} className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select your experience level</option>
        {experienceOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};