'use client';

type Props = {
  type?: 'banner' | 'interstitial';
  onClose?: () => void;
};

export default function AdBanner({ type = 'banner', onClose }: Props) {
  if (type === 'interstitial') {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
        <div className="bg-card-bg border border-border rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-sm text-gray-500 mb-4">광고</div>
          <div className="w-full h-48 bg-gradient-to-br from-purple-900/20 to-cyan-900/20 rounded-xl flex items-center justify-center mb-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Ad Space</p>
              <p className="text-gray-600 text-xs mt-1">Google AdSense</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-accent hover:bg-accent/80 text-white rounded-xl font-medium transition-colors"
          >
            게임 시작하기 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-card-bg border border-border rounded-xl p-4 text-center">
      <p className="text-xs text-gray-600">Sponsored</p>
      <div className="h-16 flex items-center justify-center text-gray-500 text-sm">
        Ad Space — Google AdSense
      </div>
    </div>
  );
}
