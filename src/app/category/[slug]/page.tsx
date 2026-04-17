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
  const category = categories.find(c => c.slug === slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} | Authentic Godavari Homemade`,
    description: `Shop the best ${category.name} from Godavari. 100% natural, homemade, and delivered fresh to your home.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const slug = (await params).slug;
  return <CategoryClient slug={slug} />;
}
