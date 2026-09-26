import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';
import { prescriptionService } from '../../services/prescriptionService';

const Prescription = () => {
  const { t } = useTranslation(['modules']);

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
  });

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getAll();
      setPrescriptions(data);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

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
      await prescriptionService.update(id, editForm);
      setEditingId(null);
      await loadPrescriptions();
    } catch (error) {
      console.error('Failed to update prescription:', error);
    }
  };

  const handleArchive = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to archive this prescription?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await prescriptionService.archive(id);
      await loadPrescriptions();
    } catch (error) {
      console.error('Failed to archive prescription:', error);
    }
  };

  return (
    <PageShell title="modules:prescription">
      <div className="max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('modules:medicalPrescriptions', 'Medical Prescriptions')}
            </h2>

            <p className="text-gray-600">
              {t(
                'modules:medicalDescription',
                'Manage and view your medical prescriptions here.'
              )}
            </p>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading prescriptions...</p>
          ) : prescriptions.length === 0 ? (
            <p className="text-gray-600">
              No active prescriptions found.
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
                      <input
                        type="text"
                        value={editForm.medication_name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            medication_name: e.target.value,
                          })
                        }
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Medication name"
                      />

                      <input
                        type="text"
                        value={editForm.dosage}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            dosage: e.target.value,
                          })
                        }
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Dosage"
                      />

                      <input
                        type="text"
                        value={editForm.frequency}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            frequency: e.target.value,
                          })
                        }
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Frequency"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(prescription.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Save
                        </button>

                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        {prescription.medication_name}
                      </h3>

                      <p className="text-gray-600">
                        Dosage: {prescription.dosage}
                      </p>

                      <p className="text-gray-600">
                        Frequency: {prescription.frequency}
                      </p>

                      {prescription.next_dose && (
                        <p className="text-gray-600">
                          Next dose:{' '}
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
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleArchive(prescription.id)
                          }
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                          Archive
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
