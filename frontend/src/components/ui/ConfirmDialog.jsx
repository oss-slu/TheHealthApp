import React, { useEffect, useId, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

const ConfirmDialog = ({
  open,
  title,
  description,
  children = null,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  tone = 'critical',
  // 'cancel' suits destructive actions, so pressing Enter straight away does nothing harmful.
  initialFocus = 'confirm',
}) => {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const target = initialFocus === 'cancel' ? cancelRef.current : confirmRef.current;
    target?.focus();
  }, [open, initialFocus]);

  if (!open) return null;

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel?.();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    // Keep keyboard focus inside the modal.
    const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

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
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="surface-elevated w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId} className="font-display text-xl font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        {description && (
          <div id={descId} className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
            {description}
          </div>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--focus-ring)] ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
