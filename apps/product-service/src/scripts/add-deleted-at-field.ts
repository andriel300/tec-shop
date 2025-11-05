import { PrismaClient } from '@tec-shop/product-client';

/**
 * Migration Script: Add deletedAt field to existing products
 *
 * This script sets deletedAt = null for all existing products that don't have this field.
 * Run once after adding the deletedAt field to the schema.
 */
async function addDeletedAtField() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Starting migration: Adding deletedAt field to existing products...');

    // Update all products that don't have deletedAt field or have it as undefined
    const result = await prisma.$runCommandRaw({
      update: 'Product',
      updates: [
        {
          q: { deletedAt: { $exists: false } }, // Find products without deletedAt field
          u: { $set: { deletedAt: null } },      // Set deletedAt to null
          multi: true,                            // Update all matching documents
        },
      ],
    });

    console.log('✅ Migration completed successfully!');
    console.log(`   Modified ${(result as any).n || 0} products`);

    // Verify the update
    const totalProducts = await prisma.product.count();
    const productsWithDeletedAt = await prisma.product.count({
      where: {
        deletedAt: null,
      },
    });

    console.log(`\n📊 Statistics:`);
    console.log(`   Total products: ${totalProducts}`);
    console.log(`   Products with deletedAt=null: ${productsWithDeletedAt}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addDeletedAtField();
