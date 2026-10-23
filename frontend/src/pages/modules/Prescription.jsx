import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';
import { prescriptionService } from '../../services/prescriptionService';

const Prescription = () => {
  const { t } = useTranslation(['modules']);

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
  });

  const [showAddForm, setShowAddForm] = useState(false);
const [addForm, setAddForm] = useState({
  medication_name: '',
  dosage: '',
  frequency: '',
});
const [saving, setSaving] = useState(false);
const [editingSaving, setEditingSaving] = useState(false);
const [archivingId, setArchivingId] = useState(null);
const [message, setMessage] = useState('');
const [errorMessage, setErrorMessage] = useState('');
const [doseHistory, setDoseHistory] = useState({});
const [doseHistoryError, setDoseHistoryError] = useState({});
const [doseHistoryLoading, setDoseHistoryLoading] = useState({});
const [doseSavingId, setDoseSavingId] = useState(null);
const [doseHistoryVisible, setDoseHistoryVisible] = useState({});
const [reminderSettings, setReminderSettings] = useState({});
const [reminderTimes, setReminderTimes] = useState({});
const [reminderLoading, setReminderLoading] = useState({});
const [reminderSaving, setReminderSaving] = useState({});
const [reminderLoadErrors, setReminderLoadErrors] = useState({});
const [reminderSaveErrors, setReminderSaveErrors] = useState({});
const [currentTime, setCurrentTime] = useState(() => new Date());
const [dismissedReminders, setDismissedReminders] = useState({});

  const loadPrescriptions = async () => {
  try {
    setLoading(true);
    setLoadError(false);

    const data = await prescriptionService.getAll();
    setPrescriptions(data);
    data.forEach((prescription) => {
  handleLoadReminder(prescription.id);
});
  } catch (error) {
    console.error('Failed to load prescriptions:', error);
    setLoadError(true);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const load = async () => {
      await loadPrescriptions();
    };

    load();
  }, []);

  useEffect(() => {
  const timerId = setInterval(() => {
    setCurrentTime(new Date());
  }, 15000);

  return () => clearInterval(timerId);
}, []);

  const handleAdd = async () => {
  if (
    !addForm.medication_name.trim() ||
    !addForm.dosage.trim() ||
    !addForm.frequency.trim()
  ) {
    setErrorMessage(t('modules:prescriptionRequiredFields'));
    setMessage('');
    return;
  }

  setErrorMessage('');

  try {
    setSaving(true);
    await prescriptionService.create({
      medication_name: addForm.medication_name.trim(),
      dosage: addForm.dosage.trim(),
      frequency: addForm.frequency.trim(),
    });

    setMessage(t('modules:prescriptionCreated'));
    setErrorMessage('');

    setAddForm({
      medication_name: '',
      dosage: '',
      frequency: '',
    });
    setShowAddForm(false);
    await loadPrescriptions();
  } catch (error) {
    console.error('Failed to create prescription:', error);
    setErrorMessage(
      error?.status === 422
        ? t('modules:prescriptionValidationError')
        : error?.message || t('modules:prescriptionError')
    );
    setMessage('');
  } finally {
    setSaving(false);
  }
};


  const handleEdit = (prescription) => {
    setEditingId(prescription.id);
    setEditForm({
      medication_name: prescription.medication_name,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
    });
  };

  const handleSave = async (id) => {
    if (
      !editForm.medication_name.trim() ||
      !editForm.dosage.trim() ||
      !editForm.frequency.trim()
    ) {
      setErrorMessage(t('modules:prescriptionRequiredFields'));
      setMessage('');
      return;
    }

    setErrorMessage('');
    try {
    setEditingSaving(true);

    await prescriptionService.update(id, {
      medication_name: editForm.medication_name.trim(),
      dosage: editForm.dosage.trim(),
      frequency: editForm.frequency.trim(),
    });

    setMessage(t('modules:prescriptionUpdated'));
    setErrorMessage('');
    setEditingId(null);
    await loadPrescriptions();
  } catch (error) {
    console.error('Failed to update prescription:', error);
    setErrorMessage(
      error?.status === 422
      ? t('modules:prescriptionValidationError')
      : error?.message || t('modules:prescriptionError')
  );
  setMessage('');
  } finally {
    setEditingSaving(false);
  }
};

  const handleArchive = async (id) => {
  const confirmed = window.confirm(
    t('modules:confirmArchive')
  );

  if (!confirmed) {
    return;
  }

  try {
    setArchivingId(id);

    await prescriptionService.archive(id);
    setMessage(t('modules:prescriptionArchived'));
    setErrorMessage('');
    await loadPrescriptions();
  } catch (error) {
    console.error('Failed to archive prescription:', error);
    setErrorMessage(
      error?.message || t('modules:prescriptionError')
    );
    setMessage('');
  } finally {
    setArchivingId(null);
  }
};

  const handleLoadReminder = async (prescriptionId) => {
    setReminderLoading((previous) => ({
      ...previous,
      [prescriptionId]: true,
    }));

    setReminderLoadErrors((previous) => ({
      ...previous,
      [prescriptionId]: false,
    }));

    try {
      const reminder =
        await prescriptionService.getReminder(prescriptionId);

      setReminderSettings((previous) => ({
        ...previous,
        [prescriptionId]: reminder || null,
      }));

      setReminderTimes((previous) => ({
        ...previous,
        [prescriptionId]:
          reminder?.reminder_time || previous[prescriptionId] || '08:00',
      }));
    } catch (error) {
      console.error('Failed to load medication reminder:', error);

      setReminderLoadErrors((previous) => ({
        ...previous,
        [prescriptionId]: true,
      }));
    } finally {
      setReminderLoading((previous) => ({
        ...previous,
        [prescriptionId]: false,
      }));
    }
  };

    const handleSaveReminder = async (prescriptionId, action) => {
    const reminderTime = reminderTimes[prescriptionId] || '08:00';
    const existingReminder = reminderSettings[prescriptionId];

    setReminderSaving((previous) => ({
      ...previous,
      [prescriptionId]: true,
    }));
    setReminderSaveErrors((previous) => ({
      ...previous,
      [prescriptionId]: false,
    }));
    setMessage('');
    setErrorMessage('');

    try {
      let reminder = existingReminder;

      // Create the preference first if this prescription has no reminder.
      if (!reminder) {
        reminder = await prescriptionService.createReminder(
          prescriptionId,
          { reminder_time: reminderTime }
        );
      }

      const updates = { reminder_time: reminderTime };

      if (action === 'enable' || action === 'resume') {
        updates.enabled = true;
        updates.paused = false;
      } else if (action === 'pause') {
        updates.enabled = true;
        updates.paused = true;
      } else if (action === 'disable') {
        updates.enabled = false;
        updates.paused = false;
      }

      // A newly created reminder is already disabled. Only patch when
      // an existing reminder needs updating, or when enabling a new one.
      if (
        existingReminder ||
        action === 'enable' ||
        action === 'resume' ||
        action === 'pause' ||
        action === 'disable'
      ) {
        reminder = await prescriptionService.updateReminder(
          prescriptionId,
          updates
        );
      }

      setReminderSettings((previous) => ({
        ...previous,
        [prescriptionId]: reminder,
      }));

      setReminderTimes((previous) => ({
        ...previous,
        [prescriptionId]: reminder.reminder_time,
      }));

      setMessage(t('modules:reminderSaved'));
    } catch (error) {
      console.error('Failed to save medication reminder:', error);
      setReminderSaveErrors((previous) => ({
        ...previous,
        [prescriptionId]: true,
      }));
      setErrorMessage(t('modules:reminderError'));
    } finally {
      setReminderSaving((previous) => ({
        ...previous,
        [prescriptionId]: false,
      }));
    }
  };


  const handleRecordDose = async (prescriptionId, status) => {
    setDoseSavingId(prescriptionId);
    setMessage('');
    setErrorMessage('');

    try {
      await prescriptionService.recordDose(prescriptionId, status);

      setMessage(
        status === 'taken'
          ? t('modules:doseRecordedTaken')
          : t('modules:doseRecordedSkipped')
      );

      await handleLoadDoseHistory(prescriptionId);
    } catch (error) {
      console.error('Failed to record medication dose:', error);
      setErrorMessage(t('modules:doseRecordError'));
    } finally {
      setDoseSavingId(null);
    }
  };

  const handleLoadDoseHistory = async (prescriptionId) => {
  setDoseHistoryLoading((previous) => ({
    ...previous,
    [prescriptionId]: true,
  }));

  setDoseHistoryError((previous) => ({
    ...previous,
    [prescriptionId]: false,
  }));

  try {
    const history =
      await prescriptionService.getDoseHistory(prescriptionId);

    setDoseHistory((previous) => ({
      ...previous,
      [prescriptionId]: history,
    }));
  } catch (error) {
    console.error('Failed to load dose history:', error);

    setDoseHistoryError((previous) => ({
      ...previous,
      [prescriptionId]: true,
    }));
  } finally {
    setDoseHistoryLoading((previous) => ({
      ...previous,
      [prescriptionId]: false,
    }));
  }
};

    const handleToggleDoseHistory = async (prescriptionId) => {
    const isVisible = doseHistoryVisible[prescriptionId];

    if (isVisible) {
      setDoseHistoryVisible((previous) => ({
        ...previous,
        [prescriptionId]: false,
      }));
      return;
    }

    setDoseHistoryVisible((previous) => ({
      ...previous,
      [prescriptionId]: true,
    }));

    await handleLoadDoseHistory(prescriptionId);
  };

  return (
    <PageShell title="modules:prescription">
      <div className="max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('modules:medicalPrescriptions')}
            </h2>

            <p className="text-gray-600">
  {t('modules:medicalDescription')}
</p>
</div>

{message && (
  <div
    role="status"
    aria-live="polite"
    className="border border-green-300 bg-green-50 rounded-lg p-4 mb-6"
  >
    <p className="text-green-700">{message}</p>
  </div>
)}

{errorMessage && (
  <div
    role="alert"
    aria-live="assertive"
    className="border border-red-300 bg-red-50 rounded-lg p-4 mb-6"
  >
    <p className="text-red-700">{errorMessage}</p>
  </div>
)}


<button
  onClick={() => setShowAddForm(!showAddForm)}
  className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
>
  {t('modules:addNewPrescription')}
</button>

{showAddForm && (
  <div className="border rounded-lg p-4 mb-6">
    <div className="space-y-3">
      <label
        htmlFor="add-medication-name"
        className="block text-sm font-medium text-gray-700"
        >
        {t('modules:medicationName')}
        </label>
      <input
        id="add-medication-name"
        type="text"
        value={addForm.medication_name}
        onChange={(e) =>
          setAddForm({
            ...addForm,
            medication_name: e.target.value,
          })
        }
        className="w-full border rounded-md px-3 py-2"
        placeholder={t('modules:medicationName')}
      />

      <label
        htmlFor="add-dosage"
        className="block text-sm font-medium text-gray-700"
        >
        {t('modules:dosage')}
        </label>

      <input
        id="add-dosage"
        type="text"
        value={addForm.dosage}
        onChange={(e) =>
          setAddForm({
            ...addForm,
            dosage: e.target.value,
          })
        }
        className="w-full border rounded-md px-3 py-2"
        placeholder={t('modules:dosage')}
      />

      <label
        htmlFor="add-frequency"
        className="block text-sm font-medium text-gray-700"
      >
        {t('modules:frequency')}
      </label>

      <input
        id="add-frequency"
        type="text"
        value={addForm.frequency}
        onChange={(e) =>
          setAddForm({
            ...addForm,
            frequency: e.target.value,
          })
        }
        className="w-full border rounded-md px-3 py-2"
        placeholder={t('modules:frequency')}
      />

      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={saving}
          
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving
            ? t('modules:saving')
            : t('modules:savePrescription')}
        </button>

        <button
          onClick={() => setShowAddForm(false)}
          disabled={saving}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          {t('modules:cancel')}
        </button>
      </div>
    </div>
  </div>
)}

