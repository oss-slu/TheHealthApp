import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Prescription from '../pages/modules/Prescription';
import { prescriptionService } from '../services/prescriptionService';
import { renderWithProviders } from './test-utils';

vi.mock('../services/prescriptionService', () => ({
  prescriptionService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    recordDose: vi.fn(),
    getDoseHistory: vi.fn(),
    getReminder: vi.fn(),
    createReminder: vi.fn(),
    updateReminder: vi.fn(),
  },
}));

const activePrescription = {
  id: 'prescription-1',
  medication_name: 'Lisinopril',
  dosage: '10 mg',
  frequency: 'Once daily',
  next_dose: null,
};

const renderPrescriptionForAdherence = async (options = {}) => {
  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.getDoseHistory.mockResolvedValue([]);

  renderWithProviders(<Prescription />, options);

  await screen.findByText('Lisinopril');
};

const localTimeOffset = (minutes) => {
  const date = new Date(Date.now() + minutes * 60 * 1000);

  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

describe('Prescription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prescriptionService.getAll.mockResolvedValue([]);
  });

  it('loads and displays active prescriptions', async () => {
    prescriptionService.getAll.mockResolvedValue([activePrescription]);

    renderWithProviders(<Prescription />);

    expect(
      await screen.findByText('Lisinopril')
    ).toBeInTheDocument();

    expect(screen.getByText(/10 mg/)).toBeInTheDocument();
    expect(screen.getByText(/Once daily/)).toBeInTheDocument();

    expect(prescriptionService.getAll).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when there are no active prescriptions', async () => {
  prescriptionService.getAll.mockResolvedValue([]);

  renderWithProviders(<Prescription />);

  expect(
    await screen.findByText('noActivePrescriptions')
  ).toBeInTheDocument();

  expect(prescriptionService.getAll).toHaveBeenCalledTimes(1);
});

it('opens and submits the add prescription form', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll
  .mockResolvedValueOnce([])
  .mockResolvedValueOnce([activePrescription]);
  prescriptionService.create.mockResolvedValue({});

  renderWithProviders(<Prescription />);

  await user.click(
    screen.getByRole('button', { name: 'addNewPrescription' })
  );

  await user.type(
    screen.getByPlaceholderText('medicationName'),
    'Aspirin'
  );

  await user.type(
    screen.getByPlaceholderText('dosage'),
    '81 mg'
  );

  await user.type(
    screen.getByPlaceholderText('frequency'),
    'Once daily'
  );

  await user.click(
    screen.getByRole('button', { name: /savePrescription/i })
  );

  await waitFor(() => {
    expect(prescriptionService.create).toHaveBeenCalledWith({
      medication_name: 'Aspirin',
      dosage: '81 mg',
      frequency: 'Once daily',
    });
  });

  await waitFor(() => {
  expect(prescriptionService.getAll).toHaveBeenCalledTimes(2);
});

});

it('opens and submits the edit prescription form', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll
  .mockResolvedValueOnce([activePrescription])
  .mockResolvedValueOnce([{
    ...activePrescription,
    dosage: '20 mg',
  }]);
  prescriptionService.update.mockResolvedValue({});

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'edit' })
  );

  const dosageInput = screen.getByDisplayValue('10 mg');

  await user.clear(dosageInput);
  await user.type(dosageInput, '20 mg');

  await user.click(
    screen.getByRole('button', { name: /savePrescription/i })
  );

  await waitFor(() => {
    expect(prescriptionService.update).toHaveBeenCalledWith(
      'prescription-1',
      {
        medication_name: 'Lisinopril',
        dosage: '20 mg',
        frequency: 'Once daily',
      }
    );
  });

  await waitFor(() => {
  expect(prescriptionService.getAll).toHaveBeenCalledTimes(2);
});

});

it('confirms and archives a prescription, then refreshes the list', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll
    .mockResolvedValueOnce([activePrescription])
    .mockResolvedValueOnce([]);

  prescriptionService.archive.mockResolvedValue({});

  vi.spyOn(window, 'confirm').mockReturnValue(true);

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'archive' })
  );

  expect(window.confirm).toHaveBeenCalled();

  await waitFor(() => {
    expect(prescriptionService.archive).toHaveBeenCalledWith(
      'prescription-1'
    );
  });

  await waitFor(() => {
    expect(prescriptionService.getAll).toHaveBeenCalledTimes(2);
  });

  expect(
    await screen.findByText('noActivePrescriptions')
  ).toBeInTheDocument();

  window.confirm.mockRestore();
});

