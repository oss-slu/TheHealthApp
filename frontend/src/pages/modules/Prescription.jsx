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

  const loadPrescriptions = async () => {
  try {
    setLoading(true);
    setLoadError(false);

    const data = await prescriptionService.getAll();
    setPrescriptions(data);
  } catch (error) {
    console.error('Failed to load prescriptions:', error);
    setLoadError(true);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const handleAdd = async () => {
  if (
    !addForm.medication_name.trim() ||
    !addForm.dosage.trim() ||
    !addForm.frequency.trim()
  ) {
    return;
  }

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
      error?.message || t('modules:prescriptionError')
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
  try {
    setEditingSaving(true);

    await prescriptionService.update(id, editForm);
    setMessage(t('modules:prescriptionUpdated'));
    setErrorMessage('');
    setEditingId(null);
    await loadPrescriptions();
  } catch (error) {
    console.error('Failed to update prescription:', error);
    setErrorMessage(
    error?.message || t('modules:prescriptionError')
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
          <div className="border border-green-300 bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-green-700">{message}</p>
          </div>
        )}

        {errorMessage && (
          <div className="border border-red-300 bg-red-50 rounded-lg p-4 mb-6">
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
          disabled={
            saving ||
            !addForm.medication_name.trim() ||
            !addForm.dosage.trim() ||
            !addForm.frequency.trim()
          }
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
              {prescriptions.map((prescription) => (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default Prescription;
