import { PrismaClient as ProductPrismaClient } from '@tec-shop/product-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from product-service .env file
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Also try loading from root .env if exists
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const prisma = new ProductPrismaClient();

/**
 * Famous brands across different categories
 * Organized by industry for better marketplace coverage
 */
const famousBrands = [
  // Electronics & Technology
  { name: 'Apple', description: 'Premium electronics and innovative technology products', website: 'https://www.apple.com' },
  { name: 'Samsung', description: 'Electronics, smartphones, and home appliances', website: 'https://www.samsung.com' },
  { name: 'Sony', description: 'Electronics, gaming, and entertainment technology', website: 'https://www.sony.com' },
  { name: 'LG', description: 'Consumer electronics and home appliances', website: 'https://www.lg.com' },
  { name: 'Microsoft', description: 'Software, computing, and gaming technology', website: 'https://www.microsoft.com' },
  { name: 'Dell', description: 'Computers, laptops, and IT solutions', website: 'https://www.dell.com' },
  { name: 'HP', description: 'Computing and printing solutions', website: 'https://www.hp.com' },
  { name: 'Lenovo', description: 'Personal computers and technology devices', website: 'https://www.lenovo.com' },
  { name: 'Asus', description: 'Computer hardware and electronics', website: 'https://www.asus.com' },
  { name: 'Canon', description: 'Imaging and optical products', website: 'https://www.canon.com' },
  { name: 'Nikon', description: 'Cameras and optical equipment', website: 'https://www.nikon.com' },
  { name: 'Panasonic', description: 'Electronics and home appliances', website: 'https://www.panasonic.com' },
  { name: 'Philips', description: 'Health technology and consumer electronics', website: 'https://www.philips.com' },
  { name: 'Bose', description: 'Audio equipment and sound systems', website: 'https://www.bose.com' },
  { name: 'JBL', description: 'Audio equipment and speakers', website: 'https://www.jbl.com' },

  // Fashion & Apparel
  { name: 'Nike', description: 'Sports footwear, apparel, and equipment', website: 'https://www.nike.com' },
  { name: 'Adidas', description: 'Sports and lifestyle brand', website: 'https://www.adidas.com' },
  { name: 'Puma', description: 'Sports apparel and footwear', website: 'https://www.puma.com' },
  { name: 'Under Armour', description: 'Performance sportswear and footwear', website: 'https://www.underarmour.com' },
  { name: 'Levi\'s', description: 'Denim and casual wear', website: 'https://www.levi.com' },
  { name: 'H&M', description: 'Fast fashion and contemporary clothing', website: 'https://www.hm.com' },
  { name: 'Zara', description: 'Fashion apparel and accessories', website: 'https://www.zara.com' },
  { name: 'Gucci', description: 'Luxury fashion and leather goods', website: 'https://www.gucci.com' },
  { name: 'Louis Vuitton', description: 'Luxury fashion and accessories', website: 'https://www.louisvuitton.com' },
  { name: 'Uniqlo', description: 'Casual wear and basics', website: 'https://www.uniqlo.com' },

  // Home & Kitchen
  { name: 'IKEA', description: 'Furniture and home accessories', website: 'https://www.ikea.com' },
  { name: 'KitchenAid', description: 'Kitchen appliances and cookware', website: 'https://www.kitchenaid.com' },
  { name: 'Cuisinart', description: 'Kitchen appliances and cookware', website: 'https://www.cuisinart.com' },
  { name: 'Dyson', description: 'Vacuum cleaners and air treatment', website: 'https://www.dyson.com' },
  { name: 'Tefal', description: 'Cookware and small appliances', website: 'https://www.tefal.com' },

  // Beauty & Personal Care
  { name: 'L\'Oréal', description: 'Beauty and cosmetics products', website: 'https://www.loreal.com' },
  { name: 'Maybelline', description: 'Cosmetics and makeup', website: 'https://www.maybelline.com' },
  { name: 'Nivea', description: 'Skin care and personal care', website: 'https://www.nivea.com' },
  { name: 'Dove', description: 'Personal care products', website: 'https://www.dove.com' },
  { name: 'Gillette', description: 'Shaving and grooming products', website: 'https://www.gillette.com' },

  // Automotive
  { name: 'Bosch', description: 'Automotive parts and power tools', website: 'https://www.bosch.com' },
  { name: 'Michelin', description: 'Tires and automotive products', website: 'https://www.michelin.com' },
  { name: 'Castrol', description: 'Motor oils and lubricants', website: 'https://www.castrol.com' },

  // Food & Beverage
  { name: 'Coca-Cola', description: 'Beverages and soft drinks', website: 'https://www.coca-cola.com' },
  { name: 'Nestlé', description: 'Food and beverage products', website: 'https://www.nestle.com' },
  { name: 'Starbucks', description: 'Coffee and beverages', website: 'https://www.starbucks.com' },

  // Sports & Outdoors
  { name: 'The North Face', description: 'Outdoor apparel and equipment', website: 'https://www.thenorthface.com' },
  { name: 'Columbia', description: 'Outdoor and sportswear', website: 'https://www.columbia.com' },
  { name: 'Wilson', description: 'Sports equipment and gear', website: 'https://www.wilson.com' },
  { name: 'Spalding', description: 'Basketball equipment and sporting goods', website: 'https://www.spalding.com' },

  // Toys & Games
  { name: 'LEGO', description: 'Building toys and educational products', website: 'https://www.lego.com' },
  { name: 'Mattel', description: 'Toys and games', website: 'https://www.mattel.com' },
  { name: 'Hasbro', description: 'Toys, games, and entertainment', website: 'https://www.hasbro.com' },

  // Books & Media
  { name: 'Penguin', description: 'Book publishing', website: 'https://www.penguin.com' },
  { name: 'Marvel', description: 'Comics and entertainment', website: 'https://www.marvel.com' },
  { name: 'DC Comics', description: 'Comics and entertainment', website: 'https://www.dc.com' },

  // Generic/Multi-category
  { name: 'Generic', description: 'Unbranded or generic products', website: '' },
  { name: 'No Brand', description: 'Products without specific brand', website: '' },
];

/**
 * Generate URL-friendly slug from brand name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

/**
 * Seed brands into the database
 */
async function seedBrands() {
  console.log('🌱 Starting brand seeding...\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const brandData of famousBrands) {
    try {
      const slug = generateSlug(brandData.name);

      // Check if brand already exists
      const existing = await prisma.brand.findFirst({
        where: {
          OR: [
            { name: brandData.name },
            { slug },
          ],
        },
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${brandData.name} (already exists)`);
        skipped++;
        continue;
      }

      // Create the brand
      await prisma.brand.create({
        data: {
          name: brandData.name,
          slug,
          description: brandData.description,
          website: brandData.website || undefined,
          isActive: true,
        },
      });

      console.log(`✅ Created: ${brandData.name}`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating ${brandData.name}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Created: ${created} brands`);
  console.log(`   ⏭️  Skipped: ${skipped} brands (already exist)`);
  console.log(`   ❌ Errors: ${errors} brands`);
  console.log(`   📦 Total: ${famousBrands.length} brands processed\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedBrands();
    console.log('✨ Brand seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding script
main();