it('cancels archive without making an API request', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([activePrescription]);

  vi.spyOn(window, 'confirm').mockReturnValue(false);

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'archive' })
  );

  expect(window.confirm).toHaveBeenCalled();

  expect(prescriptionService.archive).not.toHaveBeenCalled();

  window.confirm.mockRestore();
});

it('shows a visible error and retry option when loading fails', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll
    .mockRejectedValueOnce(new Error('Failed to load'))
    .mockResolvedValueOnce([activePrescription]);

  renderWithProviders(<Prescription />);

  expect(
    await screen.findByText('prescriptionError')
  ).toBeInTheDocument();

  await user.click(
    screen.getByRole('button', { name: 'retry' })
  );

  expect(
    await screen.findByText('Lisinopril')
  ).toBeInTheDocument();

  expect(prescriptionService.getAll).toHaveBeenCalledTimes(2);
});

it('shows an error when creating a prescription fails', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([]);
  prescriptionService.create.mockRejectedValue(
    new Error('Failed to create prescription')
  );

  renderWithProviders(<Prescription />);

  await user.click(
    screen.getByRole('button', { name: 'addNewPrescription' })
  );

  await user.type(
    screen.getByPlaceholderText('medicationName'),
    'Aspirin'
  );

  await user.type(
    screen.getByPlaceholderText('dosage'),
    '81 mg'
  );

  await user.type(
    screen.getByPlaceholderText('frequency'),
    'Once daily'
  );

  await user.click(
    screen.getByRole('button', { name: /savePrescription/i })
  );

  const createAlerts = await screen.findAllByRole('alert');
  expect(
    createAlerts.map((alert) => alert.textContent ?? '')
  ).toEqual(
    expect.arrayContaining([
      expect.stringContaining('Failed to create prescription'),
    ])
  );

  expect(prescriptionService.create).toHaveBeenCalledWith({
    medication_name: 'Aspirin',
    dosage: '81 mg',
    frequency: 'Once daily',
  });
});

it('shows a validation message when the backend rejects a prescription', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([]);
  prescriptionService.create.mockRejectedValue({
    status: 422,
    message: 'Validation failed',
  });

  renderWithProviders(<Prescription />);

  await user.click(
    screen.getByRole('button', { name: 'addNewPrescription' })
  );

  await user.type(
    screen.getByPlaceholderText('medicationName'),
    'Aspirin'
  );

  await user.type(
    screen.getByPlaceholderText('dosage'),
    '81 mg'
  );

  await user.type(
    screen.getByPlaceholderText('frequency'),
    'Once daily'
  );

  await user.click(
    screen.getByRole('button', { name: /savePrescription/i })
  );

  const validationAlerts = await screen.findAllByRole('alert');
  expect(
    validationAlerts.map((alert) => alert.textContent ?? '')
  ).toEqual(
    expect.arrayContaining([
      expect.stringContaining('prescriptionValidationError'),
    ])
  );
});

it('shows an error when updating a prescription fails', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.update.mockRejectedValue(
    new Error('Failed to update prescription')
  );

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'edit' })
  );

  const dosageInput = screen.getByDisplayValue('10 mg');

  await user.clear(dosageInput);
  await user.type(dosageInput, '20 mg');

  await user.click(
    screen.getByRole('button', { name: /savePrescription/i })
  );

  const updateAlerts = await screen.findAllByRole('alert');
  expect(
    updateAlerts.map((alert) => alert.textContent ?? '')
  ).toEqual(
    expect.arrayContaining([
      expect.stringContaining('Failed to update prescription'),
    ])
  );

  expect(prescriptionService.update).toHaveBeenCalledWith(
    'prescription-1',
    {
      medication_name: 'Lisinopril',
      dosage: '20 mg',
      frequency: 'Once daily',
    }
  );
});

it('shows a validation message when the backend rejects a prescription update', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.update.mockRejectedValue({
    status: 422,
    message: 'Validation failed',
  });

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'edit' })
  );

  const dosageInput = screen.getByDisplayValue('10 mg');
  await user.clear(dosageInput);
  await user.type(dosageInput, '20 mg');

  await user.click(
    screen.getByRole('button', { name: /savePrescription/i })
  );

  const updateValidationAlerts = await screen.findAllByRole('alert');
  expect(
    updateValidationAlerts.map((alert) => alert.textContent ?? '')
  ).toEqual(
    expect.arrayContaining([
      expect.stringContaining('prescriptionValidationError'),
    ])
  );
});

