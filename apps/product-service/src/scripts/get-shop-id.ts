import { PrismaClient as SellerPrismaClient } from '@tec-shop/seller-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const prisma = new SellerPrismaClient();

/**
 * Interactive prompt to get seller email
 */
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

/**
 * Get shop ID by seller email
 */
async function getShopId() {
  console.log('🔍 TecShop - Get Shop ID\n');

  const email = await askQuestion('Enter your seller email: ');

  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address\n');
    return;
  }

  try {
    const seller = await prisma.seller.findUnique({
      where: { email },
      include: { shop: true },
    });

    if (!seller) {
      console.error(`❌ No seller found with email: ${email}\n`);
      console.log('Make sure you have:');
      console.log('  1. Signed up as a seller in seller-ui');
      console.log('  2. Verified your email');
      console.log('  3. Created your shop\n');
      return;
    }

    if (!seller.shop) {
      console.error(`❌ Seller found but no shop created yet\n`);
      console.log('Please create your shop first:');
      console.log('  1. Log in to seller-ui');
      console.log('  2. Complete shop setup\n');
      return;
    }

    console.log('\n✅ Shop found!\n');
    console.log('Seller Details:');
    console.log(`  Name: ${seller.name}`);
    console.log(`  Email: ${seller.email}`);
    console.log(`  Verified: ${seller.isVerified ? '✓' : '✗'}\n`);

    console.log('Shop Details:');
    console.log(`  Business Name: ${seller.shop.businessName}`);
    console.log(`  Category: ${seller.shop.category}`);
    console.log(`  Active: ${seller.shop.isActive ? '✓' : '✗'}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Your Shop ID:');
    console.log(`  ${seller.shop.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 To seed products, run:');
    console.log(`  npm run seed:products ${seller.shop.id}\n`);
  } catch (error) {
    console.error('❌ Error fetching shop:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
getShopId();
