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
      try { await toggleLikeAction(post.id); }
      catch { setLiked(!next); setCount(c => c + (next ? -1 : 1)); }
    });
  }

  return (
    <article className="card overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3">
        {avatar
          ? <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          : <div className="w-10 h-10 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center font-semibold">{initials}</div>}
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{author}</div>
          <div className="text-xs text-muted truncate">
            {handle && <span>{handle} · </span>}
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
          disabled={pending || !currentUserId}
          className={'flex items-center gap-1.5 transition ' + (liked ? 'text-rust-strong' : 'text-muted hover:text-ink')}
        >
          <svg viewBox="0 0 20 20" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" className="w-5 h-5">
            <path strokeWidth="1.6" d="M10 17s-6-3.6-6-8.2A3.8 3.8 0 0110 4a3.8 3.8 0 016 4.8C16 13.4 10 17 10 17z" />
          </svg>
          <span>{count}</span>
        </button>
        <div className="flex items-center gap-1.5 text-muted">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="w-5 h-5">
            <path strokeWidth="1.6" d="M4 6a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H9l-4 3v-3a2 2 0 01-1-1.7V6z" />
          </svg>
          <span>{post.comments.length}</span>
        </div>
      </footer>
    </article>
  );
}
