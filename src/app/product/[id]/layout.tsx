import { Metadata, ResolvingMetadata } from 'next';
import { getProductByIdAsync } from '@/services/productService';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id;
  
  try {
    const product = await getProductByIdAsync(id);

    if (!product) {
      return {
        title: 'Product Not Found | Godavari Specials',
      };
    }

    const previousImages = (await parent).openGraph?.images || [];
    const description = product.description 
      ? product.description.slice(0, 160) 
      : `Buy authentic ${product.name} online. Traditional Godavari ${product.category}. Freshly prepared and delivered across India.`;

    const price = product.variants?.[0]?.price;

    return {
      title: `Buy ${product.name} Online | Godavari Specials`,
      description: `${description}${price ? ` | Starting at ₹${price}` : ''}`,
      alternates: {
        canonical: `/product/${id}`,
      },
      openGraph: {
        title: `Buy ${product.name} Online | Godavari Specials`,
        description: description,
        url: `https://godavarispecials.in/product/${id}`,
        siteName: 'Godavari Specials',
        images: [product.image || '/og-image.jpg', ...previousImages],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Buy ${product.name} Online | Godavari Specials`,
        description: description,
        images: [product.image || '/og-image.jpg'],
      },
    };
  } catch (error) {
    return {
      title: 'Godavari Specials',
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
