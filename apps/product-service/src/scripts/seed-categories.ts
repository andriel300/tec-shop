import { PrismaClient as ProductPrismaClient } from '@tec-shop/product-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const prisma = new ProductPrismaClient();

/**
 * Category structure interface
 */
interface CategoryData {
  name: string;
  description: string;
  children?: CategoryData[];
}

/**
 * Comprehensive category tree structure
 * Organized hierarchically like major e-commerce platforms
 */
const categoryTree: CategoryData[] = [
  {
    name: 'Electronics',
    description: 'Electronic devices, gadgets, and accessories',
    children: [
      {
        name: 'Smartphones & Tablets',
        description: 'Mobile phones, tablets, and accessories',
      },
      {
        name: 'Computers & Laptops',
        description: 'Desktop computers, laptops, and computer accessories',
      },
      {
        name: 'Computer Accessories',
        description: 'Keyboards, mice, monitors, and peripherals',
      },
      {
        name: 'Cameras & Photography',
        description: 'Digital cameras, lenses, and photography equipment',
      },
      {
        name: 'Audio & Headphones',
        description: 'Headphones, earbuds, speakers, and audio equipment',
      },
      {
        name: 'Televisions & Home Theater',
        description: 'TVs, projectors, and home theater systems',
      },
      {
        name: 'Wearable Technology',
        description: 'Smartwatches, fitness trackers, and wearable devices',
      },
      {
        name: 'Gaming Consoles & Accessories',
        description: 'Video game consoles, controllers, and gaming accessories',
      },
      {
        name: 'Networking & Smart Home',
        description: 'Routers, smart home devices, and IoT products',
      },
    ],
  },
  {
    name: 'Fashion & Apparel',
    description: 'Clothing, shoes, and fashion accessories',
    children: [
      {
        name: "Men's Clothing",
        description: 'Shirts, pants, suits, and men\'s fashion',
      },
      {
        name: "Women's Clothing",
        description: 'Dresses, tops, bottoms, and women\'s fashion',
      },
      {
        name: "Kids' Clothing",
        description: 'Children\'s clothing and baby wear',
      },
      {
        name: 'Shoes & Footwear',
        description: 'Sneakers, boots, sandals, and footwear',
      },
      {
        name: 'Bags & Luggage',
        description: 'Handbags, backpacks, luggage, and travel accessories',
      },
      {
        name: 'Jewelry & Watches',
        description: 'Jewelry, watches, and fashion accessories',
      },
      {
        name: 'Sunglasses & Eyewear',
        description: 'Sunglasses, eyeglasses, and optical accessories',
      },
      {
        name: 'Athletic & Sportswear',
        description: 'Sports clothing, activewear, and gym apparel',
      },
    ],
  },
  {
    name: 'Home & Garden',
    description: 'Furniture, home decor, and garden supplies',
    children: [
      {
        name: 'Furniture',
        description: 'Sofas, beds, tables, chairs, and home furniture',
      },
      {
        name: 'Kitchen & Dining',
        description: 'Cookware, dinnerware, and kitchen appliances',
      },
      {
        name: 'Bedding & Bath',
        description: 'Bed sheets, towels, and bathroom accessories',
      },
      {
        name: 'Home Decor',
        description: 'Wall art, decorations, and home accents',
      },
      {
        name: 'Lighting',
        description: 'Lamps, light fixtures, and lighting accessories',
      },
      {
        name: 'Storage & Organization',
        description: 'Storage boxes, shelving, and organization solutions',
      },
      {
        name: 'Garden & Outdoor',
        description: 'Gardening tools, plants, and outdoor furniture',
      },
      {
        name: 'Home Appliances',
        description: 'Vacuum cleaners, air purifiers, and household appliances',
      },
    ],
  },
  {
    name: 'Sports & Outdoors',
    description: 'Sports equipment, outdoor gear, and fitness products',
    children: [
      {
        name: 'Exercise & Fitness',
        description: 'Gym equipment, weights, and fitness accessories',
      },
      {
        name: 'Outdoor Recreation',
        description: 'Camping, hiking, and outdoor adventure gear',
      },
      {
        name: 'Cycling',
        description: 'Bicycles, cycling accessories, and bike parts',
      },
      {
        name: 'Team Sports',
        description: 'Basketball, soccer, football, and team sports equipment',
      },
      {
        name: 'Water Sports',
        description: 'Swimming, surfing, and water sports equipment',
      },
      {
        name: 'Winter Sports',
        description: 'Skiing, snowboarding, and winter sports gear',
      },
    ],
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Cosmetics, skincare, and personal care products',
    children: [
      {
        name: 'Makeup & Cosmetics',
        description: 'Foundation, lipstick, eyeshadow, and makeup products',
      },
      {
        name: 'Skincare',
        description: 'Moisturizers, cleansers, and skincare treatments',
      },
      {
        name: 'Hair Care',
        description: 'Shampoo, conditioner, and hair styling products',
      },
      {
        name: 'Fragrances',
        description: 'Perfumes, colognes, and body sprays',
      },
      {
        name: 'Personal Care Appliances',
        description: 'Hair dryers, straighteners, and grooming tools',
      },
      {
        name: 'Bath & Body',
        description: 'Body wash, lotion, and bath products',
      },
    ],
  },
  {
    name: 'Books & Media',
    description: 'Books, movies, music, and entertainment',
    children: [
      {
        name: 'Books',
        description: 'Fiction, non-fiction, textbooks, and literature',
      },
      {
        name: 'Movies & TV Shows',
        description: 'DVDs, Blu-rays, and digital media',
      },
      {
        name: 'Music',
        description: 'CDs, vinyl records, and music downloads',
      },
      {
        name: 'Video Games',
        description: 'Console games, PC games, and gaming accessories',
      },
      {
        name: 'Magazines & Newspapers',
        description: 'Periodicals, magazines, and subscriptions',
      },
    ],
  },
  {
    name: 'Toys & Games',
    description: 'Toys, games, and entertainment for children',
    children: [
      {
        name: 'Action Figures & Collectibles',
        description: 'Action figures, statues, and collectible toys',
      },
      {
        name: 'Building Toys',
        description: 'LEGO, building blocks, and construction sets',
      },
      {
        name: 'Dolls & Accessories',
        description: 'Dolls, dollhouses, and doll accessories',
      },
      {
        name: 'Board Games & Puzzles',
        description: 'Board games, card games, and jigsaw puzzles',
      },
      {
        name: 'Remote Control Toys',
        description: 'RC cars, drones, and remote-controlled toys',
      },
      {
        name: 'Educational Toys',
        description: 'STEM toys, learning games, and educational products',
      },
    ],
  },
  {
    name: 'Automotive',
    description: 'Car parts, accessories, and automotive products',
    children: [
      {
        name: 'Car Electronics',
        description: 'GPS, dash cams, and car audio systems',
      },
      {
        name: 'Car Accessories',
        description: 'Floor mats, seat covers, and car organizers',
      },
      {
        name: 'Tools & Equipment',
        description: 'Car maintenance tools and equipment',
      },
      {
        name: 'Tires & Wheels',
        description: 'Tires, wheels, and tire accessories',
      },
      {
        name: 'Oils & Fluids',
        description: 'Motor oil, coolant, and automotive fluids',
      },
    ],
  },
  {
    name: 'Health & Household',
    description: 'Health products, vitamins, and household essentials',
    children: [
      {
        name: 'Vitamins & Supplements',
        description: 'Vitamins, minerals, and dietary supplements',
      },
      {
        name: 'Medical Supplies',
        description: 'First aid, medical devices, and health equipment',
      },
      {
        name: 'Household Essentials',
        description: 'Cleaning supplies, paper products, and household items',
      },
      {
        name: 'Sexual Wellness',
        description: 'Personal care and wellness products',
      },
    ],
  },
  {
    name: 'Baby & Kids',
    description: 'Baby products, nursery items, and kids essentials',
    children: [
      {
        name: 'Baby Gear',
        description: 'Strollers, car seats, and baby carriers',
      },
      {
        name: 'Diapering',
        description: 'Diapers, wipes, and diaper bags',
      },
      {
        name: 'Baby Health & Safety',
        description: 'Baby monitors, safety gates, and health products',
      },
      {
        name: 'Nursery Furniture',
        description: 'Cribs, changing tables, and nursery decor',
      },
      {
        name: 'Baby Feeding',
        description: 'Bottles, breast pumps, and feeding accessories',
      },
    ],
  },
  {
    name: 'Pet Supplies',
    description: 'Products for dogs, cats, and other pets',
    children: [
      {
        name: 'Dog Supplies',
        description: 'Dog food, toys, collars, and accessories',
      },
      {
        name: 'Cat Supplies',
        description: 'Cat food, litter, toys, and accessories',
      },
      {
        name: 'Fish & Aquatics',
        description: 'Aquariums, fish food, and aquatic supplies',
      },
      {
        name: 'Bird Supplies',
        description: 'Bird cages, food, and bird care products',
      },
    ],
  },
  {
    name: 'Office & School Supplies',
    description: 'Office equipment, stationery, and school supplies',
    children: [
      {
        name: 'Office Electronics',
        description: 'Printers, scanners, and office equipment',
      },
      {
        name: 'Office Furniture',
        description: 'Desks, chairs, and office storage',
      },
      {
        name: 'Stationery & Writing',
        description: 'Pens, notebooks, and writing supplies',
      },
      {
        name: 'School Supplies',
        description: 'Backpacks, lunchboxes, and student supplies',
      },
    ],
  },
  {
    name: 'Arts & Crafts',
    description: 'Art supplies, craft materials, and creative products',
    children: [
      {
        name: 'Painting & Drawing',
        description: 'Paints, brushes, canvases, and drawing supplies',
      },
      {
        name: 'Sewing & Fabric',
        description: 'Sewing machines, fabric, and sewing supplies',
      },
      {
        name: 'Scrapbooking',
        description: 'Scrapbook albums, stickers, and decorative supplies',
      },
      {
        name: 'Craft Supplies',
        description: 'Glue, scissors, craft paper, and general supplies',
      },
    ],
  },
  {
    name: 'Food & Grocery',
    description: 'Food products, beverages, and grocery items',
    children: [
      {
        name: 'Beverages',
        description: 'Coffee, tea, juice, and soft drinks',
      },
      {
        name: 'Snacks & Candy',
        description: 'Chips, cookies, chocolate, and snacks',
      },
      {
        name: 'Pantry Staples',
        description: 'Pasta, rice, canned goods, and cooking essentials',
      },
      {
        name: 'Organic & Natural',
        description: 'Organic foods and natural products',
      },
    ],
  },
  {
    name: 'Musical Instruments',
    description: 'Instruments, audio equipment, and music accessories',
    children: [
      {
        name: 'Guitars & String Instruments',
        description: 'Guitars, violins, and string instruments',
      },
      {
        name: 'Pianos & Keyboards',
        description: 'Pianos, keyboards, and electronic instruments',
      },
      {
        name: 'Drums & Percussion',
        description: 'Drums, cymbals, and percussion instruments',
      },
      {
        name: 'Wind Instruments',
        description: 'Flutes, saxophones, and wind instruments',
      },
    ],
  },
];

