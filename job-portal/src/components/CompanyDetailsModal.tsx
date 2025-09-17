import React from 'react';
import { X, Building2, MapPin, Globe, Phone, Mail, Calendar, Users, Link as LinkIcon, Info } from 'lucide-react';

type Company = {
  id: string;
  companyName: string;
  email: string;
  industry?: string;
  size?: string;
  description?: string;
  website?: string;
  foundedYear?: string | number | Date;
  headquarters?: string;
  phone?: string;
  linkedinUrl?: string;
};

type CompanyDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
};

const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({ isOpen, onClose, company }) => {
  if (!isOpen) return null;

  const founded = (() => {
    const fy = company?.foundedYear;
    if (fy === undefined || fy === null) return 'N/A';
    // If number like 1990
    if (typeof fy === 'number') {
      if (fy > 1700 && fy < 3000) return String(fy);
      // Otherwise assume ms timestamp
      const d = new Date(fy);
      return isNaN(d.getTime()) ? 'N/A' : d.getUTCFullYear().toString();
    }
    // If string
    if (typeof fy === 'string') {
      const trimmed = fy.trim();
      // 4-digit year string
      if (/^\d{4}$/.test(trimmed)) return trimmed;
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? trimmed : d.getUTCFullYear().toString();
    }
    // If Date
    if (fy instanceof Date) {
      return isNaN(fy.getTime()) ? 'N/A' : fy.getUTCFullYear().toString();
    }
    return 'N/A';
  })();

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto h-full w-full max-w-xl bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Company Details</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-64px)]">
          {/* Name & Description */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{company?.companyName || 'N/A'}</h2>
            {company?.description ? (
              <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-wrap">{company.description}</p>
            ) : (
              <p className="mt-2 text-gray-500 italic flex items-center gap-2"><Info className="h-4 w-4" /> No description provided</p>
            )}
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailItem icon={<Users className="h-4 w-4" />} label="Industry" value={company?.industry} />
            <DetailItem icon={<Users className="h-4 w-4" />} label="Company Size" value={company?.size} />
            <DetailItem icon={<Calendar className="h-4 w-4" />} label="Founded" value={founded} />
            <DetailItem icon={<MapPin className="h-4 w-4" />} label="Headquarters" value={company?.headquarters} />
            <DetailItem icon={<Mail className="h-4 w-4" />} label="Email" value={company?.email} />
            <DetailItem icon={<Phone className="h-4 w-4" />} label="Phone" value={company?.phone} />
            <DetailItem icon={<Globe className="h-4 w-4" />} label="Website" value={company?.website} isLink />
            <DetailItem icon={<LinkIcon className="h-4 w-4" />} label="LinkedIn" value={company?.linkedinUrl} isLink />
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | null; isLink?: boolean }>
  = ({ icon, label, value, isLink }) => {
  const display = value && `${value}`.trim() !== '' ? `${value}` : 'N/A';
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2 mb-1">
        {icon}
        {label}
      </div>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
          {value}
        </a>
      ) : (
        <div className="text-gray-900 break-words">{display}</div>
      )}
    </div>
  );
};

export default CompanyDetailsModal;


