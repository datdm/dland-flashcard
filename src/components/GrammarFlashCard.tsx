'use client';

import { useState } from 'react';
import { GrammarPoint } from '@/types';

interface GrammarFlashCardProps {
  point: GrammarPoint;
  isLearned: boolean;
  isFavorite: boolean;
  onMarkLearned: (id: string) => void;
  onMarkFavorite: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function GrammarFlashCard({
  point,
  isLearned,
  isFavorite,
  onMarkLearned,
  onMarkFavorite,
  onPrev,
  onNext,
}: GrammarFlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Flashcard with 3D flip animation */}
        <div
          style={{
            perspective: '1000px',
            height: '400px',
            cursor: 'pointer',
          }}
          onClick={() => setIsFlipped(!isFlipped)}
          className="mb-6 relative"
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.6s ease-in-out',
            }}
          >
            {/* Front - Grammar structure */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                width: '100%',
                height: '100%',
              }}
              className="bg-white rounded-2xl shadow-lg p-8 md:p-12 flex flex-col justify-center items-center cursor-pointer hover:shadow-xl transition relative overflow-hidden"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-600 rounded-full"></div>
                <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-blue-600 rounded-full"></div>
              </div>

              <div className="relative z-10 text-center w-full">
                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">
                  Ngữ Pháp
                </p>
                <p className="text-5xl md:text-6xl font-bold text-gray-900 font-serif mb-4">
                  {point.structure}
                </p>
                {point.level && (
                  <p className="text-lg text-gray-500">({point.level})</p>
                )}
                <p className="text-gray-400 text-sm mt-4">Nhấn để xem ý nghĩa</p>
              </div>

              {/* Flip indicator */}
              <div className="absolute top-4 right-4 text-gray-300 text-sm">
                ↻ Lật
              </div>
            </div>

            {/* Back - Meaning and explanation */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              className="bg-white rounded-2xl shadow-lg p-8 md:p-12 cursor-pointer hover:shadow-xl transition relative overflow-hidden"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-600 rounded-full"></div>
                <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-blue-600 rounded-full"></div>
              </div>

              {/* Wrapper to fix text mirroring - only wrap content, not background */}
              <div
                className="w-full h-full flex flex-col justify-center items-center"
              >
                <div className="relative z-10 text-center w-full">
                  <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-4">
                    Ý Nghĩa
                  </p>
                  <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {point.meaning}
                  </p>
                  {point.mnemonic && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-900">
                      <p className="font-semibold mb-1">💡 Mẹo nhớ:</p>
                      <p>{point.mnemonic}</p>
                    </div>
                  )}
                  {point.explanation && (
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      {point.explanation}
                    </p>
                  )}
                  <p className="text-gray-400 text-sm">Nhấn để xem cấu trúc</p>
                </div>

                {/* Flip indicator */}
                <div className="absolute top-4 right-4 text-gray-300 text-sm">
                  ↻ Lật
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Examples toggle */}
        {point.examples && point.examples.length > 0 && (
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="w-full px-4 py-3 border-2 border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium mb-6"
          >
            {showExamples ? '▼ Ẩn ví dụ' : '▶ Xem ví dụ'} ({point.examples.length})
          </button>
        )}

        {/* Examples */}
        {showExamples && point.examples && point.examples.length > 0 && (
          <div className="bg-indigo-50 rounded-2xl p-6 mb-6 space-y-4">
            <h3 className="font-bold text-gray-900 mb-4">Ví dụ:</h3>
            {point.examples.map((example) => (
              <div key={example.id} className="bg-white rounded-lg p-4 border border-indigo-100">
                <p className="font-serif text-lg text-gray-900 mb-2">{example.sentence}</p>
                {example.romaji && (
                  <p className="text-sm text-gray-600 italic mb-2">{example.romaji}</p>
                )}
                <p className="text-gray-700 mb-2">{example.meaning}</p>
                {example.breakdown && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <span className="font-semibold">Phân tích:</span> {example.breakdown}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => onMarkLearned(point.id)}
            className={`px-6 py-3 rounded-lg transition font-medium ${
              isLearned
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isLearned ? '✅ Đã học' : '⭕ Chưa học'}
          </button>
          <button
            onClick={() => onMarkFavorite(point.id)}
            className={`px-6 py-3 rounded-lg transition font-medium ${
              isFavorite
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isFavorite ? '❤️ Yêu thích' : '🤍 Thêm yêu thích'}
          </button>
        </div>

        <div className="mt-4 flex gap-3 justify-center">
          <button
            onClick={onPrev}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            ← Trước
          </button>
          <button
            onClick={onNext}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Tiếp theo →
          </button>
        </div>

        {/* Notes */}
        {point.notes && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-semibold mb-1">📝 Ghi chú:</p>
            <p>{point.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}