/**
 * Generate URL-friendly slug from category name
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
 * Recursively seed categories
 */
async function seedCategoryTree(
  categories: CategoryData[],
  parentId: string | null = null,
  level = 0
): Promise<{ created: number; skipped: number; errors: number }> {
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const categoryData of categories) {
    try {
      const slug = generateSlug(categoryData.name);

      // Check if category already exists
      const existing = await prisma.category.findFirst({
        where: {
          OR: [
            { name: categoryData.name, parentId },
            { slug, parentId },
          ],
        },
      });

      if (existing) {
        const indent = '  '.repeat(level);
        console.log(`${indent}⏭️  Skipped: ${categoryData.name} (already exists)`);
        skipped++;

        // Still process children with existing parent ID
        if (categoryData.children && categoryData.children.length > 0) {
          const childResults = await seedCategoryTree(
            categoryData.children,
            existing.id,
            level + 1
          );
          created += childResults.created;
          skipped += childResults.skipped;
          errors += childResults.errors;
        }

        continue;
      }

      // Create the category
      const newCategory = await prisma.category.create({
        data: {
          name: categoryData.name,
          slug,
          description: categoryData.description,
          parentId,
          isActive: true,
        },
      });

      const indent = '  '.repeat(level);
      console.log(`${indent}✅ Created: ${categoryData.name}`);
      created++;

      // Process children recursively
      if (categoryData.children && categoryData.children.length > 0) {
        const childResults = await seedCategoryTree(
          categoryData.children,
          newCategory.id,
          level + 1
        );
        created += childResults.created;
        skipped += childResults.skipped;
        errors += childResults.errors;
      }
    } catch (error) {
      const indent = '  '.repeat(level);
      console.error(`${indent}❌ Error creating ${categoryData.name}:`, error);
      errors++;
    }
  }

  return { created, skipped, errors };
}

/**
 * Main seeding function
 */
async function seedCategories() {
  console.log('🌱 Starting category seeding...\n');

  const results = await seedCategoryTree(categoryTree);

  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Created: ${results.created} categories`);
  console.log(`   ⏭️  Skipped: ${results.skipped} categories (already exist)`);
  console.log(`   ❌ Errors: ${results.errors} categories`);

  const totalCategories = categoryTree.reduce((acc, cat) => {
    return acc + 1 + (cat.children?.length || 0);
  }, 0);

  console.log(`   📦 Total: ${totalCategories} categories in template\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedCategories();
    console.log('✨ Category seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding script
main();
