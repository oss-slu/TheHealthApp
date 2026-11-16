import React from 'react';

const Timeline = ({ items = [], emptyLabel, className = '' }) => {
  if (!items.length) {
    return (
      <p className={`text-sm text-[var(--text-secondary)] ${className}`} data-testid="timeline-empty">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ol className={`relative space-y-4 border-s border-[var(--surface-border)] ps-5 ${className}`} data-testid="timeline">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className="absolute -start-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--focus-ring)] ring-4 ring-[var(--surface-elevated)]"
            aria-hidden
          />
          <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
          {item.description && (
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{item.description}</p>
          )}
          {item.meta && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.meta}</p>
          )}
        </li>
      ))}
    </ol>
  );
};

export default Timeline;
