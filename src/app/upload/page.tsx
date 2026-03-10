'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, CATEGORIES } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    category: 'etc',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth');
      else setUser(data.user);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.url.startsWith('http')) {
      setError('올바른 URL을 입력해주세요 (https://...)');
      setLoading(false);
      return;
    }

    // creators 프로필이 없으면 먼저 생성
    if (!user) return;
    await supabase.from('creators').upsert({
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
      email: user.email!,
    }, { onConflict: 'id' });

    const { error: insertError } = await supabase.from('games').insert({
      title: form.title,
      description: form.description || null,
      url: form.url,
      thumbnail: form.thumbnail || null,
      creator_id: user?.id,
      category: form.category,
      status: 'pending',
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (!user) return null;

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">게임이 등록되었어요!</h2>
        <p className="text-gray-400 mb-6">관리자 승인 후 게임이 공개됩니다.</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => { setSuccess(false); setForm({ title: '', description: '', url: '', thumbnail: '', category: 'etc' }); }} className="px-6 py-3 bg-card-bg border border-border text-white rounded-xl">
            게임 더 올리기
          </button>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-accent text-white rounded-xl">
            대시보드 보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">게임 업로드</h1>
      <p className="text-gray-400 mb-8">AI로 만든 웹게임의 URL을 등록하세요.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Game URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">게임 URL *</label>
          <input
            type="url"
            required
            placeholder="https://your-game.vercel.app"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full px-4 py-3 bg-card-bg border border-border rounded-xl text-white placeholder-gray-600 focus:border-accent focus:outline-none"
          />
          <p className="text-xs text-gray-600 mt-1">iframe으로 실행 가능한 웹 게임 URL</p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">게임 제목 *</label>
          <input
            type="text"
            required
            placeholder="예: Space Invaders AI"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-3 bg-card-bg border border-border rounded-xl text-white placeholder-gray-600 focus:border-accent focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">설명</label>
          <textarea
            rows={3}
            placeholder="게임에 대한 간단한 설명"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-3 bg-card-bg border border-border rounded-xl text-white placeholder-gray-600 focus:border-accent focus:outline-none resize-none"
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">썸네일 URL</label>
          <input
            type="url"
            placeholder="https://example.com/thumbnail.png"
            value={form.thumbnail}
            onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
            className="w-full px-4 py-3 bg-card-bg border border-border rounded-xl text-white placeholder-gray-600 focus:border-accent focus:outline-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">카테고리</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.filter(c => !['all', 'popular', 'new'].includes(c.key)).map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setForm({ ...form, category: cat.key })}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  form.category === cat.key
                    ? 'bg-accent text-white'
                    : 'bg-card-bg border border-border text-gray-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white rounded-xl font-semibold text-lg transition-colors glow-button"
        >
          {loading ? '등록 중...' : '🚀 게임 등록하기'}
        </button>
      </form>
    </div>
  );
}
