import React from 'react';
import { UserRole } from '../../types/index.js';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  const roleDisplay: Record<UserRole, { label: string; bg: string; text: string; border: string }> = {
    super_admin: {
      label: 'Super Admin',
      bg: 'bg-purple-900/10',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    admin: {
      label: 'Administrator',
      bg: 'bg-red-900/10',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    organization: {
      label: 'Relief NGO / Org',
      bg: 'bg-blue-900/10',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    provider: {
      label: 'Resource Provider',
      bg: 'bg-orange-900/10',
      text: 'text-orange-700',
      border: 'border-orange-200',
    },
    volunteer: {
      label: 'Volunteer Coordinator',
      bg: 'bg-teal-900/10',
      text: 'text-teal-700',
      border: 'border-teal-200',
    },
    seeker: {
      label: 'Resource Seeker',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    guest: {
      label: 'Public Visitor',
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-200',
    },
  };

  const config = roleDisplay[role] || roleDisplay.seeker;

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
};
