import type { Metadata } from 'next';
import SellerProfile from '../../../../../shared/modules/seller/seller-profile';
import { getShopBySlug, getShopFollowersCount } from '../../../../../lib/api/shops';
import { createLogger } from '@tec-shop/next-logger';
import { getTranslations } from 'next-intl/server';

const logger = createLogger('user-ui:shops');

async function fetchShopDetails(slug: string) {
  try {
    const shop = await getShopBySlug(slug);
    const followersData = await getShopFollowersCount(shop.id).catch(() => ({ count: 0 }));
    return { shop, followersCount: followersData.count };
  } catch (error) {
    logger.error({ err: error, slug }, 'Failed to fetch shop details');
    return { shop: null, followersCount: 0 };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { shop } = await fetchShopDetails(slug);

  return {
    title: `${shop?.businessName || 'Shop'} | TecShop MarketPlace`,
    description:
      shop?.bio ||
      'Discover high-quality products at TecShop, your go-to online marketplace for a wide range of products. Shop now and find the perfect items for your needs.',
    openGraph: {
      title: `${shop?.businessName || 'Shop'} | TecShop MarketPlace`,
      description:
        shop?.bio ||
        'Explore Products and services from trusted sellers on TecShop.',
      type: 'website',
      images: [
        {
          url:
            shop?.logo ||
            'https://ik.imagekit.io/andrieltecshop/products/avatar.jpg?updatedAt=1763005913773',
          width: 800,
          height: 600,
          alt: shop?.businessName || 'Shop Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${shop?.businessName || 'Shop'} | TecShop MarketPlace`,
      description:
        shop?.bio ||
        'Explore Products and services from trusted sellers on TecShop.',
      images: [
        {
          url:
            shop?.logo ||
            'https://ik.imagekit.io/andrieltecshop/products/avatar.jpg?updatedAt=1763005913773',
          width: 800,
          height: 600,
          alt: shop?.businessName || 'Shop Logo',
        },
      ],
    },
  };
}

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const { shop, followersCount } = await fetchShopDetails(slug);
  const t = await getTranslations('ShopProfile');

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('shopNotFound')}
          </h1>
          <p className="text-gray-600">
            {t('shopNotFoundDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SellerProfile shop={shop} followersCount={followersCount} />
    </div>
  );
};

export default Page;
