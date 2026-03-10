'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        // Create creator profile
        await supabase.from('creators').insert({
          id: data.user.id,
          name: name || email.split('@')[0],
          email,
        });
        setMessage('가입 완료! 이메일 확인 후 로그인해주세요.');
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push('/');
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎮</div>
          <h1 className="text-2xl font-bold gradient-text">AI Game Hub</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login' ? '로그인하고 게임을 시작하세요' : '가입하고 게임을 업로드하세요'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Creator 이름"
                className="w-full px-4 py-3 bg-card-bg border border-border rounded-xl text-white placeholder-gray-600 focus:border-accent focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-card-bg border border-border rounded-xl text-white placeholder-gray-600 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">비밀번호</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className="w-full px-4 py-3 bg-card-bg border border-border rounded-xl text-white placeholder-gray-600 focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-900/20 border border-green-800 rounded-xl text-green-400 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
            className="text-sm text-gray-500 hover:text-accent-light transition-colors"
          >
            {mode === 'login' ? '계정이 없으신가요? 가입하기' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}
