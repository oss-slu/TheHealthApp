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

  expect(
    await screen.findByText('Failed to create prescription')
  ).toBeInTheDocument();

  expect(prescriptionService.create).toHaveBeenCalledWith({
    medication_name: 'Aspirin',
    dosage: '81 mg',
    frequency: 'Once daily',
  });
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

  expect(
    await screen.findByText('Failed to update prescription')
  ).toBeInTheDocument();

  expect(prescriptionService.update).toHaveBeenCalledWith(
    'prescription-1',
    {
      medication_name: 'Lisinopril',
      dosage: '20 mg',
      frequency: 'Once daily',
    }
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

  expect(
    await screen.findByText('Failed to archive prescription')
  ).toBeInTheDocument();

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

it('disables the add button when required fields are blank', async () => {
  const user = userEvent.setup();

  prescriptionService.getAll.mockResolvedValue([]);

  renderWithProviders(<Prescription />);

  await user.click(
    screen.getByRole('button', { name: 'addNewPrescription' })
  );

  const saveButton = screen.getByRole('button', {
    name: /savePrescription/i,
  });

  expect(saveButton).toBeDisabled();

  await user.type(
    screen.getByPlaceholderText('medicationName'),
    '   '
  );

  expect(saveButton).toBeDisabled();

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

});

