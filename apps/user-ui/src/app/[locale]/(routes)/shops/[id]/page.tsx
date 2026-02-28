import type { Metadata } from 'next';
import SellerProfile from '../../../../../shared/modules/seller/seller-profile';
import {
  getShopById,
  getShopFollowersCount,
} from '../../../../../lib/api/shops';

async function fetchShopDetails(id: string) {
  try {
    const [shop, followersData] = await Promise.all([
      getShopById(id),
      getShopFollowersCount(id).catch(() => ({ count: 0 })),
    ]);
    return { shop, followersCount: followersData.count };
  } catch (error) {
    console.error('Failed to fetch shop details:', error);
    return { shop: null, followersCount: 0 };
  }
}

// Dynamic metadata generator
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { shop } = await fetchShopDetails(id);

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

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { shop, followersCount } = await fetchShopDetails(id);

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Shop Not Found
          </h1>
          <p className="text-gray-600">
            The shop you are looking for does not exist or has been removed.
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
