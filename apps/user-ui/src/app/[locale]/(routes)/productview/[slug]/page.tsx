/* eslint-disable @nx/enforce-module-boundaries */
import ProductDetails from 'apps/user-ui/src/shared/modules/product/product-details';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Use native fetch so Next.js automatically deduplicates the request across
// generateMetadata and Page — only ONE HTTP call is made per request cycle
// instead of two sequential axios calls (which was causing ~40s render times).
async function fetchProductDetails(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/public/products/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductDetails(slug);

  if (!product) {
    return {
      title: 'Product | Tecshop MarketPlace',
      description:
        'Discover high-quality products at TecShop, your go-to online marketplace.',
    };
  }

  return {
    title: `${product.name} | Tecshop MarketPlace`,
    description:
      product.description ||
      'Discover high-quality products at TecShop, your go-to online marketplace for a wide range of products. Shop now and find the perfect items for your needs.',
    openGraph: {
      title: `${product.name} | Tecshop MarketPlace`,
      description: product.description || '',
      images: [product.image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Tecshop MarketPlace`,
      description: product.description || '',
      images: [product.image],
    },
  };
}

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const productDetails = await fetchProductDetails(slug);

  if (!productDetails) {
    notFound();
  }

  return <ProductDetails product={productDetails} />;
};

export default Page;
