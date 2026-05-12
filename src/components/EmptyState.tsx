'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
      <div className="mb-6">
        {icon && <div className="text-6xl mb-4">{icon}</div>}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {description && <p className="text-gray-600 mb-6">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
