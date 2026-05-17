'use client';

import { useState, useEffect } from 'react';
import * as syncService from '@/lib/syncService';

type DialogState = 'closed' | 'login' | 'register' | 'choose-direction' | 'syncing' | 'complete' | 'error';

interface SyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export default function SyncDialog({ isOpen, onClose, onSyncComplete }: SyncDialogProps) {
  const [state, setState] = useState<DialogState>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [hasLocalData, setHasLocalData] = useState(false);
  const [hasServerData, setHasServerData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const localData = syncService.detectLocalData();
      setHasLocalData(localData);
      
      if (syncService.checkAuthStatus()) {
        setState('choose-direction');
        checkServerData();
      } else {
        setState(localData ? 'login' : 'register');
      }
    }
  }, [isOpen]);

  const checkServerData = async () => {
    const { hasData } = await syncService.hasServerData();
    setHasServerData(hasData);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setState('syncing');
    setError('');

    const result = await syncService.login(username, password);
    
    if (result.success) {
      await checkServerData();
      setState('choose-direction');
    } else {
      setError(result.error || 'Đăng nhập thất bại');
      setState('login');
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    if (username.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setState('syncing');
    setError('');

    const result = await syncService.register(username, password);
    
    if (result.success) {
      await checkServerData();
      setState('choose-direction');
    } else {
      setError(result.error || 'Đăng ký thất bại');
      setState('register');
    }
  };

  const handleUpload = async () => {
    setState('syncing');
    setError('');

    const result = await syncService.uploadToServer();
    
    if (result.success) {
      setState('complete');
      setTimeout(() => {
        onClose();
        onSyncComplete?.();
      }, 2000);
    } else {
      setError(result.error || 'Tải lên thất bại');
      setState('error');
    }
  };

  const handleDownload = async () => {
    setState('syncing');
    setError('');

    const result = await syncService.downloadFromServer();
    
    if (result.success) {
      setState('complete');
      setTimeout(() => {
        onClose();
        window.location.reload(); // Reload to refresh all data
      }, 2000);
    } else {
      setError(result.error || 'Tải xuống thất bại');
      setState('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        {state !== 'syncing' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            aria-label="Đóng"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Login State */}
        {state === 'login' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập</h2>
            <p className="text-gray-600 mb-6">
              Đăng nhập để đồng bộ dữ liệu của bạn
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="username"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleLogin}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => setState('register')}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Đăng ký
              </button>
            </div>
          </div>
        )}

        {/* Register State */}
        {state === 'register' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký</h2>
            <p className="text-gray-600 mb-6">
              Tạo tài khoản để đồng bộ dữ liệu
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đăng nhập (ít nhất 3 ký tự)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu (ít nhất 6 ký tự)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••"
                  onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRegister}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Đăng ký
              </button>
              <button
                onClick={() => setState('login')}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Quay lại
              </button>
            </div>
          </div>
        )}

        {/* Choose Direction State */}
        {state === 'choose-direction' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đồng bộ dữ liệu</h2>
            <p className="text-gray-600 mb-6">
              {hasLocalData && hasServerData
                ? 'Bạn có dữ liệu ở cả máy này và server. Chọn hướng đồng bộ:'
                : hasServerData
                ? 'Tìm thấy dữ liệu trên server. Tải về?'
                : hasLocalData
                ? 'Bạn có dữ liệu cục bộ. Tải lên server?'
                : 'Chưa có dữ liệu nào. Hãy bắt đầu học!'}
            </p>

            <div className="space-y-3">
              {hasServerData && (
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <span>📥</span>
                  <span>Tải dữ liệu từ server</span>
                </button>
              )}
              
              {hasLocalData && (
                <button
                  onClick={handleUpload}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <span>📤</span>
                  <span>Tải dữ liệu lên server</span>
                </button>
              )}

              {!hasLocalData && !hasServerData && (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Đóng
                </button>
              )}
            </div>

            {hasLocalData && hasServerData && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                ⚠️ Lưu ý: Dữ liệu hiện tại sẽ bị ghi đè. Hãy chắc chắn trước khi thực hiện.
              </div>
            )}
          </div>
        )}

        {/* Syncing State */}
        {state === 'syncing' && (
          <div className="text-center py-8">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium mt-4">Đang đồng bộ dữ liệu...</p>
          </div>
        )}

        {/* Complete State */}
        {state === 'complete' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đồng bộ thành công!</h2>
            <p className="text-gray-600">Dữ liệu của bạn đã được đồng bộ.</p>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Đồng bộ thất bại</h2>
              <p className="text-red-600">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setState('choose-direction')}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Thử lại
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
