import React from 'react';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' }
];

export default function LanguagePicker({ onSelect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[300px] text-center">
        <h2 className="text-xl font-bold mb-4">Select Language</h2>
        <div className="flex flex-col gap-2">
          {LANGS.map(lang => (
            <button
              key={lang.code}
              className="py-2 px-4 rounded hover:bg-gray-100 text-lg"
              onClick={() => onSelect(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
