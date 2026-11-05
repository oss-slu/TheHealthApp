import React from 'react';
import { getHealthStatusClasses } from '../utils/healthStatusClasses';

const HealthBadge = ({ status = 'neutral', label, children, className = '' }) => {
  const badgeStyle = getHealthStatusClasses(status);

  return (
    <span
      role="status"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      {label || children}
    </span>
  );
};

export default HealthBadge;