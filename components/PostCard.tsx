'use client';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';
import Comments from '@/components/Comments';
import Link from 'next/link';

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

export default function PostCard({ post, isLoggedIn }: { post: Post; isLoggedIn: boolean }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [count, setCount] = useState(post.likes_count);
  const [pending, setPending] = useState(false);

  const author = post.author_name || 'Rider';
  const initials = author.slice(0, 2).toUpperCase();
  const time = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const hasMedia = post.media_urls && post.media_urls.length > 0;

  async function handleLike() {
    if (!isLoggedIn || pending) return;
    const token = getToken();
    if (!token) return;
    const next = !liked;
    setLiked(next);
    setCount(c => c + (next ? 1 : -1));
    setPending(true);
    try {
      await apiFetch(`/posts/${post.id}/like`, { method: 'POST' }, token);
    } catch {
      setLiked(!next);
      setCount(c => c + (next ? -1 : 1));
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="card">
      {/* Media — full width, no padding */}
      {hasMedia && (
        <div className="relative bg-black">
          {post.media_urls.slice(0, 1).map((url, i) =>
            url.match(/\.(mp4|webm|mov)$/i)
              ? <video key={i} src={url} controls className="w-full max-h-[420px] object-cover" />
              : <img key={i} src={url} alt="" className="w-full max-h-[420px] object-cover" />
          )}
          {/* Author overlay on top of image */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Link href={`/riders/${post.author_id}`}>
              <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center text-xs font-bold ring-2 ring-white/20">
                {initials}
              </div>
            </Link>
            <div className="bg-black/50 backdrop-blur rounded-full px-2.5 py-0.5">
              <Link href={`/riders/${post.author_id}`} className="text-white text-xs font-semibold hover:text-white/80">
                {author}
              </Link>
            </div>
          </div>
          {/* Location badge */}
          {post.location && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur rounded-full px-2.5 py-1">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-white/70">
                <path fillRule="evenodd" d="M8 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM2 6a6 6 0 1110.89 3.477l3.817 3.816a.75.75 0 01-1.061 1.06l-3.815-3.815A6 6 0 012 6z" clipRule="evenodd" />
              </svg>
              <span className="text-white/90 text-xs">{post.location}</span>
            </div>
          )}
        </div>
      )}

      {/* Header — only shown when no media */}
      {!hasMedia && (
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <Link href={`/riders/${post.author_id}`}>
            <div className="w-9 h-9 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-sm font-bold ring-2 ring-line">
              {initials}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/riders/${post.author_id}`} className="font-semibold text-sm hover:text-moss-strong transition-colors">
              {author}
            </Link>
            <div className="text-xs text-muted">
              {post.location && <span>{post.location} · </span>}
              {time}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div className="px-4 pt-3 pb-1">
          {hasMedia && (
            <div className="flex items-center gap-2 mb-1.5">
              <Link href={`/riders/${post.author_id}`} className="font-semibold text-sm hover:text-moss-strong">{author}</Link>
              <span className="text-xs text-muted">{time}</span>
            </div>
          )}
          <p className="text-sm text-ink/90 leading-relaxed line-clamp-3">{post.content}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 mt-1">
        <button
          onClick={handleLike}
          disabled={pending || !isLoggedIn}
          className={'flex items-center gap-1.5 text-sm font-medium transition-all ' +
            (liked ? 'text-rust-strong scale-105' : 'text-muted hover:text-rust-strong')}
        >
          <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <span>{count > 0 ? count : ''}</span>
        </button>

        <div className="flex-1">
          <Comments postId={post.id} />
        </div>
      </div>
    </article>
  );
}
