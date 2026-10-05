"use client";

import { CardSideSettings, VocabField, ALL_FIELDS, getFieldLabels } from "@/types";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

interface FieldSelectorProps {
  label: string;
  settings: CardSideSettings;
  onChange: (settings: CardSideSettings) => void;
  langCode?: string;
}

export default function FieldSelector({ label, settings, onChange, langCode }: FieldSelectorProps) {
  const { activeLangCode } = useLanguageSetting();
  const effectiveLang = (langCode || activeLangCode || "ja").toLowerCase();
  const labels = getFieldLabels(effectiveLang);

  const toggle = (field: VocabField) => {
    onChange({ ...settings, [field]: !settings[field] });
  };

  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {ALL_FIELDS.map((field) => (
          <label
            key={field}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm transition-colors ${
              settings[field]
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-gray-300 text-gray-600 hover:border-indigo-400"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={settings[field]}
              onChange={() => toggle(field)}
            />
            {labels[field]}
          </label>
        ))}
      </div>
    </div>
  );
}
