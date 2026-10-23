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


it('records a dose as taken and displays a success message', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.recordDose.mockResolvedValue({
    status: 'taken',
  });
  prescriptionService.getDoseHistory.mockResolvedValue([]);

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'recordTaken' })
  );

  await waitFor(() => {
    expect(prescriptionService.recordDose).toHaveBeenCalledWith(
      'prescription-1',
      'taken'
    );
  });

  expect(
    await screen.findByText('doseRecordedTaken')
  ).toBeInTheDocument();
});

it('records a dose as skipped', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.recordDose.mockResolvedValue({
    status: 'skipped',
  });
  prescriptionService.getDoseHistory.mockResolvedValue([]);

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'recordSkipped' })
  );

  await waitFor(() => {
    expect(prescriptionService.recordDose).toHaveBeenCalledWith(
      'prescription-1',
      'skipped'
    );
  });

  expect(
    await screen.findByText('doseRecordedSkipped')
  ).toBeInTheDocument();
});

it('loads and displays dose history', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.getDoseHistory.mockResolvedValue([
    {
      id: 'dose-1',
      prescription_id: 'prescription-1',
      status: 'taken',
      recorded_at: '2026-10-21T14:00:00Z',
    },
  ]);

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'doseHistory' })
  );

  expect(await screen.findByText('taken')).toBeInTheDocument();

  expect(prescriptionService.getDoseHistory).toHaveBeenCalledWith(
    'prescription-1'
  );
});

it('shows an error when recording a dose fails', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([activePrescription]);
  prescriptionService.recordDose.mockRejectedValue(
    new Error('Request failed')
  );

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  await user.click(
    screen.getByRole('button', { name: 'recordTaken' })
  );

  expect(
    await screen.findByText(
      'doseRecordError'
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

it('does not show a due reminder when reminders are paused', async () => {
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
    paused: true,
  });

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  expect(
    screen.queryByText('doseReminderDue')
  ).not.toBeInTheDocument();
});

it('does not show a due reminder when reminders are disabled', async () => {
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
    enabled: false,
    paused: false,
  });

  renderWithProviders(<Prescription />);

  await screen.findByText('Lisinopril');

  expect(
    screen.queryByText('doseReminderDue')
  ).not.toBeInTheDocument();
});


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
