"use client";

import { FlashCardSettings } from "@/types";
import FieldSelector from "./FieldSelector";

interface FlashCardSettingsPanelProps {
  settings: FlashCardSettings;
  onSave: (settings: FlashCardSettings) => void;
  onClose: () => void;
}

export default function FlashCardSettingsPanel({
  settings,
  onSave,
  onClose,
}: FlashCardSettingsPanelProps) {
  const updateFront = (front: FlashCardSettings["front"]) => {
    onSave({ ...settings, front });
  };

  const updateBack = (back: FlashCardSettings["back"]) => {
    onSave({ ...settings, back });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Cài đặt hiển thị</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="space-y-5">
          <FieldSelector label="Mặt trước" settings={settings.front} onChange={updateFront} />
          <FieldSelector label="Mặt sau" settings={settings.back} onChange={updateBack} />

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-gray-800 block">🙈 Ẩn N5 Speed Master 語彙</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Tạm ẩn bộ từ vựng mẫu này khỏi danh sách ôn tập</span>
            </div>
            <button
              type="button"
              onClick={() => onSave({ ...settings, hideSuperMasterN5: !settings.hideSuperMasterN5 })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                settings.hideSuperMasterN5 ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.hideSuperMasterN5 ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Xong
        </button>
      </div>
    </div>
  );
}
