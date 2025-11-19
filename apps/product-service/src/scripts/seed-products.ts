import { PrismaClient as ProductPrismaClient } from '@tec-shop/product-client';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const prisma = new ProductPrismaClient();

/**
 * Mock product data with realistic details
 */
interface MockProduct {
  name: string;
  description: string;
  categorySlug: string;
  brandName: string | null;
  basePrice: number; // Base price, will be randomized slightly
  salePercentage?: number; // Percentage discount (e.g., 20 means 20% off)
  stockRange: { min: number; max: number }; // Stock range for randomization
  tags: string[];
  productType: 'SIMPLE' | 'VARIABLE';
  status: 'PUBLISHED' | 'DRAFT';
  isFeatured?: boolean;
}

const mockProducts: MockProduct[] = [
  // Electronics
  {
    name: 'Wireless Bluetooth Headphones',
    description: '<p>Premium wireless headphones with active noise cancellation and 30-hour battery life.</p><p>Features:</p><ul><li>Active Noise Cancellation</li><li>Bluetooth 5.0</li><li>30-hour battery</li><li>Foldable design</li></ul>',
    categorySlug: 'audio-headphones',
    brandName: 'Sony',
    basePrice: 299.99,
    salePercentage: 15, // 15% off
    stockRange: { min: 30, max: 80 },
    tags: ['headphones', 'wireless', 'noise-cancelling', 'bluetooth'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
    isFeatured: true,
  },
  {
    name: 'USB-C Fast Charging Cable',
    description: '<p>Durable braided USB-C cable with 100W fast charging support. Compatible with all USB-C devices.</p><p>Perfect for laptops, phones, and tablets.</p>',
    categorySlug: 'computer-accessories',
    brandName: null,
    basePrice: 19.99,
    stockRange: { min: 150, max: 300 },
    tags: ['usb-c', 'cable', 'charging', 'fast-charge'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description: '<p>RGB mechanical keyboard with Cherry MX switches. Customizable per-key lighting and macro support.</p><p>Features:</p><ul><li>Cherry MX Red switches</li><li>RGB backlighting</li><li>Programmable keys</li><li>Detachable USB-C cable</li></ul>',
    categorySlug: 'computer-accessories',
    brandName: null,
    basePrice: 149.99,
    salePercentage: 20,
    stockRange: { min: 20, max: 50 },
    tags: ['keyboard', 'mechanical', 'gaming', 'rgb'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
    isFeatured: true,
  },
  {
    name: '27-inch 4K Monitor',
    description: '<p>Ultra HD 4K monitor with HDR support and 144Hz refresh rate. Perfect for gaming and content creation.</p><p>Specifications:</p><ul><li>3840 x 2160 resolution</li><li>144Hz refresh rate</li><li>HDR10 support</li><li>AMD FreeSync</li></ul>',
    categorySlug: 'computer-accessories',
    brandName: 'Dell',
    basePrice: 599.99,
    salePercentage: 17,
    stockRange: { min: 10, max: 25 },
    tags: ['monitor', '4k', 'gaming', 'hdr'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },

  // Fashion
  {
    name: 'Classic Cotton T-Shirt',
    description: '<p>Comfortable 100% cotton t-shirt. Available in multiple colors and sizes.</p><p>Perfect for casual wear or layering.</p>',
    categorySlug: 'mens-clothing',
    brandName: 'Uniqlo',
    basePrice: 19.99,
    stockRange: { min: 80, max: 150 },
    tags: ['t-shirt', 'cotton', 'casual', 'basics'],
    productType: 'VARIABLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Running Shoes',
    description: '<p>Lightweight running shoes with responsive cushioning and breathable mesh upper.</p><p>Features:</p><ul><li>Breathable mesh</li><li>Responsive foam</li><li>Durable rubber outsole</li><li>Reflective details</li></ul>',
    categorySlug: 'shoes-footwear',
    brandName: 'Nike',
    basePrice: 129.99,
    salePercentage: 23,
    stockRange: { min: 30, max: 60 },
    tags: ['shoes', 'running', 'sports', 'athletic'],
    productType: 'VARIABLE',
    status: 'PUBLISHED',
    isFeatured: true,
  },
  {
    name: 'Leather Wallet',
    description: '<p>Genuine leather bifold wallet with RFID blocking technology. Multiple card slots and bill compartment.</p>',
    categorySlug: 'bags-luggage',
    brandName: null,
    basePrice: 49.99,
    stockRange: { min: 60, max: 100 },
    tags: ['wallet', 'leather', 'rfid', 'accessories'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },

  // Home & Garden
  {
    name: 'Stainless Steel Cookware Set',
    description: '<p>Professional-grade 10-piece stainless steel cookware set. Includes pots, pans, and lids.</p><p>Dishwasher safe and oven safe up to 500°F.</p>',
    categorySlug: 'kitchen-dining',
    brandName: 'Cuisinart',
    basePrice: 299.99,
    salePercentage: 17,
    stockRange: { min: 15, max: 35 },
    tags: ['cookware', 'kitchen', 'stainless-steel', 'pots-pans'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'LED Desk Lamp',
    description: '<p>Modern LED desk lamp with touch control and adjustable brightness. USB charging port included.</p><p>Perfect for home office or study.</p>',
    categorySlug: 'lighting',
    brandName: null,
    basePrice: 39.99,
    stockRange: { min: 40, max: 80 },
    tags: ['lamp', 'led', 'desk', 'lighting'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Premium Bed Sheets Set',
    description: '<p>Ultra-soft microfiber bed sheets set. Includes fitted sheet, flat sheet, and pillowcases.</p><p>Wrinkle-resistant and hypoallergenic.</p>',
    categorySlug: 'bedding-bath',
    brandName: null,
    basePrice: 59.99,
    salePercentage: 25,
    stockRange: { min: 30, max: 50 },
    tags: ['bedding', 'sheets', 'bedroom', 'soft'],
    productType: 'VARIABLE',
    status: 'PUBLISHED',
  },

  // Sports & Outdoors
  {
    name: 'Yoga Mat with Carrying Strap',
    description: '<p>Non-slip yoga mat with 6mm thickness. Eco-friendly TPE material with alignment marks.</p><p>Includes carrying strap for easy transport.</p>',
    categorySlug: 'exercise-fitness',
    brandName: null,
    basePrice: 34.99,
    stockRange: { min: 50, max: 100 },
    tags: ['yoga', 'fitness', 'exercise', 'mat'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Camping Tent - 4 Person',
    description: '<p>Waterproof 4-person camping tent with easy setup. Includes rainfly and storage pockets.</p><p>Features:</p><ul><li>Waterproof 3000mm</li><li>Easy 10-minute setup</li><li>Ventilation windows</li><li>Interior storage pockets</li></ul>',
    categorySlug: 'outdoor-recreation',
    brandName: 'The North Face',
    basePrice: 199.99,
    salePercentage: 20,
    stockRange: { min: 10, max: 30 },
    tags: ['camping', 'tent', 'outdoor', 'hiking'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },

  // Beauty & Personal Care
  {
    name: 'Anti-Aging Face Serum',
    description: '<p>Advanced anti-aging serum with hyaluronic acid and vitamin C. Reduces fine lines and brightens skin.</p><p>Suitable for all skin types.</p>',
    categorySlug: 'skincare',
    brandName: "L'Oréal",
    basePrice: 49.99,
    stockRange: { min: 70, max: 120 },
    tags: ['skincare', 'serum', 'anti-aging', 'beauty'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Hair Straightener',
    description: '<p>Professional ceramic hair straightener with adjustable temperature control. Heats up in 30 seconds.</p><p>Temperature range: 150°C - 230°C</p>',
    categorySlug: 'personal-care-appliances',
    brandName: null,
    basePrice: 69.99,
    salePercentage: 21,
    stockRange: { min: 25, max: 45 },
    tags: ['hair', 'straightener', 'styling', 'beauty'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },

  // Books & Media
  {
    name: 'The Psychology of Money',
    description: '<p>Bestselling book about the psychology of money and wealth. Learn timeless lessons on wealth, greed, and happiness.</p><p>Paperback edition, 256 pages.</p>',
    categorySlug: 'books',
    brandName: 'Penguin',
    basePrice: 16.99,
    stockRange: { min: 100, max: 200 },
    tags: ['book', 'finance', 'psychology', 'bestseller'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },

  // Toys & Games
  {
    name: 'LEGO Architecture Set',
    description: '<p>Build iconic landmarks with this detailed LEGO Architecture set. Includes 1,200 pieces and instruction booklet.</p><p>Recommended for ages 12+</p>',
    categorySlug: 'building-toys',
    brandName: 'LEGO',
    basePrice: 89.99,
    stockRange: { min: 30, max: 50 },
    tags: ['lego', 'building', 'architecture', 'collectible'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
    isFeatured: true,
  },
  {
    name: '1000 Piece Jigsaw Puzzle',
    description: '<p>Beautiful landscape jigsaw puzzle with 1000 pieces. High-quality cardboard with anti-glare finish.</p><p>Finished size: 27" x 20"</p>',
    categorySlug: 'board-games-puzzles',
    brandName: null,
    basePrice: 24.99,
    stockRange: { min: 50, max: 80 },
    tags: ['puzzle', 'jigsaw', 'games', 'family'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },

  // Pet Supplies
  {
    name: 'Automatic Pet Feeder',
    description: '<p>Programmable automatic pet feeder with voice recording. Dispenses food on schedule up to 4 meals per day.</p><p>Features:</p><ul><li>4L capacity</li><li>Voice recording</li><li>Battery backup</li><li>Easy to clean</li></ul>',
    categorySlug: 'dog-supplies',
    brandName: null,
    basePrice: 79.99,
    salePercentage: 19,
    stockRange: { min: 20, max: 40 },
    tags: ['pet', 'feeder', 'automatic', 'dog'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },

  // Office Supplies
  {
    name: 'Wireless Mouse',
    description: '<p>Ergonomic wireless mouse with 2400 DPI and silent clicking. Works on any surface.</p><p>Battery lasts up to 18 months.</p>',
    categorySlug: 'office-electronics',
    brandName: null,
    basePrice: 29.99,
    stockRange: { min: 100, max: 150 },
    tags: ['mouse', 'wireless', 'office', 'ergonomic'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Notebook Set - 5 Pack',
    description: '<p>Premium hardcover notebooks with dotted pages. Perfect for journaling, planning, or note-taking.</p><p>Each notebook has 120 pages.</p>',
    categorySlug: 'stationery-writing',
    brandName: null,
    basePrice: 34.99,
    stockRange: { min: 70, max: 100 },
    tags: ['notebook', 'journal', 'stationery', 'writing'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
];

/**
 * Generate URL-friendly slug from product name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generate random rating metrics using Faker
 */
function generateRatingMetrics() {
  const ratingCount = faker.number.int({ min: 5, max: 100 }); // 5-100 ratings
  const averageRating = faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }); // 3.0-5.0 rating
  return {
    ratingCount,
    averageRating,
  };
}

/**
 * Generate random views and sales using Faker
 */
function generateMetrics() {
  return {
    views: faker.number.int({ min: 50, max: 2000 }), // 50-2000 views
    sales: faker.number.int({ min: 2, max: 100 }), // 2-100 sales
  };
}

/**
 * Calculate price with slight randomization and optional sale
 */
function calculatePrices(basePrice: number, salePercentage?: number) {
  // Add slight price variation (+/- 5%)
  const priceVariation = faker.number.float({ min: -0.05, max: 0.05, fractionDigits: 2 });
  const price = Number((basePrice * (1 + priceVariation)).toFixed(2));

  let salePrice: number | undefined;
  if (salePercentage) {
    salePrice = Number((price * (1 - salePercentage / 100)).toFixed(2));
  }

  return { price, salePrice };
}

/**
 * Seed products for a specific shop
 */
async function seedProducts(shopId: string) {
  console.log(`🌱 Starting product seeding for shop: ${shopId}\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  // Get all categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
  });

  // Get all brands
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
  });

  if (categories.length === 0) {
    console.error('❌ No categories found! Please run seed-categories.ts first.');
    return { created, skipped, errors };
  }

  console.log(`📦 Found ${categories.length} categories and ${brands.length} brands\n`);

  for (const productData of mockProducts) {
    try {
      // Find category by slug
      const category = categories.find(
        (cat) => cat.slug === productData.categorySlug
      );

      if (!category) {
        console.log(
          `⏭️  Skipped: ${productData.name} (category '${productData.categorySlug}' not found)`
        );
        skipped++;
        continue;
      }

      // Find brand by name if specified
      let brandId = null;
      if (productData.brandName) {
        const brand = brands.find((b) => b.name === productData.brandName);
        if (brand) {
          brandId = brand.id;
        }
      }

      const slug = generateSlug(productData.name);

      // Check if product already exists
      const existing = await prisma.product.findFirst({
        where: {
          OR: [{ name: productData.name, shopId }, { slug }],
        },
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${productData.name} (already exists)`);
        skipped++;
        continue;
      }

      // Generate randomized metrics using Faker
      const { ratingCount, averageRating } = generateRatingMetrics();
      const { views, sales } = generateMetrics();
      const { price, salePrice } = calculatePrices(
        productData.basePrice,
        productData.salePercentage
      );
      const stock = faker.number.int({
        min: productData.stockRange.min,
        max: productData.stockRange.max,
      });

      // Generate placeholder images using picsum.photos with Faker
      const randomImageId = faker.number.int({ min: 1, max: 1000 });
      const placeholderImages = [
        `https://picsum.photos/seed/${randomImageId}/800/600`,
        `https://picsum.photos/seed/${randomImageId + 1}/800/600`,
      ];

      // Create the product with placeholder images
      await prisma.product.create({
        data: {
          shopId,
          name: productData.name,
          description: productData.description,
          categoryId: category.id,
          brandId,
          productType: productData.productType,
          price,
          salePrice,
          stock,
          images: placeholderImages,
          slug,
          tags: productData.tags,
          status: productData.status,
          visibility: 'PUBLIC', // Explicitly set visibility for public marketplace
          isActive: true,
          isFeatured: productData.isFeatured || false,
          averageRating,
          ratingCount,
          views,
          sales,
          deletedAt: null, // Explicitly set to null for soft-delete support
        },
      });

      console.log(`✅ Created: ${productData.name}`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating ${productData.name}:`, error);
      errors++;
    }
  }

  return { created, skipped, errors };
}

/**
 * Main execution
 */
async function main() {
  // Get shop ID from command line argument
  const shopId = process.argv[2];

  if (!shopId) {
    console.error('❌ Error: Shop ID is required!');
    console.log('\nUsage:');
    console.log('  npx ts-node src/scripts/seed-products.ts <SHOP_ID>');
    console.log('\nExample:');
    console.log('  npx ts-node src/scripts/seed-products.ts 60a7f2e3b5c4d6e8f9a0b1c2');
    console.log('\nTo get your shop ID:');
    console.log('  1. Log in to seller-ui');
    console.log('  2. Open browser console');
    console.log('  3. Run: sessionStorage.getItem("user")');
    console.log('  4. Or check MongoDB seller database for your shop\n');
    process.exit(1);
  }

  console.log('🏪 TecShop Product Seeder\n');
  console.log(`Target Shop ID: ${shopId}\n`);

  try {
    const results = await seedProducts(shopId);

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Created: ${results.created} products`);
    console.log(`   ⏭️  Skipped: ${results.skipped} products (already exist or category not found)`);
    console.log(`   ❌ Errors: ${results.errors} products`);
    console.log(`   📦 Total: ${mockProducts.length} products in template\n`);

    console.log('✨ Product seeding completed!\n');
    console.log('📝 Next steps:');
    console.log('   1. Log in to seller-ui dashboard');
    console.log('   2. Navigate to All Products page');
    console.log('   3. Edit each product to add real images from Unsplash');
    console.log('   4. Update product details as needed\n');
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding script
main();
