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
    const isPicklePartition = slug === 'veg-pickles' || slug === 'non-veg-pickles' || slug === 'traditional-veg-pickles';
    const baseSlug = isPicklePartition ? 'pickles' : slug;
    const category = await getCategoryBySlugAsync(baseSlug);

    if (!category) {
      return {
        title: 'Category | Godavari Specials',
      };
    }

    const previousImages = (await parent).openGraph?.images || [];
    let name = category.name;
    if (slug === 'veg-pickles' || slug === 'traditional-veg-pickles') {
      name = 'Veg Pickles';
    } else if (slug === 'non-veg-pickles') {
      name = 'Non-Veg Pickles';
    }

    const title = `${name} - Buy Online | Godavari Specials`;
    const description = `Shop authentic ${name} from Rajahmundry. Godavari Specials brings you the finest selection of homemade pickles, powders, and more. Free delivery available.`;

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
