'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Game, Creator } from '@/lib/supabase';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalGames: 0, totalPlays: 0, totalCreators: 0 });

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) fetchGames();
  }, [isAdmin, tab]);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const { data } = await supabase
      .from('creators')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!data?.is_admin) {
      router.push('/');
      return;
    }
    setIsAdmin(true);

    // Fetch stats
    const { count: gameCount } = await supabase.from('games').select('*', { count: 'exact', head: true });
    const { count: creatorCount } = await supabase.from('creators').select('*', { count: 'exact', head: true });
    setStats({
      totalGames: gameCount ?? 0,
      totalPlays: 0,
      totalCreators: creatorCount ?? 0,
    });
  }

  async function fetchGames() {
    setLoading(true);
    const { data } = await supabase
      .from('games')
      .select('*, creators(name, email)')
      .eq('status', tab)
      .order('created_at', { ascending: false });
    setGames((data as Game[]) ?? []);
    setLoading(false);
  }

  async function updateGameStatus(gameId: string, status: 'approved' | 'rejected') {
    await supabase.from('games').update({ status }).eq('id', gameId);
    fetchGames();
  }

  async function deleteGame(gameId: string) {
    if (!confirm('정말 이 게임을 삭제하시겠어요?')) return;
    await supabase.from('games').delete().eq('id', gameId);
    fetchGames();
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">🛡️ Admin Panel</h1>
      <p className="text-gray-400 mb-8">게임 승인, 관리, 통계 확인</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '전체 게임', value: stats.totalGames, icon: '🎮' },
          { label: '크리에이터', value: stats.totalCreators, icon: '👤' },
          { label: '대기중', value: games.length, icon: '⏳' },
        ].map(s => (
          <div key={s.label} className="bg-card-bg border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'pending' as const, label: '⏳ 승인 대기', count: 0 },
          { key: 'approved' as const, label: '✅ 승인됨', count: 0 },
          { key: 'rejected' as const, label: '❌ 거절됨', count: 0 },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-accent text-white'
                : 'bg-card-bg border border-border text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Game List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="bg-card-bg border border-border rounded-xl p-8 text-center text-gray-400">
          {tab === 'pending' ? '승인 대기중인 게임이 없어요 ✨' : '게임이 없어요'}
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <div key={game.id} className="bg-card-bg border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-900/30 to-cyan-900/30 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {game.thumbnail ? (
                  <img src={game.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🎮</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{game.title}</h3>
                <div className="text-xs text-gray-500 mt-1">
                  {game.creators?.name} · {game.category} · {new Date(game.created_at).toLocaleDateString('ko')}
                </div>
                <a href={game.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-light hover:underline truncate block">
                  {game.url}
                </a>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {tab === 'pending' && (
                  <>
                    <button
                      onClick={() => updateGameStatus(game.id, 'approved')}
                      className="px-3 py-1.5 bg-green-900/30 text-green-400 hover:bg-green-900/50 rounded-lg text-sm"
                    >
                      ✅ 승인
                    </button>
                    <button
                      onClick={() => updateGameStatus(game.id, 'rejected')}
                      className="px-3 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg text-sm"
                    >
                      ❌ 거절
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteGame(game.id)}
                  className="px-3 py-1.5 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-lg text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
