import { MetadataRoute } from 'next';
import { getProductsAsync, getCategoriesAsync } from '@/services/productService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://godavarispecials.in';

  // 1. Fetch products and categories
  let products: any[] = [];
  let categories: any[] = [];
  
  try {
    const [pResult, cResult] = await Promise.all([
      getProductsAsync(),
      getCategoriesAsync()
    ]);
    products = pResult;
    categories = cResult;
  } catch (error) {
    console.error('Sitemap generation error:', error);
  }

  // 2. Static pages
  const staticPages = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/refund-policy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/cancellation-policy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/shipping-policy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  // 3. Category pages
  const categoryPages = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 4. Product pages
  const productPages = products.map((prod) => ({
    url: `${baseUrl}/product/${prod.id}`,
    lastModified: new Date(), // Ideally use prod.updatedAt if available
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
