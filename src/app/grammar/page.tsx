'use client';

import { useState, useCallback } from 'react';
import { useGrammarCollections } from '@/hooks/useGrammarCollections';
import { useGrammarProgress } from '@/hooks/useGrammarProgress';
import Link from 'next/link';

export default function GrammarPage() {
  const { collections, isLoading, addCollection, deleteCollection, exportAllCollections } = useGrammarCollections();
  const { getGrammarProgress } = useGrammarProgress();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddCollection = useCallback(async () => {
    if (!newCollectionName.trim()) return;
    addCollection(newCollectionName, newCollectionDescription || undefined);
    setNewCollectionName('');
    setNewCollectionDescription('');
    setShowAddForm(false);
  }, [newCollectionName, newCollectionDescription, addCollection]);

  const handleDelete = useCallback((id: string) => {
    deleteCollection(id);
    setDeletingId(null);
  }, [deleteCollection]);

  const handleExportAll = useCallback(async () => {
    const data = exportAllCollections();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
    element.setAttribute('download', `grammar-collections-${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [exportAllCollections]);

  const getProgressPercentage = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection || collection.grammarPoints.length === 0) return 0;
    
    const learnedCount = collection.grammarPoints.filter(point => {
      const progress = getGrammarProgress(point.id);
      return progress.learned;
    }).length;
    
    return Math.round((learnedCount / collection.grammarPoints.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto text-center pt-20">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (collections.length === 0 && !showAddForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Ngữ Pháp Tiếng Nhật</h1>
            <p className="text-gray-600">Học và luyện tập các điểm ngữ pháp quan trọng</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có bộ ngữ pháp nào</h2>
              <p className="text-gray-600 mb-6">Hãy tạo bộ ngữ pháp đầu tiên hoặc import từ file</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
            >
              + Tạo bộ ngữ pháp
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Ngữ Pháp Tiếng Nhật</h1>
            <p className="text-gray-600">{collections.length} bộ ngữ pháp</p>
          </div>
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            💾 Xuất tất cả
          </button>
        </div>

        {!showAddForm ? (
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full px-6 py-4 border-2 border-dashed border-indigo-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition text-indigo-600 font-medium flex items-center justify-center gap-2"
            >
              <span className="text-2xl">+</span> Tạo bộ ngữ pháp mới
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tạo bộ ngữ pháp mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên bộ ngữ pháp</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Ví dụ: N5 Cơ bản, N4 Ngữ pháp quan trọng"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCollection()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả (không bắt buộc)</label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Mô tả thêm về bộ ngữ pháp này..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddCollection}
                  disabled={!newCollectionName.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tạo
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCollectionName('');
                    setNewCollectionDescription('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {collections.map((collection) => {
            const progressPercentage = getProgressPercentage(collection.id);
            const grammarPointCount = collection.grammarPoints.length;
            
            return (
              <div
                key={collection.id}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-sm text-gray-600 mb-3">{collection.description}</p>
                    )}
                    <p className="text-sm text-gray-500">{grammarPointCount} điểm ngữ pháp</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">{progressPercentage}%</div>
                    <p className="text-xs text-gray-500">Đã học</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/grammar/${collection.id}`}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-medium text-sm"
                  >
                    ✏️ Sửa
                  </Link>
                  <Link
                    href={`/grammar/practice/${collection.id}`}
                    className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition font-medium text-sm"
                  >
                    📖 Luyện tập
                  </Link>
                  <button
                    onClick={() => {
                      const collection = collections.find(c => c.id);
                      if (collection) {
                        const element = document.createElement('a');
                        element.setAttribute(
                          'href',
                          'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify({ collections: [collection] }, null, 2))
                        );
                        element.setAttribute('download', `${collection.name}.json`);
                        element.style.display = 'none';
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }
                    }}
                    className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
                  >
                    💾 Xuất
                  </button>
                  {deletingId === collection.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(collection.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                      >
                        Xóa chắc chắn
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(collection.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm"
                    >
                      🗑️ Xóa
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
