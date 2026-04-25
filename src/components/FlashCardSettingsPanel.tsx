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
