'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useGrammarCollections } from '@/hooks/useGrammarCollections';
import { useGrammarProgress } from '@/hooks/useGrammarProgress';
import GrammarFlashCard from '@/components/GrammarFlashCard';
import Link from 'next/link';

type FilterType = 'all' | 'unlearned' | 'learned' | 'favorite';

export default function GrammarPracticePage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { isLoading, getCollectionById } = useGrammarCollections();
  const { toggleLearned, toggleFavorite, getGrammarProgress } = useGrammarProgress();

  const collection = getCollectionById(collectionId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isShuffled, setIsShuffled] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(collection?.grammarPoints || []);

  // Update display points when filter or shuffle changes
  useEffect(() => {
    if (!collection) return;

    let filtered = collection.grammarPoints;

    // Apply filter
    if (filter === 'learned') {
      filtered = filtered.filter((point) => getGrammarProgress(point.id).learned);
    } else if (filter === 'unlearned') {
      filtered = filtered.filter((point) => !getGrammarProgress(point.id).learned);
    } else if (filter === 'favorite') {
      filtered = filtered.filter((point) => getGrammarProgress(point.id).favorite);
    }

    // Apply shuffle
    if (isShuffled) {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }

    setDisplayPoints(filtered);
    setCurrentIndex(0);
  }, [filter, isShuffled, collection, getGrammarProgress]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % displayPoints.length);
  }, [displayPoints.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + displayPoints.length) % displayPoints.length);
  }, [displayPoints.length]);

  const handleMarkLearned = useCallback((id: string) => {
    toggleLearned(id);
  }, [toggleLearned]);

  const handleMarkFavorite = useCallback((id: string) => {
    toggleFavorite(id);
  }, [toggleFavorite]);

  const currentPoint = displayPoints.length > 0 ? displayPoints[currentIndex] : null;
  const currentProgress = currentPoint ? getGrammarProgress(currentPoint.id) : null;

  const stats = useMemo(() => {
    if (!collection) return { total: 0, learned: 0, unlearned: 0, favorite: 0 };
    const learnedCount = collection.grammarPoints.filter(
      (point) => getGrammarProgress(point.id).learned
    ).length;
    return {
      total: collection.grammarPoints.length,
      learned: learnedCount,
      unlearned: collection.grammarPoints.length - learnedCount,
      favorite: collection.grammarPoints.filter(
        (point) => getGrammarProgress(point.id).favorite
      ).length,
    };
  }, [collection, getGrammarProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Không tìm thấy bộ ngữ pháp</p>
          <Link href="/grammar" className="text-indigo-600 hover:underline mt-4 inline-block">
            ← Quay lại
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <Link
              href={`/grammar/${collectionId}`}
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 mb-2"
            >
              ← {collection.name}
            </Link>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>📊 {displayPoints.length} điểm (hiển thị)</span>
              <span>✅ {stats.learned}/{stats.total} đã học</span>
              <span>❤️ {stats.favorite} yêu thích</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {displayPoints.length === 0 ? (
          <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl text-gray-600 mb-4">Không có điểm ngữ pháp để hiển thị</p>
              <button
                onClick={() => setFilter('all')}
                className="text-indigo-600 hover:underline font-medium"
              >
                Xem tất cả
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto">
            {currentPoint && currentProgress && (
              <GrammarFlashCard
                point={currentPoint}
                isLearned={currentProgress.learned}
                isFavorite={currentProgress.favorite}
                onMarkLearned={handleMarkLearned}
                onMarkFavorite={handleMarkFavorite}
                onNext={handleNext}
                onPrev={handlePrev}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="bg-white border-t border-gray-200 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto space-y-4">
          {/* Progress bar */}
          {displayPoints.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${((currentIndex + 1) / displayPoints.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                {currentIndex + 1}/{displayPoints.length}
              </span>
            </div>
          )}

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({collection.grammarPoints.length})
            </button>
            <button
              onClick={() => setFilter('unlearned')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'unlearned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chưa học ({stats.unlearned})
            </button>
            <button
              onClick={() => setFilter('learned')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'learned'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã học ({stats.learned})
            </button>
            <button
              onClick={() => setFilter('favorite')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'favorite'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yêu thích ({stats.favorite})
            </button>
            <button
              onClick={() => setIsShuffled(!isShuffled)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isShuffled
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔀 {isShuffled ? 'Đã xáo' : 'Xáo trộn'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
