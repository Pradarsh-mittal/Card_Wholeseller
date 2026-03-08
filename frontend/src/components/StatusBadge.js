import React from 'react';

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'status-badge status-pending'
  },
  approved: {
    label: 'Approved',
    className: 'status-badge status-approved'
  },
  rejected: {
    label: 'Rejected',
    className: 'status-badge status-rejected'
  },
  design_sent: {
    label: 'Design Sent',
    className: 'status-badge status-design-sent'
  },
  design_approved: {
    label: 'Design Approved',
    className: 'status-badge status-approved'
  },
  revision_requested: {
    label: 'Revision Requested',
    className: 'status-badge status-revision'
  },
  completed: {
    label: 'Completed',
    className: 'status-badge status-completed'
  }
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || {
    label: status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
    className: 'status-badge bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span className={config.className} data-testid={`status-badge-${status}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
