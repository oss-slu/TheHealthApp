import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, renderWithRTL, screen, userEvent, waitFor, within } from '../../test/test-utils';
import { integrationService } from '../../services/integrationService';
import ConnectedHealthApps from './ConnectedHealthApps';
import commonEn from '../../../public/locales/en/common.json';
import commonAr from '../../../public/locales/ar/common.json';
import commonEs from '../../../public/locales/es/common.json';
import commonHi from '../../../public/locales/hi/common.json';
import commonZh from '../../../public/locales/zh/common.json';

vi.mock('../../services/integrationService', () => ({
  integrationService: {
    listConnections: vi.fn(),
    disconnect: vi.fn(),
    deleteImportedData: vi.fn(),
  },
}));

const appleHealth = {
  id: 'conn-apple',
  provider: 'apple_health',
  granted_types: ['heart_rate', 'body_weight'],
  status: 'connected',
  connected_at: '2026-10-01T12:00:00Z',
  disconnected_at: null,
  updated_at: '2026-10-01T12:00:00Z',
  imported_count: 12,
};

const disconnectedAndroid = {
  id: 'conn-android',
  provider: 'health_connect',
  granted_types: ['steps'],
  status: 'disconnected',
  connected_at: '2026-09-01T12:00:00Z',
  disconnected_at: '2026-09-15T12:00:00Z',
  updated_at: '2026-09-15T12:00:00Z',
  imported_count: 0,
};

const card = (name) => screen.getByRole('heading', { name }).closest('li');

