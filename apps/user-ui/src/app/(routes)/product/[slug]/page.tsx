import { apiClient } from 'apps/user-ui/src/lib/api/client';
import ProductDetails from 'apps/user-ui/src/shared/modules/product/product-details';
import { Metadata } from 'next';
import React from 'react';

async function fetchProductDetails(slug: string) {
  const response = await apiClient.get(`/public/products/${slug}`);
  return response.data.product;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);

  const product = await fetchProductDetails(slug);

  return {
    title: `${product?.name} | Tecshop MarketPlace`,
    description:
      product?.description ||
      'Discover high-quality products at TecShop, your go-to online marketplace for a wide range of products. Shop now and find the perfect items for your needs.',
    openGraph: {
      title: `${product?.title} | Tecshop MarketPlace`,
      description: product?.description || '',
      images: [product?.image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product?.title} | Tecshop MarketPlace`,
      description: product?.description || '',
      images: [product?.image],
    },
  };
}

const Page = async ({ params }: { params: { slug: string } }) => {
  const { slug } = await Promise.resolve(params);

  const productDetails = await fetchProductDetails(slug);
  return <ProductDetails product={productDetails} />;
};

export default Page;
