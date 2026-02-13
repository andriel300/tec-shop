import { PrismaClient as ProductPrismaClient } from '@tec-shop/product-client';
import { PrismaClient as AnalyticsPrismaClient } from '@tec-shop/analytics-client';
import { PrismaClient as AuthPrismaClient } from '@tec-shop/auth-client';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { randomBytes } from 'crypto';

// Load environment variables from root .env
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const productDb = new ProductPrismaClient();
const analyticsDb = new AnalyticsPrismaClient();
const authDb = new AuthPrismaClient();

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

// --- Seed User Analytics (interactions) using real product IDs ---

async function seedAnalytics(
  products: Array<{ productId: string; shopId: string }>,
  realUserIds: string[],
  fakeUserCount: number,
  actionsPerUser: { min: number; max: number }
) {
  console.log(`\nSeeding analytics for ${realUserIds.length} real users + ${fakeUserCount} fake users...`);

  let totalActions = 0;

  // Combine real user IDs with fake user IDs
  const allUserIds = [
    ...realUserIds,
    ...Array.from({ length: fakeUserCount }, () => generateObjectId()),
  ];

  for (const userId of allUserIds) {
    // Skip if user already has analytics
    const existing = await analyticsDb.userAnalytics.findUnique({
      where: { userId },
    });
    if (existing) {
      console.log(`  Skipping existing analytics for user ${userId}`);
      continue;
    }

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

  console.log(`  Created analytics for ${allUserIds.length} users with ${totalActions} total actions`);
  return totalActions;
}

// --- Seed Product Analytics using real product IDs ---

async function seedProductAnalytics(
  products: Array<{ productId: string; shopId: string }>
) {
  console.log('\nSeeding ProductAnalytics entries for existing products...');

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
  console.log('Using EXISTING products and users from your database.\n');

  try {
    // 0. Clear old analytics data to avoid stale fake IDs
    console.log('Clearing old analytics data...');
    await analyticsDb.userAnalytics.deleteMany({});
    await analyticsDb.productAnalytics.deleteMany({});
    console.log('  Cleared UserAnalytics and ProductAnalytics tables');

    // 1. Fetch existing published products from product DB
    const existingProducts = await productDb.product.findMany({
      where: {
        status: 'PUBLISHED',
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        shopId: true,
        name: true,
      },
    });

    if (existingProducts.length === 0) {
      console.error('No published products found in the database. Create some products first.');
      process.exit(1);
    }

    console.log(`Found ${existingProducts.length} existing published products`);

    const products = existingProducts.map((p) => ({
      productId: p.id,
      shopId: p.shopId,
    }));

    // 2. Fetch existing real user IDs from auth DB
    const existingUsers = await authDb.user.findMany({
      select: { id: true },
      take: 100,
    });

    const realUserIds = existingUsers.map((u) => u.id);
    console.log(`Found ${realUserIds.length} existing users`);

    // 3. Seed user analytics (real users + 30 fake users for diversity)
    const totalActions = await seedAnalytics(products, realUserIds, 30, { min: 10, max: 40 });

    // 4. Seed ProductAnalytics for all real products
    await seedProductAnalytics(products);

    console.log('\n=== Seeding Summary ===');
    console.log(`  Products (existing): ${products.length}`);
    console.log(`  Real users:          ${realUserIds.length}`);
    console.log(`  Fake users:          30`);
    console.log(`  Total interactions:  ${totalActions}`);
    console.log('\nDone! Now click "Train Model" in the admin dashboard or restart the recommendation service.');
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await productDb.$disconnect();
    await analyticsDb.$disconnect();
    await authDb.$disconnect();
  }
}

main();
