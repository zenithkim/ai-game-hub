import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Game = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  creator_id: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  play_count: number;
  ad_impressions: number;
  created_at: string;
  creators?: Creator;
};

export type Creator = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  revenue_total: number;
  is_admin: boolean;
  created_at: string;
};

export type Play = {
  id: string;
  game_id: string;
  user_id: string | null;
  duration: number;
  device: string | null;
  created_at: string;
};

export type Reaction = {
  id: string;
  game_id: string;
  user_id: string;
  type: 'like' | 'dislike';
  created_at: string;
};

export type Comment = {
  id: string;
  game_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  creators?: { name: string; email?: string; avatar_url: string | null } | null;
};

// Categories
export const CATEGORIES = [
  { key: 'all', label: '🎮 전체', emoji: '🎮' },
  { key: 'popular', label: '🔥 인기', emoji: '🔥' },
  { key: 'quick', label: '⚡ 30초 게임', emoji: '⚡' },
  { key: 'puzzle', label: '🧠 퍼즐', emoji: '🧠' },
  { key: 'ai', label: '🤖 AI 실험', emoji: '🤖' },
  { key: 'weird', label: '🌀 Weird', emoji: '🌀' },
  { key: 'new', label: '🆕 신규', emoji: '🆕' },
  { key: 'etc', label: '🎲 기타', emoji: '🎲' },
] as const;
