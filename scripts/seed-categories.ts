/**
 * Category Seeder for Multi-Vendor E-commerce Platform
 *
 * This script seeds the database with default Amazon-like categories.
 * Only platform administrators should be able to add/modify categories.
 * Sellers can only select from these pre-defined categories.
 *
 * Usage:
 *   npx ts-node scripts/seed-categories.ts
 *
 * Or add to package.json:
 *   "seed:categories": "ts-node scripts/seed-categories.ts"
 */

import { PrismaClient } from '@prisma/seller-client';

const prisma = new PrismaClient();

interface CategoryData {
  name: string;
  slug: string;
  description?: string;
  attributes?: Record<string, unknown>;
  children?: Omit<CategoryData, 'children'>[];
}

const categories: CategoryData[] = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Consumer electronics, computers, and accessories',
    attributes: {
      warranty: { required: true, type: 'text', label: 'Warranty Period' },
      brand: { required: true, type: 'text', label: 'Brand' },
    },
    children: [
      { name: 'Smartphones & Accessories', slug: 'smartphones-accessories', description: 'Mobile phones, cases, chargers, and accessories' },
      { name: 'Computers & Laptops', slug: 'computers-laptops', description: 'Desktop computers, laptops, and computer accessories' },
      { name: 'Cameras & Photography', slug: 'cameras-photography', description: 'Digital cameras, lenses, and photography equipment' },
      { name: 'TV & Home Theater', slug: 'tv-home-theater', description: 'Televisions, projectors, and home theater systems' },
      { name: 'Headphones & Audio', slug: 'headphones-audio', description: 'Headphones, speakers, and audio equipment' },
      { name: 'Wearable Technology', slug: 'wearable-technology', description: 'Smartwatches, fitness trackers, and wearables' },
      { name: 'Gaming Consoles & Accessories', slug: 'gaming-consoles-accessories', description: 'Gaming consoles, controllers, and accessories' },
    ],
  },
  {
    name: 'Clothing, Shoes & Jewelry',
    slug: 'clothing-shoes-jewelry',
    description: 'Fashion apparel, footwear, and accessories',
    attributes: {
      size: { required: true, type: 'select', label: 'Size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'] },
      color: { required: true, type: 'text', label: 'Color' },
      material: { required: true, type: 'text', label: 'Material' },
    },
    children: [
      { name: "Men's Fashion", slug: 'mens-fashion', description: 'Clothing and accessories for men' },
      { name: "Women's Fashion", slug: 'womens-fashion', description: 'Clothing and accessories for women' },
      { name: "Kids' Fashion", slug: 'kids-fashion', description: 'Clothing for children and infants' },
      { name: 'Shoes', slug: 'shoes', description: 'Footwear for all ages and occasions' },
      { name: 'Jewelry & Watches', slug: 'jewelry-watches', description: 'Jewelry, watches, and accessories' },
      { name: 'Handbags & Wallets', slug: 'handbags-wallets', description: 'Bags, wallets, and leather goods' },
    ],
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Home furnishings, decor, and kitchen essentials',
    children: [
      { name: 'Furniture', slug: 'furniture', description: 'Indoor and outdoor furniture' },
      { name: 'Kitchen & Dining', slug: 'kitchen-dining', description: 'Cookware, appliances, and dining essentials' },
      { name: 'Bedding & Bath', slug: 'bedding-bath', description: 'Bedding, towels, and bathroom accessories' },
      { name: 'Home Decor', slug: 'home-decor', description: 'Decorative items and accents' },
      { name: 'Storage & Organization', slug: 'storage-organization', description: 'Storage solutions and organizers' },
      { name: 'Lighting & Ceiling Fans', slug: 'lighting-ceiling-fans', description: 'Lamps, light fixtures, and ceiling fans' },
      { name: 'Home Appliances', slug: 'home-appliances', description: 'Large and small home appliances' },
    ],
  },
  {
    name: 'Books & Media',
    slug: 'books-media',
    description: 'Books, movies, music, and entertainment',
    children: [
      { name: 'Books', slug: 'books', description: 'Physical and digital books' },
      { name: 'Movies & TV', slug: 'movies-tv', description: 'DVDs, Blu-rays, and digital video' },
      { name: 'Music', slug: 'music', description: 'CDs, vinyl, and digital music' },
      { name: 'Video Games', slug: 'video-games', description: 'Video games for all platforms' },
      { name: 'Magazines & Newspapers', slug: 'magazines-newspapers', description: 'Periodicals and subscriptions' },
    ],
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Sporting goods and outdoor equipment',
    children: [
      { name: 'Exercise & Fitness', slug: 'exercise-fitness', description: 'Gym equipment and fitness gear' },
      { name: 'Outdoor Recreation', slug: 'outdoor-recreation', description: 'Outdoor activities and gear' },
      { name: 'Sports Equipment', slug: 'sports-equipment', description: 'Equipment for various sports' },
      { name: 'Camping & Hiking', slug: 'camping-hiking', description: 'Camping gear and hiking equipment' },
      { name: 'Cycling', slug: 'cycling', description: 'Bicycles and cycling accessories' },
      { name: 'Water Sports', slug: 'water-sports', description: 'Swimming, surfing, and water activities' },
    ],
  },
  {
    name: 'Toys & Games',
    slug: 'toys-games',
    description: 'Toys, games, and entertainment for kids',
    children: [
      { name: 'Action Figures & Collectibles', slug: 'action-figures-collectibles', description: 'Action figures, statues, and collectibles' },
      { name: 'Board Games & Puzzles', slug: 'board-games-puzzles', description: 'Board games, card games, and puzzles' },
      { name: 'Educational Toys', slug: 'educational-toys', description: 'Learning and educational toys' },
      { name: 'Dolls & Accessories', slug: 'dolls-accessories', description: 'Dolls and doll accessories' },
      { name: 'Building Toys', slug: 'building-toys', description: 'Construction sets and building blocks' },
      { name: 'Outdoor Play', slug: 'outdoor-play', description: 'Outdoor toys and play equipment' },
    ],
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    description: 'Beauty products and personal care items',
    children: [
      { name: 'Makeup', slug: 'makeup', description: 'Cosmetics and makeup products' },
      { name: 'Skin Care', slug: 'skin-care', description: 'Skincare and facial products' },
      { name: 'Hair Care', slug: 'hair-care', description: 'Shampoo, conditioner, and styling products' },
      { name: 'Fragrances', slug: 'fragrances', description: 'Perfumes and colognes' },
      { name: 'Personal Care', slug: 'personal-care', description: 'Personal hygiene and grooming products' },
      { name: 'Oral Care', slug: 'oral-care', description: 'Dental care and oral hygiene' },
    ],
  },
  {
    name: 'Health & Household',
    slug: 'health-household',
    description: 'Health products and household essentials',
    children: [
      { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Dietary supplements and vitamins' },
      { name: 'Medical Supplies', slug: 'medical-supplies', description: 'Medical equipment and supplies' },
      { name: 'Household Supplies', slug: 'household-supplies', description: 'Cleaning and household products' },
      { name: 'Sexual Wellness', slug: 'sexual-wellness', description: 'Sexual health and wellness products' },
    ],
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    description: 'Auto parts, accessories, and tools',
    children: [
      { name: 'Car Parts & Accessories', slug: 'car-parts-accessories', description: 'Replacement parts and car accessories' },
      { name: 'Motorcycle & Powersports', slug: 'motorcycle-powersports', description: 'Motorcycle parts and accessories' },
      { name: 'Tools & Equipment', slug: 'tools-equipment', description: 'Automotive tools and equipment' },
      { name: 'Car Electronics', slug: 'car-electronics', description: 'GPS, dash cams, and car electronics' },
    ],
  },
  {
    name: 'Baby Products',
    slug: 'baby-products',
    description: 'Baby care, nursery, and maternity products',
    children: [
      { name: 'Diapering', slug: 'diapering', description: 'Diapers, wipes, and changing supplies' },
      { name: 'Nursery', slug: 'nursery', description: 'Cribs, furniture, and nursery decor' },
      { name: 'Baby Care', slug: 'baby-care', description: 'Baby grooming and health products' },
      { name: 'Strollers & Car Seats', slug: 'strollers-car-seats', description: 'Strollers, carriers, and car seats' },
      { name: 'Feeding', slug: 'feeding', description: 'Bottles, breast pumps, and feeding accessories' },
      { name: 'Baby Toys', slug: 'baby-toys', description: 'Toys and entertainment for infants' },
    ],
  },
  {
    name: 'Pet Supplies',
    slug: 'pet-supplies',
    description: 'Pet food, toys, and accessories',
    children: [
      { name: 'Dog Supplies', slug: 'dog-supplies', description: 'Food, toys, and accessories for dogs' },
      { name: 'Cat Supplies', slug: 'cat-supplies', description: 'Food, toys, and accessories for cats' },
      { name: 'Fish & Aquatic Pets', slug: 'fish-aquatic-pets', description: 'Aquariums and fish supplies' },
      { name: 'Bird Supplies', slug: 'bird-supplies', description: 'Cages, food, and bird accessories' },
      { name: 'Small Animal Supplies', slug: 'small-animal-supplies', description: 'Supplies for hamsters, rabbits, etc.' },
    ],
  },
  {
    name: 'Office & School Supplies',
    slug: 'office-school-supplies',
    description: 'Office products and school essentials',
    children: [
      { name: 'Office Supplies', slug: 'office-supplies', description: 'Stationery and office essentials' },
      { name: 'School Supplies', slug: 'school-supplies', description: 'Backpacks, notebooks, and school items' },
      { name: 'Office Furniture', slug: 'office-furniture', description: 'Desks, chairs, and office furniture' },
      { name: 'Office Electronics', slug: 'office-electronics', description: 'Printers, shredders, and office equipment' },
    ],
  },
  {
    name: 'Arts, Crafts & Sewing',
    slug: 'arts-crafts-sewing',
    description: 'Art supplies, crafts, and sewing materials',
    children: [
      { name: 'Painting & Drawing', slug: 'painting-drawing', description: 'Art supplies for painting and drawing' },
      { name: 'Crafting', slug: 'crafting', description: 'Craft supplies and DIY materials' },
      { name: 'Sewing', slug: 'sewing', description: 'Sewing machines, fabric, and notions' },
      { name: 'Scrapbooking', slug: 'scrapbooking', description: 'Scrapbooking supplies and albums' },
    ],
  },
  {
    name: 'Tools & Home Improvement',
    slug: 'tools-home-improvement',
    description: 'Tools and home improvement supplies',
    children: [
      { name: 'Power Tools', slug: 'power-tools', description: 'Electric and battery-powered tools' },
      { name: 'Hand Tools', slug: 'hand-tools', description: 'Manual tools and hardware' },
      { name: 'Building Supplies', slug: 'building-supplies', description: 'Lumber, hardware, and building materials' },
      { name: 'Electrical', slug: 'electrical', description: 'Electrical supplies and fixtures' },
      { name: 'Plumbing', slug: 'plumbing', description: 'Plumbing supplies and fixtures' },
    ],
  },
  {
    name: 'Garden & Outdoor',
    slug: 'garden-outdoor',
    description: 'Gardening supplies and outdoor living',
    children: [
      { name: 'Gardening & Lawn Care', slug: 'gardening-lawn-care', description: 'Tools and supplies for gardening' },
      { name: 'Outdoor Furniture', slug: 'outdoor-furniture', description: 'Patio and outdoor furniture' },
      { name: 'Grills & Outdoor Cooking', slug: 'grills-outdoor-cooking', description: 'Grills, smokers, and outdoor cooking' },
      { name: 'Outdoor Decor', slug: 'outdoor-decor', description: 'Outdoor decorations and lighting' },
    ],
  },
];

async function seedCategories() {
  console.log('🌱 Starting category seeder...\n');

  try {
    // Clear existing categories (optional - remove if you want to keep existing data)
    console.log('🗑️  Clearing existing categories...');
    await prisma.product.updateMany({
      data: { categoryId: null },
    });
    await prisma.category.deleteMany({});
    console.log('✅ Existing categories cleared\n');

    // Seed parent categories first
    console.log('📦 Seeding parent categories...');
    for (const categoryData of categories) {
      const { children, ...parentData } = categoryData;

      const parent = await prisma.category.create({
        data: {
          ...parentData,
          isActive: true,
          position: categories.indexOf(categoryData),
        },
      });

      console.log(`  ✓ Created: ${parent.name}`);

      // Seed child categories
      if (children && children.length > 0) {
        for (const childData of children) {
          const child = await prisma.category.create({
            data: {
              ...childData,
              parentId: parent.id,
              isActive: true,
              position: children.indexOf(childData),
            },
          });
          console.log(`    ↳ ${child.name}`);
        }
      }
    }

    const totalCategories = await prisma.category.count();
    console.log(`\n✅ Successfully seeded ${totalCategories} categories!`);
    console.log('🎉 Category seeder completed!\n');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedCategories()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
