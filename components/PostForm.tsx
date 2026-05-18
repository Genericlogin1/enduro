'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createPost } from '@/app/actions';

export default function PostForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files || []).slice(0, 5);
    setFiles(fs);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && files.length === 0) {
      setError('Add text or media');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const urls: string[] = [];
      for (const f of files) {
        const ext = f.name.split('.').pop() || 'bin';
        const path = userId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
        const { error: upErr } = await supabase.storage.from('media').upload(path, f, { upsert: false, contentType: f.type });
        if (upErr) throw new Error(upErr.message);
        const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
        urls.push(pub.publicUrl);
      }
      const fd = new FormData();
      fd.set('content', content);
      fd.set('location', location);
      fd.set('media_urls', urls.join(','));
      await createPost(fd);
    } catch (e: any) {
      setError(e.message || 'Failed to post');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's the ride?"
        rows={4}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
      />
      <input
        value={location}
        onChange={e => setLocation(e.target.value)}
        placeholder="Location (e.g. Carpathians, Ukraine)"
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
      />

      <label className="block bg-zinc-900 border border-dashed border-zinc-700 rounded-lg p-4 text-center cursor-pointer hover:border-orange-500">
        <span className="text-zinc-400 text-sm">
          {files.length > 0 ? files.length + ' file' + (files.length === 1 ? '' : 's') + ' selected' : 'Tap to add photos / videos (up to 5)'}
        </span>
        <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
      </label>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map((f, i) => (
            <div key={i} className="aspect-square bg-zinc-900 rounded overflow-hidden flex items-center justify-center">
              {f.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-zinc-500 text-xs px-2 text-center break-all">{f.name}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg py-3"
      >
        {uploading ? 'Posting...' : 'Publish'}
      </button>
    </form>
  );
}
