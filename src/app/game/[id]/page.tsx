'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Game } from '@/lib/supabase';
import AdBanner from '@/components/AdBanner';
import GameFeedback from '@/components/GameFeedback';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const startTime = useRef<number>(0);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params.id) fetchGame(params.id as string);
  }, [params.id]);

  // ESC키로 전체화면 해제
  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  async function fetchGame(id: string) {
    const { data, error } = await supabase
      .from('games')
      .select('*, creators(name, avatar_url)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setGame(data as Game);
    }
    setLoading(false);
  }

  async function handlePlay() {
    setShowAd(true);
  }

  async function startGame() {
    setShowAd(false);
    setPlaying(true);
    startTime.current = Date.now();

    // Record play after 3 seconds
    setTimeout(async () => {
      if (game) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('plays').insert({
          game_id: game.id,
          user_id: user?.id ?? null,
          device: /Mobile/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        });
        await supabase.rpc('increment_play_count', { gid: game.id });
      }
    }, 3000);
  }

  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      try {
        await gameContainerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fullscreen API not supported, use CSS fullscreen
        setIsFullscreen(true);
      }
    } else {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch {
        // ignore
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3" />
          <div className="aspect-video bg-gray-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😢</div>
        <h2 className="text-2xl font-bold mb-2">게임을 찾을 수 없어요</h2>
        <button onClick={() => router.push('/')} className="mt-4 px-6 py-3 bg-accent text-white rounded-xl">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className={isFullscreen ? '' : 'max-w-4xl mx-auto px-4 py-8'}>
      {/* Ad Interstitial */}
      {showAd && <AdBanner type="interstitial" onClose={startGame} />}

      {/* Game Header - 일반 모드에서만 표시 */}
      {!isFullscreen && (
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-white text-sm mb-4 flex items-center gap-1">
            ← 뒤로가기
          </button>
          <h1 className="text-3xl font-bold text-white">{game.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span>👤 {game.creators?.name ?? 'Anonymous'}</span>
            <span>▶ {game.play_count.toLocaleString()} plays</span>
            <span className="px-2 py-1 bg-card-bg border border-border rounded-lg text-xs">
              {game.category}
            </span>
          </div>
        </div>
      )}

      {/* Game Area */}
      {playing ? (
        <div
          ref={gameContainerRef}
          className={
            isFullscreen
              ? 'fixed inset-0 z-[100] bg-black flex flex-col'
              : 'mb-6'
          }
        >
          {/* 전체화면 상단 미니 UI */}
          {isFullscreen && (
            <div className="flex items-center justify-between px-4 py-2 bg-black/90 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white font-medium truncate max-w-[200px]">
                  🎮 {game.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
                >
                  새 탭 ↗
                </a>
                <button
                  onClick={toggleFullscreen}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                  축소
                </button>
                <button
                  onClick={() => { setIsFullscreen(false); setPlaying(false); if (document.fullscreenElement) document.exitFullscreen(); }}
                  className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900/80 text-red-300 rounded-lg text-xs transition-colors"
                >
                  ✕ 닫기
                </button>
              </div>
            </div>
          )}

          {/* iframe */}
          <div className={
            isFullscreen
              ? 'flex-1 w-full'
              : 'game-iframe-container rounded-2xl overflow-hidden border border-border'
          }>
            <iframe
              src={game.url}
              title={game.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-popups"
              className={
                isFullscreen
                  ? 'w-full h-full border-none'
                  : 'w-full h-full'
              }
            />
          </div>

          {/* 일반 모드 하단 컨트롤 */}
          {!isFullscreen && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setPlaying(false)}
                className="px-4 py-2 bg-card-bg border border-border text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
              >
                ✕ 게임 닫기
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="px-4 py-2 bg-accent/20 hover:bg-accent/40 text-accent-light rounded-lg text-sm transition-colors flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                  전체 화면
                </button>
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-gray-500 hover:text-white text-sm transition-colors"
                >
                  새 탭에서 열기 ↗
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 relative">
          <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-2xl border border-border overflow-hidden flex items-center justify-center">
            {game.thumbnail ? (
              <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-8xl">🎮</div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button
                onClick={handlePlay}
                className="w-20 h-20 rounded-full bg-accent flex items-center justify-center glow-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Description - 일반 모드에서만 */}
      {!isFullscreen && game.description && (
        <div className="bg-card-bg border border-border rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">게임 설명</h3>
          <p className="text-gray-300 leading-relaxed">{game.description}</p>
        </div>
      )}

      {/* Feedback - 일반 모드에서만 */}
      {!isFullscreen && <GameFeedback gameId={game.id} />}

      {/* Ad Banner - 일반 모드에서만 */}
      {!isFullscreen && <div className="mt-6"><AdBanner /></div>}
    </div>
  );
}
