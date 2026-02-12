import { PrismaClient as SellerPrismaClient } from '@tec-shop/seller-client';
import { PrismaClient as ProductPrismaClient } from '@tec-shop/product-client';
import { PrismaClient as AnalyticsPrismaClient } from '@tec-shop/analytics-client';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { randomBytes } from 'crypto';

// Load environment variables from root .env
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const sellerDb = new SellerPrismaClient();
const productDb = new ProductPrismaClient();
const analyticsDb = new AnalyticsPrismaClient();

// --- Helpers ---

/** Generate a valid 24-hex-char MongoDB ObjectId string */
function generateObjectId(): string {
  return randomBytes(12).toString('hex');
}

const ACTION_TYPES = [
  'product_view',
  'product_view',
  'product_view',
  'product_view',   // 4x weight -- views are most common
  'add_to_wishlist',
  'add_to_cart',
  'add_to_cart',    // 2x weight
  'purchase',
] as const;

function pickRandomAction(): string {
  return ACTION_TYPES[Math.floor(Math.random() * ACTION_TYPES.length)];
}

// --- Seed Sellers & Shops ---

async function seedSellers(count: number) {
  console.log(`\nSeeding ${count} sellers + shops...`);

  const sellers: Array<{ sellerId: string; shopId: string }> = [];

  for (let i = 0; i < count; i++) {
    const authId = generateObjectId();
    const email = faker.internet.email().toLowerCase();
    const name = faker.person.fullName();

    // Check if seller with this email already exists
    const existing = await sellerDb.seller.findFirst({ where: { email } });
    if (existing) {
      const shop = await sellerDb.shop.findFirst({ where: { sellerId: existing.id } });
      if (shop) {
        sellers.push({ sellerId: existing.id, shopId: shop.id });
        console.log(`  Reusing existing seller: ${existing.name}`);
        continue;
      }
    }

    const seller = await sellerDb.seller.create({
      data: {
        authId,
        name,
        email,
        phoneNumber: faker.phone.number(),
        country: faker.location.country(),
        isVerified: true,
        stripeAccountId: `seed_${generateObjectId()}`, // unique placeholder to avoid null unique constraint
      },
    });

    const shop = await sellerDb.shop.create({
      data: {
        sellerId: seller.id,
        businessName: faker.company.name(),
        bio: faker.company.catchPhrase(),
        category: faker.commerce.department(),
        address: faker.location.streetAddress(),
        openingHours: '9:00 AM - 5:00 PM',
        isActive: true,
        socialLinks: [],
      },
    });

    sellers.push({ sellerId: seller.id, shopId: shop.id });
    console.log(`  Created seller: ${name} -> shop: ${shop.businessName}`);
  }

  return sellers;
}

// --- Seed Products ---

async function seedProducts(
  shops: Array<{ sellerId: string; shopId: string }>,
  productsPerShop: number
) {
  console.log(`\nSeeding ~${shops.length * productsPerShop} products across ${shops.length} shops...`);

  // Get existing categories and brands from product DB
  const categories = await productDb.category.findMany({ where: { isActive: true } });
  const brands = await productDb.brand.findMany({ where: { isActive: true } });

  if (categories.length === 0) {
    console.error('No categories found. Run seed:categories first.');
    process.exit(1);
  }

  const allProducts: Array<{ productId: string; shopId: string }> = [];

  for (const shop of shops) {
    for (let i = 0; i < productsPerShop; i++) {
      const category = faker.helpers.arrayElement(categories);
      const brand = brands.length > 0 ? faker.helpers.arrayElement(brands) : null;
      const name = `${faker.commerce.productAdjective()} ${faker.commerce.product()} ${faker.string.alphanumeric(4).toUpperCase()}`;
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const price = parseFloat(faker.commerce.price({ min: 10, max: 500 }));

      const product = await productDb.product.create({
        data: {
          shopId: shop.shopId,
          name,
          description: `<p>${faker.commerce.productDescription()}</p>`,
          categoryId: category.id,
          brandId: brand?.id ?? null,
          productType: 'SIMPLE',
          price,
          salePrice: Math.random() > 0.6 ? parseFloat((price * 0.8).toFixed(2)) : null,
          stock: faker.number.int({ min: 5, max: 200 }),
          images: [`https://picsum.photos/seed/${faker.number.int({ min: 1, max: 9999 })}/800/600`],
          slug,
          tags: [faker.commerce.department().toLowerCase(), faker.commerce.productMaterial().toLowerCase()],
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          isActive: true,
          isFeatured: Math.random() > 0.85,
          averageRating: faker.number.float({ min: 2.5, max: 5.0, fractionDigits: 1 }),
          ratingCount: faker.number.int({ min: 0, max: 80 }),
          views: faker.number.int({ min: 10, max: 500 }),
          sales: faker.number.int({ min: 0, max: 50 }),
        },
      });

      allProducts.push({ productId: product.id, shopId: shop.shopId });
    }

    console.log(`  Created ${productsPerShop} products for shop ${shop.shopId}`);
  }

  return allProducts;
}

