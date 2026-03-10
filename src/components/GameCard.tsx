'use client';

import Link from 'next/link';
import type { Game } from '@/lib/supabase';

export default function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/game/${game.id}`} className="game-card block group">
      <div className="bg-card-bg border border-border rounded-2xl overflow-hidden">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-purple-900/30 to-cyan-900/30 overflow-hidden">
          {game.thumbnail ? (
            <img
              src={game.thumbnail}
              alt={game.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🎮
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          {/* Category badge */}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white">
              {getCategoryEmoji(game.category)} {game.category}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white truncate">{game.title}</h3>
          {game.description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{game.description}</p>
          )}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span>▶</span> {game.play_count.toLocaleString()} plays
            </span>
            <span>{game.creators?.name ?? 'Anonymous'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getCategoryEmoji(category: string) {
  const map: Record<string, string> = {
    popular: '🔥',
    quick: '⚡',
    puzzle: '🧠',
    ai: '🤖',
    weird: '🌀',
    new: '🆕',
    etc: '🎲',
  };
  return map[category] ?? '🎮';
}
