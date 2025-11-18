import { PrismaClient as AuthPrismaClient } from '@tec-shop/auth-client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const prisma = new AuthPrismaClient();

/**
 * Default admin credentials
 * IMPORTANT: Change these credentials after first login!
 */
const defaultAdmin = {
  email: 'admin@tec-shop.com',
  // name: 'TecShop Administrator',
  password: 'Admin@123456', // Must meet password requirements: min 8 chars, uppercase, lowercase, number, special char
};

/**
 * Seed the first admin user into the database
 */
async function seedAdmin() {
  console.log('Starting admin user seeding...\n');

  try {
    // Check if any admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { userType: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      // console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      console.log('\nSkipping admin creation to prevent duplicates.\n');
      return;
    }

    // Check if email is already taken by non-admin user
    const existingEmail = await prisma.user.findUnique({
      where: { email: defaultAdmin.email },
    });

    if (existingEmail) {
      console.error(
        `Email ${defaultAdmin.email} is already registered to a ${existingEmail.userType} user.`
      );
      console.error(
        'Please use a different email or delete the existing user first.\n'
      );
      process.exit(1);
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

    // Create the admin user
    console.log('Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        email: defaultAdmin.email,
        // name: defaultAdmin.name,
        password: hashedPassword,
        userType: 'ADMIN',
        isEmailVerified: true, // Admins are auto-verified
        isBanned: false,
      },
      select: {
        id: true,
        email: true,
        // name: true,
        userType: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    console.log('\n Admin user created successfully!');
    console.log('\n Admin Credentials:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    // console.log(`   Name: ${admin.name}`);
    console.log(`   Password: ${defaultAdmin.password}`);
    console.log(`   User Type: ${admin.userType}`);
    console.log(`   Email Verified: ${admin.isEmailVerified}`);
    console.log(`   Created At: ${admin.createdAt}`);
    console.log('\n IMPORTANT: Change this password after first login!');
    console.log(
      '            Use the admin dashboard Team Management page to add more admins.\n'
    );
  } catch (error) {
    console.error('Error during admin seeding:', error);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedAdmin();
    console.log('Admin seeding completed successfully!\n');
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding script
main();
