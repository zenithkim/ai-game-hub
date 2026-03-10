'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Game, Creator } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUser(user);

    // Get creator profile
    const { data: creatorData } = await supabase
      .from('creators')
      .select('*')
      .eq('id', user.id)
      .single();
    setCreator(creatorData as Creator);

    // Get my games
    const { data: gamesData } = await supabase
      .from('games')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    setGames((gamesData as Game[]) ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const totalPlays = games.reduce((s, g) => s + g.play_count, 0);
  const totalAds = games.reduce((s, g) => s + g.ad_impressions, 0);
  const estimatedRevenue = (totalPlays * 0.003 * 0.6).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Creator 대시보드</h1>
          <p className="text-gray-400 mt-1">{user?.email}</p>
        </div>
        <Link href="/upload" className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-xl text-sm transition-colors">
          + 게임 업로드
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '내 게임', value: games.length, icon: '🎮', color: 'from-purple-500/20' },
          { label: '총 플레이', value: totalPlays.toLocaleString(), icon: '▶', color: 'from-blue-500/20' },
          { label: '광고 노출', value: totalAds.toLocaleString(), icon: '📊', color: 'from-green-500/20' },
          { label: '예상 수익', value: `$${estimatedRevenue}`, icon: '💰', color: 'from-yellow-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} to-transparent bg-card-bg border border-border rounded-xl p-4`}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue formula */}
      <div className="bg-card-bg border border-border rounded-xl p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">💡 수익 산식</h3>
        <p className="text-xs text-gray-500">
          예상 수익 = 총 플레이 × $0.003 × Creator Share(60%)
        </p>
      </div>

      {/* My Games */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">내 게임</h2>
        {games.length === 0 ? (
          <div className="bg-card-bg border border-border rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">아직 등록한 게임이 없어요</p>
            <Link href="/upload" className="px-4 py-2 bg-accent text-white rounded-xl text-sm">
              첫 게임 올리기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <div key={game.id} className="bg-card-bg border border-border rounded-xl p-4 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-900/30 to-cyan-900/30 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {game.thumbnail ? (
                    <img src={game.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🎮</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white truncate">{game.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      game.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                      game.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {game.status === 'approved' ? '승인됨' : game.status === 'pending' ? '대기중' : '거절됨'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>▶ {game.play_count.toLocaleString()}</span>
                    <span>💰 ${(game.play_count * 0.003 * 0.6).toFixed(2)}</span>
                    <span>{game.category}</span>
                  </div>
                </div>

                {/* Actions */}
                <Link href={`/game/${game.id}`} className="text-gray-500 hover:text-white text-sm">
                  보기 →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
