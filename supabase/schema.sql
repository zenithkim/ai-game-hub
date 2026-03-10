-- ============================================
-- AI Game Hub - Supabase Schema (멱등성 보장)
-- 여러 번 실행해도 에러 나지 않습니다
-- ============================================

-- 1. Creators (프로필 테이블 - auth.users 확장)
create table if not exists public.creators (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  avatar_url text,
  revenue_total numeric(12,2) default 0,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- 2. Games
create table if not exists public.games (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  url text not null,
  thumbnail text,
  creator_id uuid references public.creators(id) on delete cascade not null,
  category text default 'etc',
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  play_count int default 0,
  ad_impressions int default 0,
  created_at timestamptz default now()
);

-- 3. Plays (플레이 기록)
create table if not exists public.plays (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  duration int default 0,
  device text,
  created_at timestamptz default now()
);

-- 4. Reactions (좋아요/싫어요)
create table if not exists public.reactions (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('like', 'dislike')),
  created_at timestamptz default now(),
  unique(game_id, user_id)
);

-- 5. Comments (댓글)
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- comments.user_id → creators.id FK 추가 (조인용)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'comments_user_id_creators_fkey'
  ) then
    alter table public.comments
      add constraint comments_user_id_creators_fkey
      foreign key (user_id) references public.creators(id) on delete cascade;
  end if;
end $$;

-- ============================================
-- Indexes (이미 있으면 스킵)
-- ============================================
create index if not exists idx_games_creator on public.games(creator_id);
create index if not exists idx_games_status on public.games(status);
create index if not exists idx_games_category on public.games(category);
create index if not exists idx_plays_game on public.plays(game_id);
create index if not exists idx_plays_user on public.plays(user_id);
create index if not exists idx_reactions_game on public.reactions(game_id);
create index if not exists idx_reactions_user on public.reactions(user_id);
create index if not exists idx_comments_game on public.comments(game_id);
create index if not exists idx_comments_user on public.comments(user_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table public.creators enable row level security;
alter table public.games enable row level security;
alter table public.plays enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;

-- 기존 정책 삭제 후 재생성
drop policy if exists "Public read creators" on public.creators;
drop policy if exists "Users update own profile" on public.creators;
drop policy if exists "Users insert own profile" on public.creators;
drop policy if exists "Public read approved games" on public.games;
drop policy if exists "Creators insert games" on public.games;
drop policy if exists "Creators update own games" on public.games;
drop policy if exists "Creators delete own games" on public.games;
drop policy if exists "Admin full access games" on public.games;
drop policy if exists "Anyone can insert plays" on public.plays;
drop policy if exists "Read own plays" on public.plays;

-- Creators: 누구나 읽기 가능, 본인만 수정
create policy "Public read creators" on public.creators for select using (true);
create policy "Users update own profile" on public.creators for update using (auth.uid() = id);
create policy "Users insert own profile" on public.creators for insert with check (auth.uid() = id);

-- Games: 승인된 게임은 누구나 읽기, 본인 게임 CRUD
create policy "Public read approved games" on public.games for select using (status = 'approved' or creator_id = auth.uid());
create policy "Creators insert games" on public.games for insert with check (auth.uid() = creator_id);
create policy "Creators update own games" on public.games for update using (auth.uid() = creator_id);
create policy "Creators delete own games" on public.games for delete using (auth.uid() = creator_id);

-- Admin: 모든 게임 접근 (is_admin 체크)
create policy "Admin full access games" on public.games for all using (
  exists (select 1 from public.creators where id = auth.uid() and is_admin = true)
);

-- Reactions: 누구나 읽기, 로그인 유저 쓰기/수정/삭제
drop policy if exists "Public read reactions" on public.reactions;
drop policy if exists "Users manage own reactions" on public.reactions;
create policy "Public read reactions" on public.reactions for select using (true);
create policy "Users manage own reactions" on public.reactions for all using (auth.uid() = user_id);

-- Comments: 누구나 읽기, 로그인 유저 쓰기, 본인 댓글만 수정/삭제
drop policy if exists "Public read comments" on public.comments;
drop policy if exists "Users insert comments" on public.comments;
drop policy if exists "Users update own comments" on public.comments;
drop policy if exists "Users delete own comments" on public.comments;
create policy "Public read comments" on public.comments for select using (true);
create policy "Users insert comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users update own comments" on public.comments for update using (auth.uid() = user_id);
create policy "Users delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Plays: 누구나 쓰기, 읽기는 게임 소유자 또는 본인
create policy "Anyone can insert plays" on public.plays for insert with check (true);
create policy "Read own plays" on public.plays for select using (
  user_id = auth.uid() or
  game_id in (select id from public.games where creator_id = auth.uid()) or
  exists (select 1 from public.creators where id = auth.uid() and is_admin = true)
);

-- ============================================
-- Function: 플레이 카운트 증가
-- ============================================
create or replace function increment_play_count(gid uuid)
returns void as $$
begin
  update public.games set play_count = play_count + 1 where id = gid;
end;
$$ language plpgsql security definer;

-- ============================================
-- Trigger: 회원가입 시 자동 creators 프로필 생성
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.creators (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이미 가입한 유저 → creators에 추가
insert into public.creators (id, name, email)
select id, coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)), email
from auth.users
where id not in (select id from public.creators)
on conflict (id) do nothing;

-- ============================================
-- Admin 계정 설정
-- ============================================
update public.creators
set is_admin = true
where email = 'teto0525@naver.com';
