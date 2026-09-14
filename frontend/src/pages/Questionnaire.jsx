import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import Stepper from '../components/Stepper';
import { questionnaireService } from '../services/questionnaireService';
import { showSuccessToast, showErrorToast } from '../lib/toast';

const STEPS = [
  { id: 'personal', label: 'questionnaire:steps.personal' },
  { id: 'medical', label: 'questionnaire:steps.medical' },
  { id: 'lifestyle', label: 'questionnaire:steps.lifestyle' },
  { id: 'review', label: 'questionnaire:steps.review' },
];

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  email: '',
  phone: '',
  existingConditions: [],
  allergies: '',
  currentMedications: '',
  familyHistory: '',
  exerciseFrequency: '',
  dietType: '',
  smokingStatus: '',
  alcoholConsumption: '',
  sleepHours: '',
  stressLevel: '',
};

const CONDITIONS_OPTIONS = [
  'diabetes',
  'hypertension',
  'heartDisease',
  'asthma',
  'arthritis',
  'thyroid',
  'none',
];

const Questionnaire = () => {
  const { t } = useTranslation(['questionnaire', 'common', 'errors']);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const validation = useMemo(() => {
    const errors = {};

    if (!form.firstName.trim()) errors.firstName = 'questionnaire:errors.firstNameRequired';
    if (!form.lastName.trim()) errors.lastName = 'questionnaire:errors.lastNameRequired';
    if (!form.dateOfBirth) errors.dateOfBirth = 'questionnaire:errors.dobRequired';
    if (!form.gender) errors.gender = 'questionnaire:errors.genderRequired';

    if (!form.email.trim()) {
      errors.email = 'questionnaire:errors.emailRequired';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'questionnaire:errors.emailInvalid';
    }

    if (!form.exerciseFrequency) errors.exerciseFrequency = 'questionnaire:errors.exerciseRequired';
    if (!form.dietType) errors.dietType = 'questionnaire:errors.dietRequired';
    if (!form.smokingStatus) errors.smokingStatus = 'questionnaire:errors.smokingRequired';
    if (!form.alcoholConsumption) errors.alcoholConsumption = 'questionnaire:errors.alcoholRequired';

    return errors;
  }, [form]);

  const stepValidation = useMemo(() => ({
    0: !validation.firstName && !validation.lastName && !validation.dateOfBirth && !validation.gender && !validation.email,
    1: true,
    2: !validation.exerciseFrequency && !validation.dietType && !validation.smokingStatus && !validation.alcoholConsumption,
    3: true,
  }), [validation]);

  const isCurrentStepValid = stepValidation[currentStep];
  const isFormComplete = Object.keys(validation).length === 0;

  const onChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setForm((prev) => {
        const current = prev.existingConditions;
        if (value === 'none') {
          return { ...prev, existingConditions: checked ? ['none'] : [] };
        }
        const withoutNone = current.filter((c) => c !== 'none');
        return {
          ...prev,
          existingConditions: checked
            ? [...withoutNone, value]
            : withoutNone.filter((c) => c !== value),
        };
      });
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    if (submitError) setSubmitError(null);
  }, [submitError]);

  const onBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const touchCurrentStepFields = useCallback(() => {
    const stepFields = {
      0: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone'],
      1: ['existingConditions', 'allergies', 'currentMedications', 'familyHistory'],
      2: ['exerciseFrequency', 'dietType', 'smokingStatus', 'alcoholConsumption', 'sleepHours', 'stressLevel'],
      3: [],
    };

    const fields = stepFields[currentStep] || [];
    setTouched((prev) => {
      const updates = {};
      fields.forEach((f) => { updates[f] = true; });
      return { ...prev, ...updates };
    });
  }, [currentStep]);

  const handleNext = () => {
    touchCurrentStepFields();
    if (isCurrentStepValid && currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleSubmit = async () => {
    if (!isFormComplete) {
      touchCurrentStepFields();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await questionnaireService.submit(form);
      showSuccessToast(t('questionnaire:success.title'));
      navigate('/dashboard', { replace: true, state: { questionnaireComplete: true } });
    } catch (err) {
      const messageKey = err?.messageKey || 'errors:generic';
      setSubmitError(t(messageKey, err?.message || t('errors:generic')));
      const status = typeof err?.status === 'number' ? err.status : NaN;
      if (status >= 500 || messageKey === 'errors.network' || messageKey === 'errors.timeout') {
        showErrorToast(messageKey, err?.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (name, label, type = 'text', options = {}) => {
    const hasError = touched[name] && validation[name];
    const { placeholder, helpText, required = false } = options;

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor={name}>
          {t(label)} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          id={name}
          name={name}
          type={type}
          value={form[name]}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder ? t(placeholder) : undefined}
          className={`w-full border rounded px-3 py-2 transition-colors ${
            hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } focus:outline-none focus:ring-2`}
        />
        {helpText && <p className="text-xs text-gray-500">{t(helpText)}</p>}
        {hasError && <p className="text-xs text-red-600">{t(validation[name])}</p>}
      </div>
    );
  };

  const renderSelect = (name, label, optionsKey, options = {}) => {
    const hasError = touched[name] && validation[name];
    const { required = false, selectOptions = [] } = options;

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor={name}>
          {t(label)} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id={name}
          name={name}
          value={form[name]}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full border rounded px-3 py-2 transition-colors ${
            hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } focus:outline-none focus:ring-2`}
        >
          <option value="">{t('questionnaire:selectPlaceholder')}</option>
          {selectOptions.map((opt) => (
            <option key={opt} value={opt}>
              {t(`questionnaire:options.${optionsKey}.${opt}`)}
            </option>
          ))}
        </select>
        {hasError && <p className="text-xs text-red-600">{t(validation[name])}</p>}
      </div>
    );
  };

  const renderTextarea = (name, label, options = {}) => {
    const { placeholder, rows = 3 } = options;

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor={name}>
          {t(label)}
        </label>
        <textarea
          id={name}
          name={name}
          value={form[name]}
          onChange={onChange}
          onBlur={onBlur}
          rows={rows}
          placeholder={placeholder ? t(placeholder) : undefined}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>
    );
  };

  const renderPersonalStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField('firstName', 'questionnaire:fields.firstName', 'text', { required: true })}
        {renderField('lastName', 'questionnaire:fields.lastName', 'text', { required: true })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField('dateOfBirth', 'questionnaire:fields.dateOfBirth', 'date', { required: true })}
        {renderSelect('gender', 'questionnaire:fields.gender', 'gender', {
          required: true,
          selectOptions: ['male', 'female', 'other', 'preferNotToSay'],
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField('email', 'questionnaire:fields.email', 'email', { required: true })}
        {renderField('phone', 'questionnaire:fields.phone', 'tel')}
      </div>
    </div>
  );

  const renderMedicalStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('questionnaire:fields.existingConditions')}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CONDITIONS_OPTIONS.map((condition) => (
            <label
              key={condition}
              className="flex items-center space-x-2 rtl:space-x-reverse text-sm"
            >
              <input
                type="checkbox"
                name="existingConditions"
                value={condition}
                checked={form.existingConditions.includes(condition)}
                onChange={onChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{t(`questionnaire:options.conditions.${condition}`)}</span>
            </label>
          ))}
        </div>
      </div>
      {renderTextarea('allergies', 'questionnaire:fields.allergies', {
        placeholder: 'questionnaire:placeholders.allergies',
      })}
      {renderTextarea('currentMedications', 'questionnaire:fields.currentMedications', {
        placeholder: 'questionnaire:placeholders.medications',
      })}
      {renderTextarea('familyHistory', 'questionnaire:fields.familyHistory', {
        placeholder: 'questionnaire:placeholders.familyHistory',
      })}
    </div>
  );

  const renderLifestyleStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSelect('exerciseFrequency', 'questionnaire:fields.exerciseFrequency', 'exercise', {
          required: true,
          selectOptions: ['none', 'rarely', 'weekly', 'daily'],
        })}
        {renderSelect('dietType', 'questionnaire:fields.dietType', 'diet', {
          required: true,
          selectOptions: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'other'],
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSelect('smokingStatus', 'questionnaire:fields.smokingStatus', 'smoking', {
          required: true,
          selectOptions: ['never', 'former', 'current'],
        })}
        {renderSelect('alcoholConsumption', 'questionnaire:fields.alcoholConsumption', 'alcohol', {
          required: true,
          selectOptions: ['none', 'occasional', 'moderate', 'heavy'],
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSelect('sleepHours', 'questionnaire:fields.sleepHours', 'sleep', {
          selectOptions: ['lessThan5', '5to6', '7to8', 'moreThan8'],
        })}
        {renderSelect('stressLevel', 'questionnaire:fields.stressLevel', 'stress', {
          selectOptions: ['low', 'moderate', 'high', 'veryHigh'],
        })}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-gray-900">{t('questionnaire:steps.personal')}</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.firstName')}</dt>
            <dd className="text-gray-900">{form.firstName || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.lastName')}</dt>
            <dd className="text-gray-900">{form.lastName || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.dateOfBirth')}</dt>
            <dd className="text-gray-900">{form.dateOfBirth || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.gender')}</dt>
            <dd className="text-gray-900">
              {form.gender ? t(`questionnaire:options.gender.${form.gender}`) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.email')}</dt>
            <dd className="text-gray-900">{form.email || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.phone')}</dt>
            <dd className="text-gray-900">{form.phone || '-'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-gray-900">{t('questionnaire:steps.medical')}</h3>
        <dl className="grid grid-cols-1 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.existingConditions')}</dt>
            <dd className="text-gray-900">
              {form.existingConditions.length > 0
                ? form.existingConditions.map((c) => t(`questionnaire:options.conditions.${c}`)).join(', ')
                : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.allergies')}</dt>
            <dd className="text-gray-900">{form.allergies || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.currentMedications')}</dt>
            <dd className="text-gray-900">{form.currentMedications || '-'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-gray-900">{t('questionnaire:steps.lifestyle')}</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.exerciseFrequency')}</dt>
            <dd className="text-gray-900">
              {form.exerciseFrequency ? t(`questionnaire:options.exercise.${form.exerciseFrequency}`) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.dietType')}</dt>
            <dd className="text-gray-900">
              {form.dietType ? t(`questionnaire:options.diet.${form.dietType}`) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.smokingStatus')}</dt>
            <dd className="text-gray-900">
              {form.smokingStatus ? t(`questionnaire:options.smoking.${form.smokingStatus}`) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t('questionnaire:fields.alcoholConsumption')}</dt>
            <dd className="text-gray-900">
              {form.alcoholConsumption ? t(`questionnaire:options.alcohol.${form.alcoholConsumption}`) : '-'}
            </dd>
          </div>
        </dl>
      </div>

      {!isFormComplete && (
        <div className="rounded border border-yellow-300 bg-yellow-50 text-yellow-800 p-3 text-sm">
          {t('questionnaire:errors.incompleteForm')}
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalStep();
      case 1:
        return renderMedicalStep();
      case 2:
        return renderLifestyleStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <PageShell title="questionnaire:title">
      <div className="max-w-3xl mx-auto">
        <Stepper steps={STEPS} currentStep={currentStep} onStepClick={handleStepClick} />

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {t(STEPS[currentStep].label)}
          </h3>

          {submitError && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 p-3">
              {submitError}
            </div>
          )}

          <form noValidate onSubmit={(e) => e.preventDefault()}>
            {renderCurrentStep()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('common:back')}
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('common:next')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isFormComplete || isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? t('common:pleaseWait') : t('questionnaire:submit')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default Questionnaire;
