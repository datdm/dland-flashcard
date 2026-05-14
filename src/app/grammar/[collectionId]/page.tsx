'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useGrammarCollections } from '@/hooks/useGrammarCollections';
import { useGrammarProgress } from '@/hooks/useGrammarProgress';
import Link from 'next/link';

export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { isLoading, getCollectionById, addGrammarPoint, updateGrammarPoint, deleteGrammarPoint, addExample, deleteExample } = useGrammarCollections();
  const { getGrammarProgress } = useGrammarProgress();

  const [showAddPoint, setShowAddPoint] = useState(false);
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [deletingPointId, setDeletingPointId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add grammar point form
  const [pointForm, setPointForm] = useState({
    structure: '',
    meaning: '',
    explanation: '',
    mnemonic: '',
    level: 'N5',
    notes: '',
  });

  // Add example form
  const [exampleForm, setExampleForm] = useState({
    sentence: '',
    romaji: '',
    meaning: '',
    breakdown: '',
  });
  const [addingExampleTo, setAddingExampleTo] = useState<string | null>(null);

  const resetPointForm = useCallback(() => {
    setPointForm({
      structure: '',
      meaning: '',
      explanation: '',
      mnemonic: '',
      level: 'N5',
      notes: '',
    });
    setEditingPointId(null);
    setShowAddPoint(false);
  }, []);

  const handleSubmitPoint = useCallback(() => {
    if (!pointForm.structure.trim() || !pointForm.meaning.trim()) return;

    const payload = {
        structure: pointForm.structure,
        meaning: pointForm.meaning,
        explanation: pointForm.explanation || undefined,
        mnemonic: pointForm.mnemonic || undefined,
        level: pointForm.level || undefined,
        notes: pointForm.notes || undefined,
      };

    if (editingPointId) {
      updateGrammarPoint(collectionId, editingPointId, payload);
    } else {
      addGrammarPoint(collectionId, payload);
    }

    resetPointForm();
  }, [pointForm, collectionId, editingPointId, addGrammarPoint, updateGrammarPoint, resetPointForm]);

  const handleStartEditPoint = useCallback((pointId: string) => {
    const point = getCollectionById(collectionId)?.grammarPoints.find((item) => item.id === pointId);
    if (!point) return;

    setPointForm({
      structure: point.structure,
      meaning: point.meaning,
      explanation: point.explanation || '',
      mnemonic: point.mnemonic || '',
      level: point.level || 'N5',
      notes: point.notes || '',
    });
    setEditingPointId(point.id);
    setShowAddPoint(true);
  }, [collectionId, getCollectionById]);

  const handleAddExample = useCallback((pointId: string) => {
    if (!exampleForm.sentence.trim() || !exampleForm.meaning.trim()) return;

    addExample(
      collectionId,
      pointId,
      {
        sentence: exampleForm.sentence,
        meaning: exampleForm.meaning,
        romaji: exampleForm.romaji || undefined,
        breakdown: exampleForm.breakdown || undefined,
      }
    );

    setExampleForm({
      sentence: '',
      romaji: '',
      meaning: '',
      breakdown: '',
    });
    setAddingExampleTo(null);
  }, [exampleForm, collectionId, addExample]);

  const handleDeletePoint = useCallback((pointId: string) => {
    deleteGrammarPoint(collectionId, pointId);
    setDeletingPointId(null);
  }, [collectionId, deleteGrammarPoint]);

  const handleDeleteExample = useCallback((pointId: string, exampleId: string) => {
    deleteExample(collectionId, pointId, exampleId);
  }, [collectionId, deleteExample]);

  const collection = getCollectionById(collectionId);

  // Calculate paginated points
  const totalPages = Math.ceil((collection?.grammarPoints.length || 0) / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedPoints = collection?.grammarPoints.slice(startIdx, startIdx + itemsPerPage) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/grammar" className="text-2xl hover:opacity-70">
              ←
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{collection.name}</h1>
              {collection.description && (
                <p className="text-gray-600 mt-2">{collection.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{collection.grammarPoints.length} điểm ngữ pháp</p>
            </div>
          </div>
          <Link
            href={`/grammar/practice/${collectionId}`}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium whitespace-nowrap"
          >
            🎯 Luyện tập
          </Link>
        </div>

        {/* Add new grammar point button */}
        {!showAddPoint && (
          <button
            onClick={() => {
              setEditingPointId(null);
              setShowAddPoint(true);
            }}
            className="w-full mb-6 px-6 py-4 border-2 border-dashed border-indigo-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition text-indigo-600 font-medium flex items-center justify-center gap-2"
          >
            <span className="text-2xl">+</span> Thêm điểm ngữ pháp
          </button>
        )}

        {/* Add point form */}
        {showAddPoint && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPointId ? 'Chỉnh sửa điểm ngữ pháp' : 'Thêm điểm ngữ pháp mới'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cấu trúc *</label>
                  <input
                    type="text"
                    value={pointForm.structure}
                    onChange={(e) => setPointForm({ ...pointForm, structure: e.target.value })}
                    placeholder="Ví dụ: ～ている, ～はずだ"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trình độ</label>
                  <select
                    value={pointForm.level}
                    onChange={(e) => setPointForm({ ...pointForm, level: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ý nghĩa *</label>
                <input
                  type="text"
                  value={pointForm.meaning}
                  onChange={(e) => setPointForm({ ...pointForm, meaning: e.target.value })}
                  placeholder="Ý nghĩa chính của cấu trúc"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giải thích</label>
                <textarea
                  value={pointForm.explanation}
                  onChange={(e) => setPointForm({ ...pointForm, explanation: e.target.value })}
                  placeholder="Giải thích chi tiết về cấu trúc này..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mẹo nhớ</label>
                <input
                  type="text"
                  value={pointForm.mnemonic}
                  onChange={(e) => setPointForm({ ...pointForm, mnemonic: e.target.value })}
                  placeholder="Cách ghi nhớ dễ dàng..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  value={pointForm.notes}
                  onChange={(e) => setPointForm({ ...pointForm, notes: e.target.value })}
                  placeholder="Ghi chú thêm..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-16"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitPoint}
                  disabled={!pointForm.structure.trim() || !pointForm.meaning.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPointId ? 'Lưu thay đổi' : 'Thêm'}
                </button>
                <button
                  onClick={resetPointForm}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grammar points list */}
        {collection.grammarPoints.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">Bộ ngữ pháp này chưa có điểm nào</p>
            <button
              onClick={() => {
                setEditingPointId(null);
                setShowAddPoint(true);
              }}
              className="text-indigo-600 hover:underline font-medium"
            >
              Thêm điểm ngữ pháp đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedPoints.map((point) => {
              const progress = getGrammarProgress(point.id);
              return (
                <div key={point.id} className="bg-white rounded-2xl shadow-sm p-6">
                  {/* Point header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900 font-serif">{point.structure}</h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                          {point.level || 'N5'}
                        </span>
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
                        {progress.learned ? (
                          <span className="text-lg">✅ Đã học</span>
                        ) : (
                          <span className="text-lg text-gray-400">⭕ Chưa học</span>
                        )}
                      </div>
                      {progress.favorite && <span className="text-2xl">❤️</span>}
                    </div>
                  </div>

                  {/* Examples */}
                  {point.examples && point.examples.length > 0 && (
                    <div className="mb-4 pl-4 border-l-4 border-indigo-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Ví dụ:</p>
                      <div className="space-y-3">
                        {point.examples.map((example) => (
                          <div key={example.id} className="text-sm">
                            <p className="font-serif text-gray-900 mb-1">{example.sentence}</p>
                            {example.romaji && <p className="text-gray-600 italic mb-1">{example.romaji}</p>}
                            <p className="text-gray-700 mb-1">{example.meaning}</p>
                            {example.breakdown && (
                              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                Phân tích: {example.breakdown}
                              </p>
                            )}
                            <button
                              onClick={() => handleDeleteExample(point.id, example.id)}
                              className="text-xs text-red-600 hover:text-red-700 mt-1"
                            >
                              Xóa ví dụ
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add example or show add form */}
                  {addingExampleTo === point.id ? (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="space-y-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Câu *</label>
                          <input
                            type="text"
                            value={exampleForm.sentence}
                            onChange={(e) => setExampleForm({ ...exampleForm, sentence: e.target.value })}
                            placeholder="Câu ví dụ tiếng Nhật"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Romaji</label>
                          <input
                            type="text"
                            value={exampleForm.romaji}
                            onChange={(e) => setExampleForm({ ...exampleForm, romaji: e.target.value })}
                            placeholder="Cách đọc romaji (không bắt buộc)"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Ý nghĩa *</label>
                          <input
                            type="text"
                            value={exampleForm.meaning}
                            onChange={(e) => setExampleForm({ ...exampleForm, meaning: e.target.value })}
                            placeholder="Ý nghĩa tiếng Việt"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Phân tích</label>
                          <input
                            type="text"
                            value={exampleForm.breakdown}
                            onChange={(e) => setExampleForm({ ...exampleForm, breakdown: e.target.value })}
                            placeholder="Phân tích thành phần (không bắt buộc)"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddExample(point.id)}
                          disabled={!exampleForm.sentence.trim() || !exampleForm.meaning.trim()}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          Thêm
                        </button>
                        <button
                          onClick={() => {
                            setAddingExampleTo(null);
                            setExampleForm({
                              sentence: '',
                              romaji: '',
                              meaning: '',
                              breakdown: '',
                            });
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingExampleTo(point.id)}
                      className="text-sm text-indigo-600 hover:underline mb-4 font-medium"
                    >
                      + Thêm ví dụ
                    </button>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleStartEditPoint(point.id)}
                      className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition font-medium text-sm"
                    >
                      📝 Sửa
                    </button>
                    {deletingPointId === point.id ? (
                      <div className="flex gap-2 flex-1">
                        <button
                          onClick={() => handleDeletePoint(point.id)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                        >
                          Xóa chắc chắn
                        </button>
                        <button
                          onClick={() => setDeletingPointId(null)}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingPointId(point.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm"
                      >
                        🗑️ Xóa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination - outside the loop */}
            {collection.grammarPoints.length > itemsPerPage && (
              <div className="flex gap-2 justify-center pt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Trước
                </button>
                <span className="px-6 py-3 text-sm text-gray-600 font-medium text-center bg-gray-50 rounded-lg">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tiếp theo →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
