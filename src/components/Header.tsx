'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <span className="text-xl font-bold gradient-text">AI Game Hub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">홈</Link>
          <Link href="/upload" className="hover:text-white transition-colors">게임 업로드</Link>
          {user && (
            <Link href="/dashboard" className="hover:text-white transition-colors">대시보드</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold"
              >
                {user.email?.[0].toUpperCase() ?? '?'}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card-bg border border-border rounded-xl shadow-xl py-2">
                  <div className="px-4 py-2 text-xs text-gray-500 truncate">{user.email}</div>
                  <Link href="/dashboard" className="block px-4 py-2 text-sm hover:bg-card-hover" onClick={() => setMenuOpen(false)}>
                    대시보드
                  </Link>
                  <Link href="/upload" className="block px-4 py-2 text-sm hover:bg-card-hover" onClick={() => setMenuOpen(false)}>
                    게임 업로드
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-card-hover">
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-white text-sm rounded-lg transition-colors"
            >
              로그인
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
