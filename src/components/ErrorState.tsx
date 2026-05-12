'use client';

interface ErrorStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  canRetry?: boolean;
}

export default function ErrorState({
  title = '❌ Đã xảy ra lỗi',
  message,
  actionLabel,
  onAction,
  canRetry = true,
}: ErrorStateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-red-200 bg-red-50 p-8">
      <h3 className="text-lg font-bold text-red-900 mb-2">{title}</h3>
      <p className="text-red-700 mb-4">{message}</p>
      {(canRetry || actionLabel) && (
        <div className="flex gap-3 flex-wrap">
          {canRetry && (
            <button
              onClick={onAction}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
            >
              🔄 Thử lại
            </button>
          )}
          {actionLabel && onAction && !canRetry && (
            <button
              onClick={onAction}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
