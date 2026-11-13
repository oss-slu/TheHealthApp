import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  LoadingState,
  EmptyState,
  ErrorAlert,
  Metric,
  Timeline,
  ConfirmDialog,
} from './index';

const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      common: { pleaseWait: 'Please wait...' },
    },
  },
});

function renderUi(ui) {
  return render(<I18nextProvider i18n={testI18n}>{ui}</I18nextProvider>);
}

describe('Reusable health UI components', () => {
  it('LoadingState exposes polite busy status', () => {
    renderUi(<LoadingState />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('EmptyState renders title, description, and action', () => {
    renderUi(
      <EmptyState
        title="Nothing here"
        description="Try again later"
        action={<button type="button">Go</button>}
      />
    );
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('ErrorAlert uses assertive live region and retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderUi(
      <ErrorAlert title="Failed" onRetry={onRetry} retryLabel="Retry">
        Network down
      </ErrorAlert>
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText('Network down')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('Metric exposes status token attribute', () => {
    renderUi(<Metric label="Risk" value="12%" status="risk" hint="Elevated" />);
    const metric = screen.getByTestId('metric');
    expect(metric).toHaveAttribute('data-status', 'risk');
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByText('Elevated')).toBeInTheDocument();
  });

  it('Timeline renders ordered items and empty state', () => {
    const { rerender } = renderUi(<Timeline items={[]} emptyLabel="No events" />);
    expect(screen.getByTestId('timeline-empty')).toHaveTextContent('No events');

    rerender(
      <I18nextProvider i18n={testI18n}>
        <Timeline
          items={[
            { id: '1', title: 'Assessment done', description: 'Framingham', meta: 'Today' },
          ]}
        />
      </I18nextProvider>
    );
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
    expect(screen.getByText('Assessment done')).toBeInTheDocument();
  });

  it('ConfirmDialog is an accessible alertdialog when open', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderUi(
      <ConfirmDialog
        open
        title="Archive prescription?"
        description="This cannot be undone."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Archive' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('ConfirmDialog renders nothing when closed', () => {
    renderUi(
      <ConfirmDialog
        open={false}
        title="Hidden"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
