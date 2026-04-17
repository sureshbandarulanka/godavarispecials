import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { getProductById, fetchFirebaseData } from '@/services/productService';
import ProductClient from './ProductClient';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id;
  await fetchFirebaseData();
  const product = getProductById(id);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: product.name,
    description: `Buy authentic homemade ${product.name} from Godavari. Pure ingredients, traditional recipes, and superfast delivery.`,
    openGraph: {
      title: product.name,
      description: `Authentic homemade ${product.name} from Godavari.`,
      images: [product.image || '/assets/favicon.png', ...previousImages],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const id = (await params).id;
  await fetchFirebaseData();
  const product = getProductById(id);
  
  // Serialize product for Client Component
  const serializedProduct = product ? JSON.parse(JSON.stringify(product)) : null;

  return <ProductClient initialProduct={serializedProduct} id={id} />;
}
