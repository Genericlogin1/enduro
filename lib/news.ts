import { unstable_cache } from 'next/cache';
import { XMLParser } from 'fast-xml-parser';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export type NewsItem = {
  source: string;
  title: string;
  url: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
};

const FEEDS = [
  { source: 'Enduro21', url: 'https://www.enduro21.com/feed/' },
  { source: 'Dirt Bike Magazine', url: 'https://dirtbikemagazine.com/feed/' },
  { source: 'Cycle News Off-Road', url: 'https://www.cyclenews.com/category/off-road/feed/' },
];

function stripHtml(s: any): string {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function pickImage(item: any): string | null {
  if (item['media:content']?.['@_url']) return item['media:content']['@_url'];
  if (item['media:thumbnail']?.['@_url']) return item['media:thumbnail']['@_url'];
  if (item.enclosure?.['@_url']) return item.enclosure['@_url'];
  const html = item['content:encoded'] || item.description || '';
  const m = String(html).match(/<img[^>]+src="([^"]+)"/i);
  return m ? m[1] : null;
}

async function fetchOne(feed: { source: string; url: string }): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, { next: { revalidate: 3600 }, headers: { 'user-agent': 'enduro-world/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const data = parser.parse(xml);
    const items = data?.rss?.channel?.item || data?.feed?.entry || [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.slice(0, 8).map((it: any) => ({
      source: feed.source,
      title: stripHtml(it.title?.['#text'] || it.title),
      url: it.link?.['@_href'] || (typeof it.link === 'string' ? it.link : '') || it.guid?.['#text'] || (typeof it.guid === 'string' ? it.guid : ''),
      excerpt: stripHtml(it.description || it.summary || '').slice(0, 220) || null,
      image_url: pickImage(it),
      published_at: new Date(it.pubDate || it.published || it.updated || Date.now()).toISOString(),
    })).filter((n: NewsItem) => n.title && n.url);
  } catch { return []; }
}

async function fetchAllRaw(): Promise<NewsItem[]> {
  const all = (await Promise.all(FEEDS.map(fetchOne))).flat();
  all.sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at));
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (svc && url && all.length > 0) {
    try {
      const admin = createServiceClient(url, svc, { auth: { persistSession: false } });
      await admin.from('news_cache').upsert(all, { onConflict: 'url', ignoreDuplicates: true });
    } catch {}
  }
  return all.slice(0, 24);
}

export const getNews = unstable_cache(fetchAllRaw, ['enduro-news-v1'], { revalidate: 3600, tags: ['news'] });
