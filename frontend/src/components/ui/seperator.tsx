import React from 'react';

interface SeparatorProps {
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({ className = '' }) => (
  <hr className={`border-t border-slate-200 ${className}`} />
);

export default Separator;