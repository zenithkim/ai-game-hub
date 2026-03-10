'use client';

import { useEffect, useState } from 'react';
import { supabase, CATEGORIES } from '@/lib/supabase';
import type { Game } from '@/lib/supabase';
import GameCard from '@/components/GameCard';
import CategoryFilter from '@/components/CategoryFilter';

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, [category]);

  async function fetchGames() {
    setLoading(true);
    let query = supabase
      .from('games')
      .select('*, creators(name, avatar_url)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (category === 'popular') {
      query = supabase
        .from('games')
        .select('*, creators(name, avatar_url)')
        .eq('status', 'approved')
        .order('play_count', { ascending: false });
    } else if (category === 'new') {
      query = supabase
        .from('games')
        .select('*, creators(name, avatar_url)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);
    } else if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query.limit(50);
    if (!error && data) {
      setGames(data as Game[]);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center py-12 mb-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="gradient-text">AI Game Hub</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          AI로 만든 미니 웹게임을 발견하고 플레이하세요.<br />
          다운로드 없이, 바로 시작.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <a href="#games" className="px-6 py-3 bg-accent hover:bg-accent/80 text-white rounded-xl font-medium transition-colors glow-button">
            🎮 게임 탐색
          </a>
          <a href="/upload" className="px-6 py-3 bg-card-bg border border-border hover:bg-card-hover text-white rounded-xl font-medium transition-colors">
            ⬆️ 게임 업로드
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '게임', value: games.length, icon: '🎮' },
          { label: '총 플레이', value: games.reduce((s, g) => s + g.play_count, 0), icon: '▶' },
          { label: '크리에이터', value: new Set(games.map(g => g.creator_id)).size, icon: '👤' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card-bg border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Category Filter */}
      <section id="games" className="mb-6">
        <CategoryFilter selected={category} onSelect={setCategory} />
      </section>

      {/* Game Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card-bg border border-border rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">아직 게임이 없어요</h3>
            <p className="text-gray-600 mb-6">첫 번째 게임을 업로드해보세요!</p>
            <a href="/upload" className="px-6 py-3 bg-accent hover:bg-accent/80 text-white rounded-xl font-medium transition-colors">
              게임 업로드하기
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>

      {/* Google AdSense - 하단 광고 */}
      <section className="mt-12 mb-8">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-1451750373170867"
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: '(adsbygoogle = window.adsbygoogle || []).push({});',
          }}
        />
      </section>
    </div>
  );
}
