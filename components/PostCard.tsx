'use client';
import { useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';

type Post = {
  id: string;
  content: string;
  media_urls: string[];
  location: string | null;
  created_at: string;
  author_id: string;
  author_name: string;
  likes_count: number;
  liked_by_me: boolean;
};

export default function PostCard({
  post,
  isLoggedIn,
  toggleLikeAction,
}: {
  post: Post;
  isLoggedIn: boolean;
  toggleLikeAction: (postId: string) => Promise<void>;
}) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [count, setCount] = useState(post.likes_count);
  const [pending, startTransition] = useTransition();

  const author = post.author_name || 'rider';
  const initials = author.slice(0, 2).toUpperCase();
  const time = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  function handleLike() {
    if (!isLoggedIn) return;
    const next = !liked;
    setLiked(next);
    setCount(c => c + (next ? 1 : -1));
    startTransition(async () => {
      try { await toggleLikeAction(post.id); }
      catch { setLiked(!next); setCount(c => c + (next ? -1 : 1)); }
    });
  }

  return (
    <article className="card overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center font-semibold">{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{author}</div>
          <div className="text-xs text-muted truncate">
            {post.location && <span>{post.location} · </span>}
            <span>{time}</span>
          </div>
        </div>
      </header>

      {post.media_urls && post.media_urls.length > 0 && (
        <div className="grid grid-cols-1 gap-1 bg-black">
          {post.media_urls.slice(0, 3).map((url, i) =>
            url.match(/\.(mp4|webm|mov)$/i)
              ? <video key={i} src={url} controls className="w-full max-h-96 object-cover" />
              : <img key={i} src={url} alt="" className="w-full max-h-96 object-cover" />
          )}
        </div>
      )}

      {post.content && (
        <p className="px-4 py-3 whitespace-pre-wrap text-sm text-ink/90">{post.content}</p>
      )}

      <footer className="flex items-center gap-5 px-4 py-3 border-t border-line text-sm">
        <button
          onClick={handleLike}
          disabled={pending || !isLoggedIn}
          className={'flex items-center gap-1.5 transition ' + (liked ? 'text-rust-strong' : 'text-muted hover:text-ink')}
        >
          <svg viewBox="0 0 20 20" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" className="w-5 h-5">
            <path strokeWidth="1.6" d="M10 17s-6-3.6-6-8.2A3.8 3.8 0 0110 4a3.8 3.8 0 016 4.8C16 13.4 10 17 10 17z" />
          </svg>
          <span>{count}</span>
        </button>
      </footer>
    </article>
  );
}
