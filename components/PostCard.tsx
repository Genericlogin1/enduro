'use client';

import { useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';

type Post = {
  id: string;
  content: string | null;
  media_urls: string[] | null;
  location: string | null;
  created_at: string;
  author_id: string;
  profiles: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
  likes: { user_id: string }[];
  comments: { id: string }[];
};

export default function PostCard({
  post,
  currentUserId,
  toggleLikeAction,
}: {
  post: Post;
  currentUserId?: string;
  toggleLikeAction: (postId: string) => Promise<void>;
}) {
  const initialLiked = !!currentUserId && post.likes.some(l => l.user_id === currentUserId);
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(post.likes.length);
  const [pending, startTransition] = useTransition();

  const author = post.profiles?.display_name || post.profiles?.username || 'rider';
  const handle = post.profiles?.username ? '@' + post.profiles.username : '';
  const avatar = post.profiles?.avatar_url;
  const initials = (author || 'R').slice(0, 2).toUpperCase();
  const time = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  function handleLike() {
    if (!currentUserId) return;
    const next = !liked;
    setLiked(next);
    setCount(c => c + (next ? 1 : -1));
    startTransition(async () => {
      try { await toggleLikeAction(post.id); } catch { setLiked(!next); setCount(c => c + (next ? -1 : 1)); }
    });
  }

  return (
    <article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3">
        {avatar ? (
          <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-semibold">{initials}</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{author}</div>
          <div className="text-xs text-zinc-500 truncate">
            {handle && <span>{handle} · </span>}
            {post.location && <span>{post.location} · </span>}
            <span>{time}</span>
          </div>
        </div>
      </header>

      {post.media_urls && post.media_urls.length > 0 && (
        <div className="grid grid-cols-1 gap-1 bg-black">
          {post.media_urls.slice(0, 3).map((url, i) => (
            url.match(/\.(mp4|webm|mov)$/i)
              ? <video key={i} src={url} controls className="w-full max-h-96 object-cover" />
              : <img key={i} src={url} alt="" className="w-full max-h-96 object-cover" />
          ))}
        </div>
      )}

      {post.content && (
        <p className="px-4 py-3 whitespace-pre-wrap text-sm text-zinc-200">{post.content}</p>
      )}

      <footer className="flex items-center gap-4 px-4 py-3 border-t border-zinc-800 text-sm">
        <button
          onClick={handleLike}
          disabled={pending || !currentUserId}
          className={'flex items-center gap-1 transition ' + (liked ? 'text-orange-400' : 'text-zinc-400 hover:text-zinc-200') + (pending ? ' opacity-60' : '')}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{count}</span>
        </button>
        <div className="flex items-center gap-1 text-zinc-400">
          <span>💬</span>
          <span>{post.comments.length}</span>
        </div>
      </footer>
    </article>
  );
}
