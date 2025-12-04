import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import PageShell from '../../components/PageShell';

const HeartRisk = () => {
  const { t } = useTranslation(['modules']);
  const [formData, setFormData] = useState({
    Age: '',
    Gender: '',
    High_BP: '',
    High_Cholesterol: '',
    Smoking: '',
    Family_History: '',
    Chronic_Stress: '',
    Shortness_of_Breath: '',
    Pain_Arms_Jaw_Back: '',
    Cold_Sweats_Nausea: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ML API endpoint - adjust this URL based on where your ML backend is running
  const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8001/predict';

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setResult(null);
  };

  const mapValueToInt = (value) => {
    if (value === 'yes' || value === '1' || value === 1) return 1;
    if (value === 'no' || value === '0' || value === 0) return 0;
    return 0; // Default to 0 for "don't know" or empty
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Prepare data for ML API (matching the expected format)
      const payload = {
        Age: parseFloat(formData.Age) || 0,
        Gender: formData.Gender === 'male' ? 1 : 0,
        High_BP: mapValueToInt(formData.High_BP),
        High_Cholesterol: mapValueToInt(formData.High_Cholesterol),
        Smoking: mapValueToInt(formData.Smoking),
        Family_History: mapValueToInt(formData.Family_History),
        Chronic_Stress: mapValueToInt(formData.Chronic_Stress),
        Shortness_of_Breath: mapValueToInt(formData.Shortness_of_Breath),
        Pain_Arms_Jaw_Back: mapValueToInt(formData.Pain_Arms_Jaw_Back),
        Cold_Sweats_Nausea: mapValueToInt(formData.Cold_Sweats_Nausea),
      };

      const response = await axios.post(ML_API_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to get prediction. Please ensure the ML backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColorClass = (riskLevel) => {
    if (!riskLevel) return '';
    const level = riskLevel.toLowerCase();
    if (level.includes('low')) return 'bg-green-100 border-green-500 text-green-800';
    if (level.includes('medium')) return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    if (level.includes('high')) return 'bg-red-100 border-red-500 text-red-800';
    return 'bg-gray-100 border-gray-500 text-gray-800';
  };

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
            <p className="text-xs text-yellow-600 mt-2 bg-yellow-50 p-2 rounded">
              ⚠️ This tool is for screening purposes only. Always consult a medical professional for health advice.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Age and Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('modules:age', 'Age')} *
                </label>
                <input
                  type="number"
                  required
                  min="18"
                  max="100"
                  value={formData.Age}
                  onChange={(e) => handleChange('Age', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('modules:enterYourAge', 'Enter your age')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('modules:gender', 'Gender')} *
                </label>
                <select
                  required
                  value={formData.Gender}
                  onChange={(e) => handleChange('Gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('modules:selectYourGender', 'Select Your Gender')}</option>
                  <option value="male">{t('modules:male', 'Male')}</option>
                  <option value="female">{t('modules:female', 'Female')}</option>
                </select>
              </div>
            </div>

            {/* Binary Questions */}
            {[
              { key: 'High_BP', label: t('modules:doYouHaveHighBloodPressure', 'Do you have high blood pressure?') },
              { key: 'High_Cholesterol', label: t('modules:doYouHaveHighCholesterol', 'Do you have high cholesterol?') },
              { key: 'Smoking', label: t('modules:areYouSmoker', 'Are you currently a smoker?') },
              { key: 'Family_History', label: t('modules:familyHistory', 'Do you have a family history of heart disease?') },
              { key: 'Chronic_Stress', label: t('modules:chronicStress', 'Do you regularly experience chronic stress?') },
              { key: 'Shortness_of_Breath', label: t('modules:shortnessOfBreath', 'Do you experience shortness of breath?') },
              { key: 'Pain_Arms_Jaw_Back', label: t('modules:painArmsJawBack', 'Do you feel pain in your arms, jaw, or back?') },
              { key: 'Cold_Sweats_Nausea', label: t('modules:coldSweatsNausea', 'Do you experience cold sweats or nausea?') },
            ].map((question) => (
              <div key={question.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {question.label}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={question.key}
                      value="no"
                      checked={formData[question.key] === 'no'}
                      onChange={(e) => handleChange(question.key, e.target.value)}
                      className="mr-2"
                    />
                    {t('modules:no', 'No')}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={question.key}
                      value="yes"
                      checked={formData[question.key] === 'yes'}
                      onChange={(e) => handleChange(question.key, e.target.value)}
                      className="mr-2"
                    />
                    {t('modules:yes', 'Yes')}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={question.key}
                      value="unknown"
                      checked={formData[question.key] === 'unknown' || formData[question.key] === ''}
                      onChange={(e) => handleChange(question.key, e.target.value)}
                      className="mr-2"
                    />
                    {t('modules:iDontKnow', "I don't know")}
                  </label>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !formData.Age || !formData.Gender}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('common:pleaseWait', 'Please wait...') : t('modules:completeAssessment', 'Complete Assessment')}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="mt-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900 uppercase">Screening Result</h3>
              
              {/* Main Result Box */}
              <div className={`p-6 rounded-lg border-2 ${getRiskColorClass(result.risk_level)}`}>
                <h4 className="text-2xl font-bold mb-2">{result.risk_level}</h4>
                <p className="mb-4">{result.advice}</p>
                {result.probability !== undefined && (
                  <p className="text-sm opacity-75">
                    Risk Probability: {(result.probability * 100).toFixed(1)}%
                  </p>
                )}
                {result.urgent_warning && (
                  <div className="mt-4 p-3 bg-red-200 border border-red-400 rounded">
                    <p className="font-bold text-red-900">{result.urgent_warning}</p>
                  </div>
                )}
              </div>

              {/* Personalized Tips */}
              {result.personalized_tips && result.personalized_tips.length > 0 && (
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold mb-4">Your Personalized Tips</h4>
                  {result.personalized_tips.map((tip, idx) => (
                    <div key={idx} className="mb-4">
                      <h5 className="font-semibold text-red-600 uppercase text-sm mb-2">{tip.title}</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {tip.points.map((point, pIdx) => (
                          <li key={pIdx} className="text-sm">{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* General Tips */}
              {result.general_tips && result.general_tips.length > 0 && (
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold mb-4">General Recommendations</h4>
                  <ul className="list-disc list-inside space-y-2">
                    {result.general_tips.map((tip, idx) => (
                      <li key={idx} className="text-sm">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default HeartRisk;
