import React from 'react';
<<<<<<< HEAD
import PageShell from '../../components/PageShell';

const Prescription = () => {
  return (
    <PageShell title="Prescription Management">
=======
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';

const Prescription = () => {
  const { t } = useTranslation(['modules']);
  return (
    <PageShell title="modules:prescription">
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
      <div className="max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
<<<<<<< HEAD
              Medication Management
            </h2>
            <p className="text-gray-600">
              Keep track of your medications, dosages, and schedules.
=======
              {t('modules:medicalPrescriptions', 'Medical Prescriptions')}
            </h2>
            <p className="text-gray-600">
              {t('modules:medicalDescription', 'Manage and view your medical prescriptions here.')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
            </p>
          </div>
          
          <div className="mb-6">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
<<<<<<< HEAD
              Add New Medication
=======
              {t('modules:addNewPrescription', 'Add New Prescription')}
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">Medication Name</h3>
              <p className="text-gray-600">Dosage: 10mg</p>
              <p className="text-gray-600">Frequency: Once daily</p>
              <p className="text-gray-600">Next dose: Today at 8:00 AM</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">Another Medication</h3>
              <p className="text-gray-600">Dosage: 5mg</p>
              <p className="text-gray-600">Frequency: Twice daily</p>
              <p className="text-gray-600">Next dose: Today at 2:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Prescription;
