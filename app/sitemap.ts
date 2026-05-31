import { MetadataRoute } from 'next';

const BASE_URL = 'https://enduro-world.vercel.app';
const API_BASE = 'https://enduro-production-20f5.up.railway.app/api/v1';

async function fetchJSON(path: string) {
  return fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } })
    .then(r => r.json())
    .catch(() => null);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/map`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/rides`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/tours`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/signup`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [routesData, ridesData] = await Promise.all([
    fetchJSON('/routes?limit=1000'),
    fetchJSON('/rides?limit=1000'),
  ]);

  const routes: MetadataRoute.Sitemap = (routesData?.routes ?? []).map((r: any) => ({
    url: `${BASE_URL}/routes/${r.id}`,
    lastModified: new Date(r.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const rides: MetadataRoute.Sitemap = (ridesData?.rides ?? []).map((r: any) => ({
    url: `${BASE_URL}/rides/${r.id}`,
    lastModified: new Date(r.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...routes, ...rides];
}
