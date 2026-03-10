'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Comment } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type Props = {
  gameId: string;
};

export default function GameFeedback({ gameId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myReaction, setMyReaction] = useState<'like' | 'dislike' | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchReactions();
    fetchComments();
  }, [gameId]);

  async function fetchReactions() {
    const { data } = await supabase
      .from('reactions')
      .select('*')
      .eq('game_id', gameId);

    if (data) {
      setLikes(data.filter(r => r.type === 'like').length);
      setDislikes(data.filter(r => r.type === 'dislike').length);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const mine = data.find(r => r.user_id === user.id);
        setMyReaction(mine?.type ?? null);
      }
    }
  }

  async function handleReaction(type: 'like' | 'dislike') {
    if (!user) return;

    if (myReaction === type) {
      // 같은 버튼 다시 누르면 취소
      await supabase.from('reactions').delete().eq('game_id', gameId).eq('user_id', user.id);
      setMyReaction(null);
    } else {
      // upsert: 새로 누르거나 변경
      await supabase.from('reactions').upsert(
        { game_id: gameId, user_id: user.id, type },
        { onConflict: 'game_id,user_id' }
      );
      setMyReaction(type);
    }
    fetchReactions();
  }

  async function fetchComments() {
    // comments.user_id → creators.id 로 조인 (같은 UUID)
    const { data, error } = await supabase
      .from('comments')
      .select('*, creators!comments_user_id_fkey(name, avatar_url)')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (error) {
      // 조인 실패 시 creators 없이 조회
      const { data: fallback } = await supabase
        .from('comments')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });
      if (fallback) setComments(fallback as Comment[]);
    } else if (data) {
      setComments(data as Comment[]);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setLoading(true);

    const { error } = await supabase.from('comments').insert({
      game_id: gameId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      alert(`댓글 등록 실패: ${error.message}`);
    } else {
      setNewComment('');
    }
    await fetchComments();
    setLoading(false);
  }

  async function handleUpdateComment(commentId: string) {
    if (!editContent.trim()) return;
    setLoading(true);

    await supabase
      .from('comments')
      .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq('id', commentId);

    setEditingId(null);
    setEditContent('');
    await fetchComments();
    setLoading(false);
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('댓글을 삭제할까요?')) return;

    await supabase.from('comments').delete().eq('id', commentId);
    await fetchComments();
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  }

  return (
    <div className="space-y-6">
      {/* 좋아요/싫어요 */}
      <div className="bg-card-bg border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">이 게임 어땠나요?</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleReaction('like')}
            disabled={!user}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              myReaction === 'like'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-lg">👍</span>
            <span>{likes}</span>
          </button>
          <button
            onClick={() => handleReaction('dislike')}
            disabled={!user}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              myReaction === 'dislike'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-lg">👎</span>
            <span>{dislikes}</span>
          </button>
          {!user && (
            <a href="/auth" className="text-xs text-gray-600 hover:text-accent-light ml-2">
              로그인하고 반응 남기기
            </a>
          )}
        </div>
      </div>

      {/* 댓글 */}
      <div className="bg-card-bg border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">
          댓글 <span className="text-accent-light">{comments.length}</span>
        </h3>

        {/* 댓글 작성 */}
        {user ? (
          <form onSubmit={handleAddComment} className="mb-6">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 남겨보세요..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-border rounded-xl text-white placeholder-gray-600 focus:border-accent focus:outline-none resize-none text-sm"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={loading || !newComment.trim()}
                    className="px-4 py-2 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                  >
                    {loading ? '등록 중...' : '댓글 등록'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-white/5 rounded-xl text-center">
            <a href="/auth" className="text-sm text-accent-light hover:underline">
              로그인하고 댓글을 남겨보세요
            </a>
          </div>
        )}

        {/* 댓글 목록 */}
        {comments.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-4">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isOwner = user?.id === comment.user_id;
              const isEditing = editingId === comment.id;
              const isEdited = comment.updated_at !== comment.created_at;

              return (
                <div key={comment.id} className="flex gap-3 group">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    {comment.creators?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {comment.creators?.name ?? 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-600">
                        {timeAgo(comment.created_at)}
                      </span>
                      {isEdited && (
                        <span className="text-xs text-gray-700">(수정됨)</span>
                      )}
                    </div>

                    {isEditing ? (
                      <div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-white/5 border border-accent rounded-lg text-white text-sm resize-none focus:outline-none"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={loading}
                            className="px-3 py-1.5 bg-accent hover:bg-accent/80 text-white rounded-lg text-xs"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditContent(''); }}
                            className="px-3 py-1.5 bg-white/5 text-gray-400 hover:text-white rounded-lg text-xs"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}

                    {/* 수정/삭제 버튼 - 본인 댓글만 */}
                    {isOwner && !isEditing && (
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                          className="text-xs text-gray-600 hover:text-accent-light"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-gray-600 hover:text-red-400"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