const renderLoaded = async (connections = [appleHealth]) => {
  integrationService.listConnections.mockResolvedValue(connections);
  const user = userEvent.setup();
  const view = renderWithProviders(<ConnectedHealthApps />);
  await screen.findByRole('heading', { name: 'Connected health apps' });
  if (connections.length) await screen.findByRole('list');
  return { user, ...view };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ConnectedHealthApps loading states', () => {
  it('shows a loading message, then explains when nothing is connected', async () => {
    let resolve;
    integrationService.listConnections.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderWithProviders(<ConnectedHealthApps />);

    expect(screen.getByText('Loading connected apps...')).toBeInTheDocument();

    resolve([]);
    expect(
      await screen.findByText('You have not connected any health apps, so no data has been imported.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('announces a load failure and recovers on retry', async () => {
    integrationService.listConnections
      .mockRejectedValueOnce({ status: 500 })
      .mockResolvedValueOnce([appleHealth]);
    const user = userEvent.setup();
    renderWithProviders(<ConnectedHealthApps />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not load your connected health apps.');

    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Apple Health' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('always explains what connected apps can access and what deleting does', async () => {
    await renderLoaded();

    expect(screen.getByRole('region', { name: 'Connected health apps' })).toHaveAccessibleDescription(
      /only read the types of data you allowed.*removes it from this app only/,
    );
  });
});

describe('ConnectedHealthApps connection details', () => {
  it('lists provider, status, allowed data and how much was imported', async () => {
    await renderLoaded([appleHealth, disconnectedAndroid]);

    const apple = within(card('Apple Health'));
    expect(apple.getByText('Connected')).toBeInTheDocument();
    expect(apple.getByText('Allowed data: Heart rate, Body weight')).toBeInTheDocument();
    expect(apple.getByText('12 imported records')).toBeInTheDocument();
    expect(apple.getByRole('button', { name: 'Disconnect Apple Health' })).toBeEnabled();
    expect(apple.getByRole('button', { name: 'Delete imported data from Apple Health' })).toBeEnabled();

    const android = within(card('Health Connect'));
    expect(android.getByText('Disconnected')).toBeInTheDocument();
    expect(android.getByText(/^Disconnected on /)).toBeInTheDocument();
    expect(android.getByText('No imported data')).toBeInTheDocument();
    expect(android.queryByRole('button', { name: /Disconnect/ })).not.toBeInTheDocument();
    expect(android.getByRole('button', { name: 'Delete imported data from Health Connect' })).toBeDisabled();
  });

  it('uses the singular form for one imported record', async () => {
    await renderLoaded([{ ...appleHealth, imported_count: 1 }]);

    expect(screen.getByText('1 imported record')).toBeInTheDocument();
  });
});

describe('ConnectedHealthApps disconnect flow', () => {
  it('asks for confirmation, focusing Cancel, and changes nothing when cancelled', async () => {
    const { user } = await renderLoaded();
    const trigger = screen.getByRole('button', { name: 'Disconnect Apple Health' });

    await user.click(trigger);

    const dialog = screen.getByRole('alertdialog', { name: 'Disconnect Apple Health?' });
    expect(dialog).toHaveAccessibleDescription(/stop sending new data.*stays in your account/);
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(integrationService.disconnect).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes the dialog with Escape', async () => {
    const { user } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Disconnect Apple Health' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(integrationService.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects but keeps imported data by default', async () => {
    integrationService.disconnect.mockResolvedValue({
      connection: { ...appleHealth, status: 'disconnected', disconnected_at: '2026-11-14T10:00:00Z' },
      deleted_count: 0,
    });
    const { user } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Disconnect Apple Health' }));
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(integrationService.disconnect).toHaveBeenCalledWith('conn-apple', { deleteImportedData: false });
    expect(await screen.findByText('Apple Health has been disconnected. No new data will be imported.')).toBeInTheDocument();
    const apple = within(card('Apple Health'));
    expect(apple.getByText('Disconnected')).toBeInTheDocument();
    expect(apple.getByText('12 imported records')).toBeInTheDocument();
    expect(apple.queryByRole('button', { name: /Disconnect/ })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Apple Health' })).toHaveFocus());
  });

  it('can delete imported data in the same step', async () => {
    integrationService.disconnect.mockResolvedValue({
      connection: { ...appleHealth, status: 'disconnected', imported_count: 0 },
      deleted_count: 12,
    });
    const { user } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Disconnect Apple Health' }));
    await user.click(
      screen.getByRole('checkbox', { name: 'Also delete the 12 records already imported from Apple Health' }),
    );
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(integrationService.disconnect).toHaveBeenCalledWith('conn-apple', { deleteImportedData: true });
    expect(
      await screen.findByText('Apple Health has been disconnected and 12 imported records were deleted.'),
    ).toBeInTheDocument();
    expect(within(card('Apple Health')).getByText('No imported data')).toBeInTheDocument();
  });

  it('does not offer to delete data when nothing was imported', async () => {
    const { user } = await renderLoaded([{ ...appleHealth, imported_count: 0 }]);

    await user.click(screen.getByRole('button', { name: 'Disconnect Apple Health' }));

    expect(within(screen.getByRole('alertdialog')).queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('announces a failure and reloads the list from the server', async () => {
    integrationService.disconnect.mockRejectedValue({ status: 500 });
    const { user } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Disconnect Apple Health' }));
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not disconnect Apple Health.');
    await waitFor(() => expect(integrationService.listConnections).toHaveBeenCalledTimes(2));
  });

  it('explains when the connection no longer exists', async () => {
    integrationService.disconnect.mockRejectedValue({ status: 404 });
    const { user } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Disconnect Apple Health' }));
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This connection no longer exists.');
  });
});

describe('ConnectedHealthApps delete imported data flow', () => {
  it('warns that deletion is permanent and that a connected app may import again', async () => {
    const { user } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Delete imported data from Apple Health' }));

    const dialog = screen.getByRole('alertdialog', { name: 'Delete data imported from Apple Health?' });
    expect(dialog).toHaveTextContent('permanently deletes 12 records imported from Apple Health');
    expect(dialog).toHaveTextContent('Data you entered yourself is not affected');
    expect(dialog).toHaveTextContent('Apple Health is still connected');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('leaves out the still-connected warning for a disconnected app', async () => {
    const { user } = await renderLoaded([{ ...disconnectedAndroid, imported_count: 3 }]);

    await user.click(screen.getByRole('button', { name: 'Delete imported data from Health Connect' }));

    expect(screen.getByRole('alertdialog')).not.toHaveTextContent('still connected');
  });

  it('deletes imported data and reports how many records were removed', async () => {
    integrationService.deleteImportedData.mockResolvedValue({
      connection: { ...appleHealth, imported_count: 0 },
      deleted_count: 12,
    });
    const { user } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Delete imported data from Apple Health' }));
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    expect(integrationService.deleteImportedData).toHaveBeenCalledWith('conn-apple');
    expect(await screen.findByText('Deleted 12 records imported from Apple Health.')).toBeInTheDocument();
    const apple = within(card('Apple Health'));
    expect(apple.getByText('Connected')).toBeInTheDocument();
    expect(apple.getByText('No imported data')).toBeInTheDocument();
    expect(apple.getByRole('button', { name: 'Delete imported data from Apple Health' })).toBeDisabled();
  });

  it('reports when there was nothing left to delete', async () => {
    integrationService.deleteImportedData.mockResolvedValue({
      connection: { ...appleHealth, imported_count: 0 },
      deleted_count: 0,
    });
    const { user } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Delete imported data from Apple Health' }));
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    expect(await screen.findByText('There was no data imported from Apple Health to delete.')).toBeInTheDocument();
  });

  it('announces a failure', async () => {
    integrationService.deleteImportedData.mockRejectedValue({ status: 500 });
    const { user } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Delete imported data from Apple Health' }));
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not delete the data imported from Apple Health.',
    );
  });
});

describe('ConnectedHealthApps localization', () => {
  it('renders right-to-left in Arabic with Arabic plural forms', async () => {
    integrationService.listConnections.mockResolvedValue([{ ...appleHealth, imported_count: 2 }]);
    renderWithRTL(<ConnectedHealthApps />);

    expect(await screen.findByRole('heading', { name: 'تطبيقات الصحة المتصلة' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByText('سجلان مستوردان')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'قطع الاتصال بـ Apple Health' })).toBeInTheDocument();
  });

  it.each([
    ['ar', commonAr],
    ['es', commonEs],
    ['hi', commonHi],
    ['zh', commonZh],
  ])('%s translates every connected-apps string', (_lang, common) => {
    // Plural suffixes differ by language, so compare the base keys.
    const baseKeys = (strings) =>
      [...new Set(Object.keys(strings).map((key) => key.replace(/_(zero|one|two|few|many|other)$/, '')))].sort();

    expect(baseKeys(common.connectedApps)).toEqual(baseKeys(commonEn.connectedApps));
    expect(Object.keys(common.connectedApps.measurementTypes).sort()).toEqual(
      Object.keys(commonEn.connectedApps.measurementTypes).sort(),
    );
    for (const [key, value] of Object.entries(common.connectedApps)) {
      if (typeof value === 'string' && key.endsWith('_other') && commonEn.connectedApps[key]?.includes('{{count}}')) {
        // Every "other" plural form must show the number.
        expect(value).toContain('{{count}}');
      }
    }
  });
});
