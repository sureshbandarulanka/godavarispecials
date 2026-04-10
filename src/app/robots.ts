import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/checkout/',
        '/my-profile/',
        '/my-orders/',
        '/admin-dashboard/',
      ],
    },
    sitemap: 'https://godavarispecials.in/sitemap.xml',
  };
}
