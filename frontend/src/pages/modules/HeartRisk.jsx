import React from 'react';

import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';

const HeartRisk = () => {
  const { t } = useTranslation(['modules']);
  return (
    <PageShell title="modules:heartRisk">

      <div className="max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">

              {t('modules:cardioRiskAssessment', 'Cardiovascular Risk Assessment')}
            </h2>
            <p className="text-gray-600">
              {t('modules:cardioRiskAssessmentDescription', 'This assessment helps evaluate your risk for heart disease and other cardiovascular conditions.')}

            </p>
          </div>
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">

                  {t('modules:age', 'Age')}

                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                  placeholder={t('modules:enterYourAge', 'Enter your age')}

                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">

                  {t('modules:gender', 'Gender')}
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="">{t('modules:selectYourGender', 'Select Your Gender')}</option>
                  <option value="male">{t('modules:male', 'Male')}</option>
                  <option value="female">{t('modules:female', 'Female')}</option>

                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">

                {t('modules:doYouHaveHighBloodPressure', 'Do you have high blood pressure?')}

              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="radio" name="bloodPressure" value="yes" className="mr-2" />

                  {t('modules:yes', 'Yes')}
                </label>
                <label className="flex items-center">
                  <input type="radio" name="bloodPressure" value="no" className="mr-2" />
                  {t('modules:no', 'No')}
                </label>
                <label className="flex items-center">
                  <input type="radio" name="bloodPressure" value="unknown" className="mr-2" />
                  {t('modules:iDontKnow', "I don't know")}

                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">

                {t('modules:doYouHaveDiabetes', 'Do you have diabetes?')}

              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="radio" name="diabetes" value="yes" className="mr-2" />

                  {t('modules:yes', 'Yes')}
                </label>
                <label className="flex items-center">
                  <input type="radio" name="diabetes" value="no" className="mr-2" />
                  {t('modules:no', 'No')}
                </label>
                <label className="flex items-center">
                  <input type="radio" name="diabetes" value="unknown" className="mr-2" />
                  {t('modules:iDontKnow', "I don't know")}

                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >

                {t('modules:completeAssessment', 'Complete Assessment')}

              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default HeartRisk;
