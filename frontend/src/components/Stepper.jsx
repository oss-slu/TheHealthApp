import React from 'react';
import { useTranslation } from 'react-i18next';

const Stepper = ({ steps, currentStep, onStepClick }) => {
  const { t } = useTranslation(['questionnaire']);

  return (
    <nav aria-label={t('questionnaire:stepper.ariaLabel')} className="mb-8">
      <ol className="flex items-center justify-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = isCompleted;

          return (
            <li key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : isCompleted
                      ? 'text-green-700 hover:bg-green-50 cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="hidden sm:inline text-sm">{t(step.label)}</span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;
