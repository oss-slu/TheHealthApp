import React from 'react';
import { Link } from 'react-router-dom';

const Timeline = ({ items = [], emptyLabel, className = '' }) => {
  if (!items.length) {
    return (
      <p className={`text-sm text-[var(--text-secondary)] ${className}`} data-testid="timeline-empty">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ol
      className={`relative space-y-4 border-s border-[var(--surface-border)] ps-5 ${className}`}
      data-testid="timeline"
    >
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className="absolute -start-[1.4rem] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-base ring-2 ring-[var(--surface-border)]"
            role="img"
            aria-label={item.iconLabel || undefined}
          >
            {item.icon || '•'}
          </span>

          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {item.title}
          </p>

          {item.description && (
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              {item.description}
            </p>
          )}

          {item.meta && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {item.meta}
            </p>
          )}

          {item.href && item.linkLabel && (
            <Link
              to={item.href}
              className="mt-2 inline-block text-sm font-semibold text-[var(--text-link)] underline underline-offset-2"
            >
              {item.linkLabel}
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
};

export default Timeline;