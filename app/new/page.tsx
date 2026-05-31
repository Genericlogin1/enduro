import Nav from '@/components/Nav';
import PostForm from '@/components/PostForm';
import { getServerToken } from '@/lib/serverToken';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const token = await getServerToken();
  if (!token) redirect('/login');

  return (
    <div className="min-h-screen pb-nav">
      <header className="sticky top-0 z-10 bg-base/95 backdrop-blur border-b border-line px-4 py-3">
        <div className="max-w-xl mx-auto">
          <h1 className="font-display text-2xl leading-none">New post</h1>
          <p className="text-[11px] text-muted mt-0.5">Share what you rode today</p>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-4">
        <PostForm />
      </main>
      <Nav active="new" />
    </div>
  );
}