it('shows an error when archiving a prescription fails', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.archive.mockRejectedValue(
    new Error('Failed to archive prescription')
  );

  vi.spyOn(window, 'confirm').mockReturnValue(true);

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'archive' })
  );

  const archiveAlerts = await screen.findAllByRole('alert');
  expect(
    archiveAlerts.map((alert) => alert.textContent ?? '')
  ).toEqual(
    expect.arrayContaining([
      expect.stringContaining('Failed to archive prescription'),
    ])
  );

  expect(prescriptionService.archive).toHaveBeenCalledWith(
    'prescription-1'
  );

  window.confirm.mockRestore();
});

it('disables the add form save button while saving', async () => {
  const user = userEvent.setup();

  let resolveCreate;

  prescriptionService.getAll.mockResolvedValue([]);
  prescriptionService.create.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveCreate = resolve;
      })
  );

  renderWithProviders(<Prescription />);

  await user.click(
    screen.getByRole('button', { name: 'addNewPrescription' })
  );

  await user.type(
    screen.getByPlaceholderText('medicationName'),
    'Aspirin'
  );

  await user.type(
    screen.getByPlaceholderText('dosage'),
    '81 mg'
  );

  await user.type(
    screen.getByPlaceholderText('frequency'),
    'Once daily'
  );

  const saveButton = screen.getByRole('button', {
    name: /savePrescription/i,
  });

  await user.click(saveButton);

  expect(saveButton).toBeDisabled();

  resolveCreate({});
});

it('disables the edit save button while updating', async () => {
  const user = userEvent.setup();

  let resolveUpdate;

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.update.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveUpdate = resolve;
      })
  );

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'edit' })
  );

  const saveButton = screen.getByRole('button', {
    name: /savePrescription/i,
  });

  await user.click(saveButton);

  expect(saveButton).toBeDisabled();

  resolveUpdate({});
});

it('disables the archive button while archiving', async () => {
  const user = userEvent.setup();

  let resolveArchive;

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.archive.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveArchive = resolve;
      })
  );

  vi.spyOn(window, 'confirm').mockReturnValue(true);

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  const archiveButton = screen.getByRole('button', {
    name: 'archive',
  });

  await user.click(archiveButton);

  expect(archiveButton).toBeDisabled();

  resolveArchive({});

  window.confirm.mockRestore();
});


it('shows a validation message when required fields are blank', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([]);

  renderWithProviders(<Prescription />);

  await user.click(
    screen.getByRole('button', { name: 'addNewPrescription' })
  );

  const saveButton = screen.getByRole('button', {
    name: /savePrescription/i,
  });

  expect(saveButton).toBeEnabled();

  await user.click(saveButton);

  expect(
    await screen.findByRole('alert')
  ).toHaveTextContent('prescriptionRequiredFields');

  expect(prescriptionService.create).not.toHaveBeenCalled();
});

it('disables the edit save button when a required field is blank', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([activePrescription]);

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'edit' })
  );

  const saveButton = screen.getByRole('button', {
    name: /savePrescription/i,
  });

  expect(saveButton).not.toBeDisabled();

  const dosageInput = screen.getByDisplayValue('10 mg');

  await user.clear(dosageInput);

  expect(saveButton).toBeDisabled();

  expect(prescriptionService.update).not.toHaveBeenCalled();
});


it.each([
  {
    status: 'taken',
    buttonName: 'Mark Lisinopril as taken',
    successMessage: 'Dose recorded as taken.',
    testName: 'records a dose as taken and displays a success message',
  },
  {
    status: 'skipped',
    buttonName: 'Mark Lisinopril as skipped',
    successMessage: 'Dose recorded as skipped.',
    testName: 'records a dose as skipped',
  },
])('$testName', async ({ status, buttonName, successMessage }) => {
  const user = userEvent.setup();

  prescriptionService.recordDose.mockResolvedValue({ status });

  await renderPrescriptionForAdherence();

  await user.click(
    screen.getByRole('button', { name: buttonName })
  );

  await waitFor(() => {
    expect(prescriptionService.recordDose).toHaveBeenCalledWith(
      'prescription-1',
      status,
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );
  });

  expect(await screen.findByText(successMessage)).toBeInTheDocument();
});

it('displays medication adherence button labels in Arabic', async () => {
  await renderPrescriptionForAdherence({
    locale: 'ar',
    dir: 'rtl',
  });

  expect(
    screen.getByRole('button', {
      name: 'تحديد Lisinopril على أنها تم تناولها',
    })
  ).toBeInTheDocument();

  expect(
    screen.getByRole('button', {
      name: 'تحديد Lisinopril على أنها فائتة',
    })
  ).toBeInTheDocument();

  expect(
    screen.getByRole('button', {
      name: 'عرض سجل جرعات Lisinopril',
    })
  ).toBeInTheDocument();
});


