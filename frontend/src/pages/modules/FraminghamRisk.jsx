import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { showErrorToast } from '../../lib/toast';
import { healthRiskService } from '../../services/healthRiskService';
import { parseHealthRiskAssessment } from '../../utils/riskAssessmentResponse';

const initialForm = {
  age: '',
  gender: '',
  total_cholesterol: '',
  hdl_cholesterol: '',
  systolic_blood_pressure: '',
  blood_pressure_treatment: '',
  smoking_status: '',
  diabetes_status: '',
};

function categoryClass(cat) {
  if (!cat) return 'bg-gray-100 border-gray-400 text-gray-800';
  const c = String(cat).toLowerCase();
  if (c.includes('very_high') || c === 'very high') return 'bg-red-100 border-red-500 text-red-900';
  if (c.includes('high')) return 'bg-orange-100 border-orange-500 text-orange-900';
  if (c.includes('moderate')) return 'bg-yellow-100 border-yellow-600 text-yellow-900';
  return 'bg-green-100 border-green-500 text-green-900';
}

const FraminghamRisk = () => {
  const { t } = useTranslation(['framingham', 'modules', 'common', 'errors', 'dashboard']);
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const validation = useMemo(() => {
    const e = {};
    const age = parseInt(form.age, 10);
    if (form.age === '' || Number.isNaN(age) || age < 20 || age > 120) {
      e.age = true;
    }
    if (!form.gender) e.gender = true;
    const tc = parseFloat(form.total_cholesterol);
    if (form.total_cholesterol === '' || Number.isNaN(tc) || tc < 100 || tc > 500) {
      e.total_cholesterol = true;
    }
    const hdl = parseFloat(form.hdl_cholesterol);
    if (form.hdl_cholesterol === '' || Number.isNaN(hdl) || hdl < 10 || hdl > 150) {
      e.hdl_cholesterol = true;
    }
    if (!e.total_cholesterol && !e.hdl_cholesterol && tc <= hdl) {
      e.hdl_cholesterol = true;
    }
    const sbp = parseInt(form.systolic_blood_pressure, 10);
    if (form.systolic_blood_pressure === '' || Number.isNaN(sbp) || sbp < 70 || sbp > 250) {
      e.systolic_blood_pressure = true;
    }
    if (!form.blood_pressure_treatment) e.blood_pressure_treatment = true;
    if (!form.smoking_status) e.smoking_status = true;
    if (!form.diabetes_status) e.diabetes_status = true;
    return e;
  }, [form]);

  const isValid = Object.keys(validation).length === 0;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setResult(null);
  };

  const onBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const touchAll = () => {
    setTouched({
      age: true,
      gender: true,
      total_cholesterol: true,
      hdl_cholesterol: true,
      systolic_blood_pressure: true,
      blood_pressure_treatment: true,
      smoking_status: true,
      diabetes_status: true,
    });
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    touchAll();
    if (!isValid) {
      setError(t('framingham:errorValidation'));
      return;
    }

    const payload = {
      age: parseInt(form.age, 10),
      gender: form.gender,
      total_cholesterol: parseFloat(form.total_cholesterol),
      hdl_cholesterol: parseFloat(form.hdl_cholesterol),
      systolic_blood_pressure: parseInt(form.systolic_blood_pressure, 10),
      blood_pressure_treatment: form.blood_pressure_treatment,
      smoking_status: form.smoking_status,
      diabetes_status: form.diabetes_status,
    };

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const data = await healthRiskService.calculateRisk(payload);
      const parsed = parseHealthRiskAssessment(data);
      if (!parsed) {
        const msg = t('framingham:errorInvalidResponse');
        setError(msg);
        showErrorToast('framingham:errorInvalidResponse', msg);
        return;
      }
      setResult(parsed);
    } catch (err) {
      setResult(null);
      const messageKey = err?.messageKey || 'errors.generic';
      const rawMessage =
        typeof err?.message === 'string' && err.message.trim()
          ? err.message
          : t('errors:generic');
      setError(t(messageKey, rawMessage));
      const st = err?.status;
      const shouldToast =
        st === undefined ||
        st >= 500 ||
        messageKey === 'errors.network' ||
        messageKey === 'errors.timeout';
      if (shouldToast) {
        showErrorToast(messageKey, rawMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setTouched({});
    setError(null);
    setResult(null);
  };

  const catLabel = (cat) => {
    if (!cat) return '';
    const key = `framingham:cat_${String(cat).toLowerCase()}`;
    const translated = t(key);
    return translated === key ? String(cat).replace(/_/g, ' ') : translated;
  };

  const showErr = (name) => touched[name] && validation[name];

  return (
    <PageShell title="framingham:title">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-sm text-gray-600">{t('framingham:subtitle')}</p>
        <div className="rounded border border-amber-200 bg-amber-50 text-amber-900 text-sm p-3">
          {t('framingham:disclaimerBanner')}
        </div>

        <div className="flex gap-3">
          <Link
            to="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← {t('dashboard:menuLabel')}
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md space-y-5"
          noValidate
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="age">
                {t('framingham:fieldAge')} *
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min={20}
                max={120}
                value={form.age}
                onChange={onChange}
                onBlur={onBlur}
                className={`w-full border rounded px-3 py-2 ${showErr('age') ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="gender">
                {t('framingham:fieldGender')} *
              </label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={onChange}
                onBlur={onBlur}
                className={`w-full border rounded px-3 py-2 ${showErr('gender') ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">{t('modules:selectYourGender')}</option>
                <option value="male">{t('modules:male')}</option>
                <option value="female">{t('modules:female')}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">{t('framingham:genderHelp')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="total_cholesterol">
                {t('framingham:fieldTotalChol')} *
              </label>
              <input
                id="total_cholesterol"
                name="total_cholesterol"
                type="number"
                step="0.1"
                min={100}
                max={500}
                value={form.total_cholesterol}
                onChange={onChange}
                onBlur={onBlur}
                className={`w-full border rounded px-3 py-2 ${showErr('total_cholesterol') ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="hdl_cholesterol">
                {t('framingham:fieldHdl')} *
              </label>
              <input
                id="hdl_cholesterol"
                name="hdl_cholesterol"
                type="number"
                step="0.1"
                min={10}
                max={150}
                value={form.hdl_cholesterol}
                onChange={onChange}
                onBlur={onBlur}
                className={`w-full border rounded px-3 py-2 ${showErr('hdl_cholesterol') ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="systolic_blood_pressure">
              {t('framingham:fieldSbp')} *
            </label>
            <input
              id="systolic_blood_pressure"
              name="systolic_blood_pressure"
              type="number"
              min={70}
              max={250}
              value={form.systolic_blood_pressure}
              onChange={onChange}
              onBlur={onBlur}
              className={`w-full border rounded px-3 py-2 md:max-w-xs ${showErr('systolic_blood_pressure') ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">{t('framingham:fieldBpTreatment')} *</span>
            <div className="flex flex-wrap gap-4">
              {['yes', 'no'].map((v) => (
                <label key={v} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="blood_pressure_treatment"
                    value={v}
                    checked={form.blood_pressure_treatment === v}
                    onChange={onChange}
                    onBlur={onBlur}
                  />
                  {v === 'yes' ? t('framingham:bpYes') : t('framingham:bpNo')}
                </label>
              ))}
            </div>
            {showErr('blood_pressure_treatment') && (
              <p className="text-xs text-red-600 mt-1">{t('framingham:errorValidation')}</p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">{t('framingham:fieldSmoking')} *</span>
            <div className="flex flex-col gap-2">
              {[
                ['current', 'smokeCurrent'],
                ['former', 'smokeFormer'],
                ['never', 'smokeNever'],
              ].map(([val, key]) => (
                <label key={val} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="smoking_status"
                    value={val}
                    checked={form.smoking_status === val}
                    onChange={onChange}
                    onBlur={onBlur}
                  />
                  {t(`framingham:${key}`)}
                </label>
              ))}
            </div>
            {showErr('smoking_status') && (
              <p className="text-xs text-red-600 mt-1">{t('framingham:errorValidation')}</p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">{t('framingham:fieldDiabetes')} *</span>
            <div className="flex flex-col gap-2">
              {[
                ['no', 'dmNo'],
                ['yes', 'dmYes'],
                ['prediabetes', 'dmPrediabetes'],
              ].map(([val, key]) => (
                <label key={val} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="diabetes_status"
                    value={val}
                    checked={form.diabetes_status === val}
                    onChange={onChange}
                    onBlur={onBlur}
                  />
                  {t(`framingham:${key}`)}
                </label>
              ))}
            </div>
            {showErr('diabetes_status') && (
              <p className="text-xs text-red-600 mt-1">{t('framingham:errorValidation')}</p>
            )}
          </div>

          {error && (
            <div className="rounded border border-red-300 bg-red-50 text-red-800 text-sm p-3">{error}</div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? t('framingham:calculating') : t('framingham:submit')}
            </button>
            {(result || error) && (
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('framingham:resetForm')}
              </button>
            )}
          </div>
        </form>

        {result && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">{t('framingham:resultsTitle')}</h2>
            <div className={`rounded-lg border-2 p-6 ${categoryClass(result.risk_category)}`}>
              <p className="text-sm font-medium opacity-80">{t('framingham:riskScoreLabel')}</p>
              <p className="text-3xl font-bold mt-1">{Number(result.risk_score).toFixed(1)}%</p>
              <p className="text-sm font-medium mt-4">{t('framingham:categoryLabel')}</p>
              <p className="text-lg font-semibold">{catLabel(result.risk_category)}</p>
              <p className="mt-3 text-sm">{result.risk_category_description}</p>
            </div>

            {result.factor_breakdown && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">{t('framingham:breakdownTitle')}</h3>
                <ul className="text-sm space-y-2 text-gray-700">
                  <li>
                    {t('framingham:factorAge')}: {Number(result.factor_breakdown.age_factor).toFixed(2)}
                  </li>
                  <li>
                    {t('framingham:factorCholesterol')}:{' '}
                    {Number(result.factor_breakdown.cholesterol_factor).toFixed(2)}
                  </li>
                  <li>
                    {t('framingham:factorBloodPressure')}:{' '}
                    {Number(result.factor_breakdown.blood_pressure_factor).toFixed(2)}
                  </li>
                  <li>
                    {t('framingham:factorSmoking')}: {Number(result.factor_breakdown.smoking_factor).toFixed(2)}
                  </li>
                  <li>
                    {t('framingham:factorDiabetes')}: {Number(result.factor_breakdown.diabetes_factor).toFixed(2)}
                  </li>
                </ul>
              </div>
            )}

            {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">{t('framingham:recommendationsTitle')}</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {result.recommendations.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-gray-500 border-t pt-4">
              <p className="font-medium text-gray-700 mb-1">{t('framingham:disclaimerTitle')}</p>
              <p>{result.disclaimer}</p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default FraminghamRisk;
