import { Metadata, ResolvingMetadata } from 'next';
import { getCategoryBySlugAsync } from '@/services/productService';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = (await params).slug;
  
  try {
    const category = await getCategoryBySlugAsync(slug);

    if (!category) {
      return {
        title: 'Category | Godavari Specials',
      };
    }

    const previousImages = (await parent).openGraph?.images || [];
    const title = `${category.name} - Buy Online | Godavari Specials`;
    const description = `Shop authentic ${category.name} from Rajahmundry. Godavari Specials brings you the finest selection of homemade pickles, powders, and more. Free delivery available.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/category/${slug}`,
      },
      openGraph: {
        title,
        description,
        url: `https://godavarispecials.in/category/${slug}`,
        siteName: 'Godavari Specials',
        images: [category.imageUrl || '/og-image.jpg', ...previousImages],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [category.imageUrl || '/og-image.jpg'],
      },
    };
  } catch (error) {
    return {
      title: 'Categories | Godavari Specials',
    };
  }
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