it('loads and displays dose history', async () => {
  const user = userEvent.setup();

  await renderPrescriptionForAdherence();

  prescriptionService.getDoseHistory.mockResolvedValue([
    {
      id: 'dose-1',
      prescription_id: 'prescription-1',
      status: 'taken',
      recorded_at: '2026-10-21T14:00:00Z',
    },
  ]);

  await user.click(
    screen.getByRole('button', {
      name: 'View dose history for Lisinopril',
    })
  );

  expect(await screen.findByText('taken')).toBeInTheDocument();

  expect(prescriptionService.getDoseHistory).toHaveBeenCalledWith(
    'prescription-1'
  );
});


it('shows an empty message when dose history has no records', async () => {
  const user = userEvent.setup();

  await renderPrescriptionForAdherence();

  await user.click(
    screen.getByRole('button', {
      name: 'View dose history for Lisinopril',
    })
  );

  expect(
    await screen.findByText('No doses recorded yet.')
  ).toBeInTheDocument();
});

it('allows retrying when dose history fails to load', async () => {
  const user = userEvent.setup();
  

  await renderPrescriptionForAdherence();
  prescriptionService.getDoseHistory
    .mockRejectedValueOnce(new Error('Request failed'))
    .mockResolvedValueOnce([
      {
        id: 'dose-1',
        prescription_id: 'prescription-1',
        status: 'taken',
        recorded_at: '2026-10-21T14:00:00Z',
        scheduled_date: '2026-10-21',
      },
    ]);

  await user.click(
    screen.getByRole('button', {
      name: 'View dose history for Lisinopril',
    })
  );

  expect(
    await screen.findByText('Could not load dose history. Please try again.')
  ).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'retry' }));

  expect(await screen.findByText('taken')).toBeInTheDocument();
  expect(prescriptionService.getDoseHistory).toHaveBeenCalledTimes(2);
});


it('shows an error when recording a dose fails', async () => {
  const user = userEvent.setup();

  prescriptionService.recordDose.mockRejectedValue(
    new Error('Request failed')
  );

  await renderPrescriptionForAdherence();

  await user.click(
    screen.getByRole('button', { name: 'Mark Lisinopril as taken' })
  );

  expect(
    await screen.findByText(
      'Could not record this dose. Please try again.'
    )
  ).toBeInTheDocument();
});


it('loads existing medication reminder settings', async () => {
  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.getReminder.mockResolvedValue({
    id: 'reminder-1',
    prescription_id: 'prescription-1',
    reminder_time: '09:30',
    enabled: true,
    paused: false,
  });

  renderWithProviders(<Prescription />);

  expect(await screen.findByText('Lisinopril')).toBeInTheDocument();

  await waitFor(() => {
    expect(prescriptionService.getReminder).toHaveBeenCalledWith(
      'prescription-1'
    );
  });

  expect(screen.getByLabelText('reminderTime')).toHaveValue('09:30');
  expect(
    screen.getByRole('button', { name: 'pauseReminder' })
  ).toBeInTheDocument();
});

it('creates and enables a medication reminder', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.getReminder.mockResolvedValue(null);

  prescriptionService.createReminder.mockResolvedValue({
    id: 'reminder-1',
    prescription_id: 'prescription-1',
    reminder_time: '08:00',
    enabled: false,
    paused: false,
  });

  prescriptionService.updateReminder.mockResolvedValue({
    id: 'reminder-1',
    prescription_id: 'prescription-1',
    reminder_time: '08:00',
    enabled: true,
    paused: false,
  });

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  const enableButton = await screen.findByRole('button', {
    name: 'enableReminder',
  });

  await user.click(enableButton);

  await waitFor(() => {
    expect(prescriptionService.createReminder).toHaveBeenCalledWith(
      'prescription-1',
      { reminder_time: '08:00' }
    );
  });

  expect(prescriptionService.updateReminder).toHaveBeenCalledWith(
    'prescription-1',
    {
      reminder_time: '08:00',
      enabled: true,
      paused: false,
    }
  );

  expect(
    await screen.findByText('reminderSaved')
  ).toBeInTheDocument();
});

