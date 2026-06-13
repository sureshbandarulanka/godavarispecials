import React from 'react';
import { Metadata } from 'next';
import { getCategoriesAsync } from '@/services/productService';
import CategoryClient from './CategoryClient';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const categories = await getCategoriesAsync();
  const isPicklePartition = slug === 'veg-pickles' || slug === 'non-veg-pickles' || slug === 'traditional-veg-pickles';
  const baseSlug = isPicklePartition ? 'pickles' : slug;
  const category = categories.find(c => c.slug === baseSlug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  let name = category.name;
  if (slug === 'veg-pickles' || slug === 'traditional-veg-pickles') {
    name = 'Veg Pickles';
  } else if (slug === 'non-veg-pickles') {
    name = 'Non-Veg Pickles';
  }

  return {
    title: `${name} | Authentic Godavari Homemade`,
    description: `Shop the best ${name} from Godavari. 100% natural, homemade, and delivered fresh to your home.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const slug = (await params).slug;
  return <CategoryClient slug={slug} />;
}
