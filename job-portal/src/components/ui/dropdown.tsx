import React, { useState, useRef, useEffect } from 'react';
interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  onOpen?: () => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'right',
  className = '',
  onOpen
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevIsOpenRef = useRef(false);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Only call onOpen when transitioning from closed to open
    if (isOpen && !prevIsOpenRef.current && onOpen) {
      onOpen();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, onOpen]);

  const getAlignmentClasses = () => {
    switch (align) {
      case 'left':
        return 'left-0';
      case 'center':
        return 'left-1/2 transform -translate-x-1/2';
      case 'right':
      default:
        return 'right-0';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {/* Dropdown content */}
      {isOpen && (
        <div className={`absolute top-full mt-2 ${getAlignmentClasses()} z-50 ${className}`}>
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownContentProps {
  children: React.ReactNode;
  className?: string;
}
export const DropdownContent: React.FC<DropdownContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {children}
    </div>
  );
};

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  className = ''
}) => {
  return (
    <div
      className={`cursor-pointer hover:bg-gray-50 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface DropdownHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownHeader: React.FC<DropdownHeaderProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};