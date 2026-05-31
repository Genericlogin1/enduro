import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/me', '/me/edit', '/gps', '/business', '/new', '/reports/new'],
    },
    sitemap: 'https://enduro-world.vercel.app/sitemap.xml',
  };
}
