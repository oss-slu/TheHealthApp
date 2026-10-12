import React, { useEffect, useId, useRef } from 'react';

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  tone = 'critical',
}) => {
  const titleId = useId();
  const descId = useId();
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const confirmClass =
    tone === 'critical'
      ? 'bg-[var(--color-status-critical)] text-white'
      : 'bg-[var(--color-brand-600)] text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="surface-elevated w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-xl font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-2 text-sm text-[var(--text-secondary)]">
            {description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
