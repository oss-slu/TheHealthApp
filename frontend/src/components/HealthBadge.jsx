import React from 'react';
import { getHealthStatusClasses } from '../utils/healthStatusClasses';

const HealthBadge = ({ id, status = 'neutral', label, children, className = '', ...rest }) => {
  const badgeStyle = getHealthStatusClasses(status);

  return (
    <span
      id={id}
      role="status"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
      {...rest}
    >
      {label || children}
    </span>
  );
};

export default HealthBadge;