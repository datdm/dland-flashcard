'use client';

import { GrammarPoint } from '@/types';

interface GrammarPointCardProps {
  point: GrammarPoint;
  isLearned: boolean;
  isFavorite: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkLearned?: (id: string) => void;
  onMarkFavorite?: (id: string) => void;
  compact?: boolean;
}

export default function GrammarPointCard({
  point,
  isLearned,
  isFavorite,
  onEdit,
  onDelete,
  onMarkLearned,
  onMarkFavorite,
  compact = false,
}: GrammarPointCardProps) {
  if (compact) {
    // Compact version for list views
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 font-serif">{point.structure}</h3>
              {point.level && (
                <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded whitespace-nowrap">
                  {point.level}
                </span>
              )}
            </div>
            <p className="text-gray-700 text-sm">{point.meaning}</p>
            {point.mnemonic && (
              <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-2 inline-block">
                💡 {point.mnemonic}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLearned && <span className="text-sm">✅</span>}
            {isFavorite && <span className="text-lg">❤️</span>}
          </div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-bold text-gray-900 font-serif">{point.structure}</h3>
            {point.level && (
              <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                {point.level}
              </span>
            )}
          </div>
          <p className="text-lg text-gray-700 mb-2">{point.meaning}</p>
          {point.mnemonic && (
            <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-2">
              💡 Mẹo: {point.mnemonic}
            </p>
          )}
          {point.explanation && (
            <p className="text-gray-600 text-sm mb-2">{point.explanation}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            {isLearned ? (
              <span className="text-lg">✅ Đã học</span>
            ) : (
              <span className="text-lg text-gray-400">⭕ Chưa</span>
            )}
          </div>
          {isFavorite && <span className="text-2xl">❤️</span>}
        </div>
      </div>

      {/* Examples */}
      {point.examples && point.examples.length > 0 && (
        <div className="mb-4 pl-4 border-l-4 border-indigo-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Ví dụ:</p>
          <div className="space-y-2 text-sm">
            {point.examples.map((example) => (
              <div key={example.id}>
                <p className="font-serif text-gray-900">{example.sentence}</p>
                {example.romaji && <p className="text-gray-600 italic text-xs">{example.romaji}</p>}
                <p className="text-gray-700">{example.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(onEdit || onDelete || onMarkLearned || onMarkFavorite) && (
        <div className="flex gap-2 pt-4 border-t border-gray-200 flex-wrap">
          {onMarkLearned && (
            <button
              onClick={() => onMarkLearned(point.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isLearned
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isLearned ? '✅ Đã học' : '⭕ Chưa học'}
            </button>
          )}
          {onMarkFavorite && (
            <button
              onClick={() => onMarkFavorite(point.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isFavorite
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isFavorite ? '❤️ Yêu thích' : '🤍 Thêm yêu thích'}
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(point.id)}
              className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition"
            >
              ✏️ Sửa
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(point.id)}
              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
            >
              🗑️ Xóa
            </button>
          )}
        </div>
      )}
    </div>
  );
}
