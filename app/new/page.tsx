import Nav from '@/components/Nav';
import PostForm from '@/components/PostForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <header className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-900 px-4 py-3">
        <h1 className="text-lg font-bold">New post</h1>
      </header>
      <main className="max-w-xl mx-auto px-4 py-4">
        <PostForm userId={user.id} />
      </main>
      <Nav active="new" />
    </div>
  );
}
