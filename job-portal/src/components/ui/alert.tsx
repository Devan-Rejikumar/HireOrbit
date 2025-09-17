import * as React from 'react';

export function Alert({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="alert" className={`relative w-full rounded-lg border p-4 ${className}`} {...props} />
  );
}

export function AlertDescription({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`text-sm ${className}`} {...props} />;
} 