{loadError && !loading && (
  <div className="border border-red-300 bg-red-50 rounded-lg p-4 mb-6">
    <p className="text-red-700 mb-3">
      {t('modules:prescriptionError')}
    </p>
    <button
      onClick={loadPrescriptions}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
    >
      {t('modules:retry')}
    </button>
  </div>
)}


{loading ? (
            <p className="text-gray-600">
              {t('modules:loadingPrescriptions')}
              </p>
          ) : prescriptions.length === 0 ? (
            <p className="text-gray-600">
              {t('modules:noActivePrescriptions')}
            </p>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => {
  const reminder = reminderSettings[prescription.id];
  const doseTime = prescription.next_dose
    ? new Date(prescription.next_dose)
    : null;
  const reminderIsDue =
    reminder?.enabled === true &&
    reminder?.paused === false &&
    doseTime !== null &&
    !Number.isNaN(doseTime.getTime()) &&
    doseTime <= currentTime;

  const today = currentTime.toLocaleDateString('en-CA');
  const dismissalKey = `${prescription.id}-${today}`;
  const reminderDismissed =
    dismissedReminders[dismissalKey] === true;

  return (
    <div
      key={prescription.id}
      className="border rounded-lg p-4"
    >
                  {editingId === prescription.id ? (
                    <div className="space-y-3">
                      <label
                        htmlFor="edit-medication-name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('modules:medicationName')}
                      </label>

                      <input
                        id="edit-medication-name"
                        type="text"
                        value={editForm.medication_name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            medication_name: e.target.value,
                          })
                        }
                        className="w-full border rounded-md px-3 py-2"
                        placeholder={t('modules:medicationName')}
                      />

                      <label
                        htmlFor="edit-dosage"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('modules:dosage')}
                      </label>

                      <input
                        id="edit-dosage"
                        type="text"
                        value={editForm.dosage}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            dosage: e.target.value,
                          })
                        }
                        className="w-full border rounded-md px-3 py-2"
                        placeholder={t('modules:dosage')}
                      />

                      <label
                        htmlFor="edit-frequency"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('modules:frequency')}
                      </label>

                      <input
                        id="edit-frequency"
                        type="text"
                        value={editForm.frequency}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            frequency: e.target.value,
                          })
                        }
                        className="w-full border rounded-md px-3 py-2"
                        placeholder={t('modules:frequency')}
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(prescription.id)}
                          disabled={
                            editingSaving ||
                            !editForm.medication_name.trim() ||
                            !editForm.dosage.trim() ||
                            !editForm.frequency.trim()
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          {editingSaving
                            ? t('modules:saving')
                            : t('modules:savePrescription')}
                        </button>

                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                          {t('modules:cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        {prescription.medication_name}
                      </h3>

                      <p className="text-gray-600">
                        {t('modules:dosage')}: {prescription.dosage}
                      </p>

                      <p className="text-gray-600">
                        {t('modules:frequency')}: {prescription.frequency}
                      </p>

                      {prescription.next_dose && (
                        <p className="text-gray-600">
                          {t('modules:nextDose')}:{' '}
                          {new Date(
                            prescription.next_dose
                          ).toLocaleString()}
                        </p>
                      )}

                      
<div className="mt-4 border-t pt-4">
  <h4 className="font-semibold text-gray-900 mb-3">
    {t('modules:doseTracking')}
  </h4>

  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => handleRecordDose(prescription.id, 'taken')}
      disabled={doseSavingId === prescription.id}
      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
    >
      {doseSavingId === prescription.id
        ? t('modules:recordingDose')
        : t('modules:recordTaken')}
    </button>

    <button
      type="button"
      onClick={() => handleRecordDose(prescription.id, 'skipped')}
      disabled={doseSavingId === prescription.id}
      className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
    >
      {t('modules:recordSkipped')}
    </button>

    <button
      type="button"
      onClick={() => handleToggleDoseHistory(prescription.id)}
      aria-expanded={Boolean(doseHistoryVisible[prescription.id])}
      className="px-3 py-2 border rounded-md hover:bg-gray-50"
    >
      {t('modules:doseHistory')}
    </button>
  </div>

  {doseHistoryVisible[prescription.id] && (
    <div className="mt-3" aria-live="polite">
      {doseHistoryLoading[prescription.id] ? (
  <p>{t('modules:loadingDoseHistory')}</p>
) : doseHistoryError[prescription.id] ? (
  <div>
    <p role="alert" className="text-red-700">
      {t('modules:doseHistoryError')}
    </p>
    <button
      type="button"
      onClick={() => handleLoadDoseHistory(prescription.id)}
      className="mt-2 px-3 py-2 border rounded-md hover:bg-gray-50"
    >
      {t('modules:retry')}
    </button>
  </div>
) : Array.isArray(doseHistory[prescription.id]) &&
  doseHistory[prescription.id].length > 0 ? (
  <ul className="space-y-2">
    {doseHistory[prescription.id].map((dose) => (
      <li
        key={dose.id}
        className="text-sm text-gray-700 border-b pb-2"
      >
        <span className="font-medium">
          {t(`modules:${dose.status}`)}
        </span>
        {' — '}
        {t('modules:recordedAt')}:{' '}
        {new Date(dose.recorded_at).toLocaleString()}
      </li>
    ))}
  </ul>
) : (
  <p className="text-gray-600">
    {t('modules:noDoseHistory')}
  </p>
)}
    </div>
  )}
</div>


<div className="mt-4 border-t pt-4">
  <h4 className="font-semibold text-gray-900 mb-3">
    {t('modules:medicationReminders')}
  </h4>

  {reminderIsDue && !reminderDismissed && (
  <div
    role="status"
    aria-live="polite"
    className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3"
  >
    <p>
      {t('modules:doseReminderDue', {
        medication: prescription.medication_name,
      })}
    </p>
    <button
      type="button"
      onClick={() =>
        setDismissedReminders((previous) => ({
          ...previous,
          [dismissalKey]: true,
        }))
      }
      className="mt-2 rounded-md border px-3 py-2 hover:bg-amber-100"
    >
      {t('modules:dismissReminder')}
    </button>
  </div>
)}

  {reminderLoading[prescription.id] ? (
    <p role="status">{t('modules:loadingReminder')}</p>
  ) : reminderLoadErrors[prescription.id] ? (
    <div>
      <p role="alert" className="text-red-700 mb-2">
        {t('modules:reminderLoadError')}
      </p>
      <button
        type="button"
        onClick={() => handleLoadReminder(prescription.id)}
        className="px-3 py-2 border rounded-md hover:bg-gray-50"
      >
        {t('modules:retry')}
      </button>
    </div>
  ) : (
    <div className="space-y-3">
      <label
        htmlFor={`reminder-time-${prescription.id}`}
        className="block text-sm font-medium text-gray-700"
      >
        {t('modules:reminderTime')}
      </label>

      <input
        id={`reminder-time-${prescription.id}`}
        type="time"
        value={reminderTimes[prescription.id] || '08:00'}
        onChange={(event) =>
          setReminderTimes((previous) => ({
            ...previous,
            [prescription.id]: event.target.value,
          }))
        }
        disabled={reminderSaving[prescription.id]}
        className="border rounded-md px-3 py-2"
      />

      {reminderSaveErrors[prescription.id] && (
  <p role="alert" className="text-red-700">
    {t('modules:reminderError')}
  </p>
)}

      <p className="text-sm text-gray-600" aria-live="polite">
        {!reminderSettings[prescription.id]
          ? t('modules:noReminderSet')
          : !reminderSettings[prescription.id].enabled
            ? t('modules:reminderDisabled')
            : reminderSettings[prescription.id].paused
              ? t('modules:reminderPaused')
              : t('modules:enableReminder')}
      </p>

      <div className="flex flex-wrap gap-2">
        {!reminderSettings[prescription.id] ||
        !reminderSettings[prescription.id].enabled ? (
          <button
            type="button"
            onClick={() =>
              handleSaveReminder(prescription.id, 'enable')
            }
            disabled={reminderSaving[prescription.id]}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {t('modules:enableReminder')}
          </button>
        ) : reminderSettings[prescription.id].paused ? (
          <button
            type="button"
            onClick={() =>
              handleSaveReminder(prescription.id, 'resume')
            }
            disabled={reminderSaving[prescription.id]}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {t('modules:resumeReminder')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              handleSaveReminder(prescription.id, 'pause')
            }
            disabled={reminderSaving[prescription.id]}
            className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            {t('modules:pauseReminder')}
          </button>
        )}

        {reminderSettings[prescription.id]?.enabled && (
          <button
            type="button"
            onClick={() =>
              handleSaveReminder(prescription.id, 'disable')
            }
            disabled={reminderSaving[prescription.id]}
            className="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {t('modules:disableReminder')}
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSaveReminder(prescription.id, 'save')}
          disabled={reminderSaving[prescription.id]}
          className="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          {reminderSaving[prescription.id]
            ? t('modules:saving')
            : t('modules:saveReminder')}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        {t('modules:reminderNotSentNotice')}
      </p>
    </div>
  )}
</div>


                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleEdit(prescription)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          {t('modules:edit')}
                        </button>

                        <button
                          onClick={() => handleArchive(prescription.id)}
                          disabled={archivingId === prescription.id}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                        >
                          {archivingId === prescription.id
                            ? t('modules:saving')
                            : t('modules:archive')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
               );
               })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default Prescription;
