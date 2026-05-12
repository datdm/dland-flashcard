'use client';

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export default function LoadingState({
  message = 'Đang tải...',
  fullPage = false,
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="inline-block">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
      {content}
    </div>
  );
}
