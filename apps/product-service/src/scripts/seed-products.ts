import { PrismaClient as ProductPrismaClient } from '@tec-shop/product-client';
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
  price: number;
  salePrice?: number;
  stock: number;
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
    price: 299.99,
    salePrice: 249.99,
    stock: 50,
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
    price: 19.99,
    stock: 200,
    tags: ['usb-c', 'cable', 'charging', 'fast-charge'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description: '<p>RGB mechanical keyboard with Cherry MX switches. Customizable per-key lighting and macro support.</p><p>Features:</p><ul><li>Cherry MX Red switches</li><li>RGB backlighting</li><li>Programmable keys</li><li>Detachable USB-C cable</li></ul>',
    categorySlug: 'computer-accessories',
    brandName: null,
    price: 149.99,
    salePrice: 119.99,
    stock: 30,
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
    price: 599.99,
    salePrice: 499.99,
    stock: 15,
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
    price: 19.99,
    stock: 100,
    tags: ['t-shirt', 'cotton', 'casual', 'basics'],
    productType: 'VARIABLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Running Shoes',
    description: '<p>Lightweight running shoes with responsive cushioning and breathable mesh upper.</p><p>Features:</p><ul><li>Breathable mesh</li><li>Responsive foam</li><li>Durable rubber outsole</li><li>Reflective details</li></ul>',
    categorySlug: 'shoes-footwear',
    brandName: 'Nike',
    price: 129.99,
    salePrice: 99.99,
    stock: 45,
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
    price: 49.99,
    stock: 80,
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
    price: 299.99,
    salePrice: 249.99,
    stock: 25,
    tags: ['cookware', 'kitchen', 'stainless-steel', 'pots-pans'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'LED Desk Lamp',
    description: '<p>Modern LED desk lamp with touch control and adjustable brightness. USB charging port included.</p><p>Perfect for home office or study.</p>',
    categorySlug: 'lighting',
    brandName: null,
    price: 39.99,
    stock: 60,
    tags: ['lamp', 'led', 'desk', 'lighting'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Premium Bed Sheets Set',
    description: '<p>Ultra-soft microfiber bed sheets set. Includes fitted sheet, flat sheet, and pillowcases.</p><p>Wrinkle-resistant and hypoallergenic.</p>',
    categorySlug: 'bedding-bath',
    brandName: null,
    price: 59.99,
    salePrice: 44.99,
    stock: 40,
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
    price: 34.99,
    stock: 75,
    tags: ['yoga', 'fitness', 'exercise', 'mat'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Camping Tent - 4 Person',
    description: '<p>Waterproof 4-person camping tent with easy setup. Includes rainfly and storage pockets.</p><p>Features:</p><ul><li>Waterproof 3000mm</li><li>Easy 10-minute setup</li><li>Ventilation windows</li><li>Interior storage pockets</li></ul>',
    categorySlug: 'outdoor-recreation',
    brandName: 'The North Face',
    price: 199.99,
    salePrice: 159.99,
    stock: 20,
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
    price: 49.99,
    stock: 90,
    tags: ['skincare', 'serum', 'anti-aging', 'beauty'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Hair Straightener',
    description: '<p>Professional ceramic hair straightener with adjustable temperature control. Heats up in 30 seconds.</p><p>Temperature range: 150°C - 230°C</p>',
    categorySlug: 'personal-care-appliances',
    brandName: null,
    price: 69.99,
    salePrice: 54.99,
    stock: 35,
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
    price: 16.99,
    stock: 150,
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
    price: 89.99,
    stock: 40,
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
    price: 24.99,
    stock: 65,
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
    price: 79.99,
    salePrice: 64.99,
    stock: 30,
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
    price: 29.99,
    stock: 120,
    tags: ['mouse', 'wireless', 'office', 'ergonomic'],
    productType: 'SIMPLE',
    status: 'PUBLISHED',
  },
  {
    name: 'Notebook Set - 5 Pack',
    description: '<p>Premium hardcover notebooks with dotted pages. Perfect for journaling, planning, or note-taking.</p><p>Each notebook has 120 pages.</p>',
    categorySlug: 'stationery-writing',
    brandName: null,
    price: 34.99,
    stock: 85,
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
 * Generate random rating metrics
 */
function generateRatingMetrics() {
  const ratingCount = Math.floor(Math.random() * 50) + 5; // 5-55 ratings
  const averageRating = (Math.random() * 2 + 3).toFixed(1); // 3.0-5.0 rating
  return {
    ratingCount,
    averageRating: parseFloat(averageRating),
  };
}

/**
 * Generate random views and sales
 */
function generateMetrics() {
  return {
    views: Math.floor(Math.random() * 1000) + 100, // 100-1100 views
    sales: Math.floor(Math.random() * 50) + 5, // 5-55 sales
  };
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

      const { ratingCount, averageRating } = generateRatingMetrics();
      const { views, sales } = generateMetrics();

      // Generate placeholder images using picsum.photos (better than placeholder.com)
      const randomImageId = Math.floor(Math.random() * 1000) + 1;
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
          price: productData.price,
          salePrice: productData.salePrice,
          stock: productData.stock,
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