// --- Seed User Analytics (interactions) ---

async function seedAnalytics(
  products: Array<{ productId: string; shopId: string }>,
  userCount: number,
  actionsPerUser: { min: number; max: number }
) {
  console.log(`\nSeeding analytics for ${userCount} fake users...`);

  let totalActions = 0;

  for (let u = 0; u < userCount; u++) {
    const userId = generateObjectId();
    const numActions = faker.number.int(actionsPerUser);

    const actions: Array<{
      productId: string;
      shopId: string;
      action: string;
      timestamp: string;
    }> = [];

    let totalViews = 0;
    let totalCartAdds = 0;
    let totalWishlist = 0;
    let totalPurchases = 0;

    for (let a = 0; a < numActions; a++) {
      const product = faker.helpers.arrayElement(products);
      const action = pickRandomAction();
      const timestamp = faker.date.recent({ days: 60 }).toISOString();

      actions.push({
        productId: product.productId,
        shopId: product.shopId,
        action,
        timestamp,
      });

      switch (action) {
        case 'product_view':
          totalViews++;
          break;
        case 'add_to_cart':
          totalCartAdds++;
          break;
        case 'add_to_wishlist':
          totalWishlist++;
          break;
        case 'purchase':
          totalPurchases++;
          break;
      }
    }

    await analyticsDb.userAnalytics.create({
      data: {
        userId,
        actions: actions as unknown as Parameters<typeof analyticsDb.userAnalytics.create>[0]['data']['actions'],
        lastVisited: new Date(),
        totalViews,
        totalCartAdds,
        totalWishlist,
        totalPurchases,
        country: faker.location.countryCode(),
        device: faker.helpers.arrayElement(['mobile', 'desktop', 'tablet']),
      },
    });

    totalActions += numActions;
  }

  console.log(`  Created ${userCount} UserAnalytics records with ${totalActions} total actions`);
  return totalActions;
}

// --- Seed Product Analytics ---

async function seedProductAnalytics(
  products: Array<{ productId: string; shopId: string }>
) {
  console.log('\nSeeding ProductAnalytics entries...');

  let created = 0;

  for (const product of products) {
    // Check if entry already exists
    const existing = await analyticsDb.productAnalytics.findUnique({
      where: { productId: product.productId },
    });
    if (existing) continue;

    const views = faker.number.int({ min: 20, max: 300 });
    const cartAdds = faker.number.int({ min: 1, max: Math.floor(views * 0.3) });
    const wishlistAdds = faker.number.int({ min: 0, max: Math.floor(views * 0.15) });
    const purchases = faker.number.int({ min: 0, max: Math.floor(cartAdds * 0.5) });

    await analyticsDb.productAnalytics.create({
      data: {
        productId: product.productId,
        shopId: product.shopId,
        views,
        uniqueViews: Math.floor(views * 0.7),
        cartAdds,
        wishlistAdds,
        wishlistRemoves: Math.floor(wishlistAdds * 0.2),
        purchases,
        viewToCartRate: views > 0 ? parseFloat(((cartAdds / views) * 100).toFixed(2)) : 0,
        viewToWishlistRate: views > 0 ? parseFloat(((wishlistAdds / views) * 100).toFixed(2)) : 0,
        cartToPurchaseRate: cartAdds > 0 ? parseFloat(((purchases / cartAdds) * 100).toFixed(2)) : 0,
        lastViewAt: faker.date.recent({ days: 7 }),
        lastCartAddAt: faker.date.recent({ days: 14 }),
        lastPurchaseAt: purchases > 0 ? faker.date.recent({ days: 30 }) : null,
      },
    });
    created++;
  }

  console.log(`  Created ${created} ProductAnalytics records`);
}

// --- Main ---

async function main() {
  console.log('=== Recommendation Data Seeder ===\n');

  try {
    // 1. Seed 5 sellers + shops
    const sellers = await seedSellers(5);

    // 2. Seed ~100 products (20 per shop)
    const products = await seedProducts(sellers, 20);

    // 3. Seed 50 users with 10-40 actions each
    const totalActions = await seedAnalytics(products, 50, { min: 10, max: 40 });

    // 4. Seed ProductAnalytics for all products
    await seedProductAnalytics(products);

    console.log('\n=== Seeding Summary ===');
    console.log(`  Sellers/Shops: ${sellers.length}`);
    console.log(`  Products:      ${products.length}`);
    console.log(`  Users:         50`);
    console.log(`  Interactions:  ${totalActions}`);
    console.log('\nDone! You can now click "Train Model" in the admin dashboard.');
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await sellerDb.$disconnect();
    await productDb.$disconnect();
    await analyticsDb.$disconnect();
  }
}

main();