it('retries enabling a reminder after the initial update fails', async () => {
  const user = userEvent.setup();

  const createdReminder = {
    id: 'reminder-1',
    prescription_id: 'prescription-1',
    reminder_time: '08:00',
    enabled: false,
    paused: false,
  };

  const enabledReminder = {
    ...createdReminder,
    enabled: true,
  };

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.getReminder.mockResolvedValue(null);
  prescriptionService.createReminder.mockResolvedValue(createdReminder);
  prescriptionService.updateReminder
    .mockRejectedValueOnce(new Error('Update failed'))
    .mockResolvedValueOnce(enabledReminder);

  renderWithProviders(<Prescription />);

  const enableButton = await screen.findByRole('button', {
    name: 'enableReminder',
  });

  await user.click(enableButton);

  expect(await screen.findAllByText('reminderError')).toHaveLength(2);

  await user.click(enableButton);

  await waitFor(() => {
    expect(prescriptionService.createReminder).toHaveBeenCalledTimes(1);
    expect(prescriptionService.updateReminder).toHaveBeenCalledTimes(2);
  });

  expect(await screen.findByText('reminderSaved')).toBeInTheDocument();
});

it('shows an in-app reminder for a due scheduled dose', async () => {
  prescriptionService.getAll.mockResolvedValue([
    {
      ...activePrescription,
      next_dose: '2020-01-01T08:00:00Z',
    },
  ]);

  prescriptionService.getReminder.mockResolvedValue({
    id: 'reminder-1',
    prescription_id: 'prescription-1',
    reminder_time: '08:00',
    enabled: true,
    paused: false,
  });

  renderWithProviders(<Prescription />);

  expect(
    await screen.findByText('doseReminderDue')
  ).toBeInTheDocument();

  expect(
    screen.getByRole('button', { name: 'dismissReminder' })
  ).toBeInTheDocument();
});

it('uses reminder_time instead of next_dose to determine when a reminder is due', async () => {
  const prescription = {
    ...activePrescription,
    next_dose: '2099-01-01T08:00:00Z',
  };

  prescriptionService.getAll.mockResolvedValue([prescription]);
  prescriptionService.getReminder.mockResolvedValue({
    reminder_time: localTimeOffset(-2),
    enabled: true,
    paused: false,
  });

  renderWithProviders(<Prescription />);

  expect(
    await screen.findByText('doseReminderDue')
  ).toBeInTheDocument();
});

it('shows a due reminder when next_dose is null', async () => {
  const prescription = {
    ...activePrescription,
    next_dose: null,
  };

  prescriptionService.getAll.mockResolvedValue([prescription]);
  prescriptionService.getReminder.mockResolvedValue({
    reminder_time: localTimeOffset(-2),
    enabled: true,
    paused: false,
  });

  renderWithProviders(<Prescription />);

  expect(
    await screen.findByText('doseReminderDue')
  ).toBeInTheDocument();
});

it('does not show a reminder before its scheduled local time', async () => {
  const prescription = {
    ...activePrescription,
    next_dose: '2020-01-01T08:00:00Z',
  };

  prescriptionService.getAll.mockResolvedValue([prescription]);
  prescriptionService.getReminder.mockResolvedValue({
    reminder_time: localTimeOffset(5),
    enabled: true,
    paused: false,
  });

  renderWithProviders(<Prescription />);

  await screen.findByText('reminderEnabled');

  expect(screen.queryByText('doseReminderDue')).not.toBeInTheDocument();
});

it('shows the empty reminder state when no reminder is configured', async () => {
  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.getReminder.mockResolvedValue(null);

  renderWithProviders(<Prescription />);

  expect(
    await screen.findByText('noReminderSet')
  ).toBeInTheDocument();
});


it.each([
  ['paused', { enabled: true, paused: true }],
  ['disabled', { enabled: false, paused: false }],
])(
  'does not show a due reminder when reminders are %s',
  async (_status, reminderSettings) => {
    prescriptionService.getAll.mockResolvedValue([
      {
        ...activePrescription,
        next_dose: '2020-01-01T08:00:00Z',
      },
    ]);

    prescriptionService.getReminder.mockResolvedValue({
      id: 'reminder-1',
      prescription_id: 'prescription-1',
      reminder_time: '08:00',
      ...reminderSettings,
    });

    renderWithProviders(<Prescription />);

    await screen.findByText('Lisinopril');

    expect(
      screen.queryByText('doseReminderDue')
    ).not.toBeInTheDocument();
  }
);

it('shows an error when saving medication reminder settings fails', async () => {
  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.getReminder.mockResolvedValue(null);
  prescriptionService.createReminder.mockRejectedValue(
    new Error('Failed to save reminder')
  );

  renderWithProviders(<Prescription />);

  const enableButton = await screen.findByRole('button', {
    name: 'enableReminder',
  });

  await userEvent.click(enableButton);

  expect(
  await screen.findAllByText('reminderError')
).toHaveLength(2);
});

});
