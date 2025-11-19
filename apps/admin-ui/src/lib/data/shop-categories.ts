/**
 * Shop Categories Data
 * Contains all available shop categories with their display names
 */

export interface ShopCategory {
  value: string;
  label: string;
  description?: string;
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  // Technology & Electronics
  { value: 'electronics', label: 'Electronics & Technology', description: 'Gadgets, devices, and tech accessories' },
  { value: 'computers', label: 'Computers & Software', description: 'Hardware, software, and IT services' },
  { value: 'mobile', label: 'Mobile & Accessories', description: 'Phones, tablets, and mobile accessories' },

  // Fashion & Lifestyle
  { value: 'fashion', label: 'Fashion & Clothing', description: 'Apparel, footwear, and fashion accessories' },
  { value: 'jewelry', label: 'Jewelry & Watches', description: 'Fine jewelry, watches, and accessories' },
  { value: 'beauty', label: 'Beauty & Personal Care', description: 'Cosmetics, skincare, and personal hygiene' },

  // Home & Living
  { value: 'home-decor', label: 'Home & Decor', description: 'Furniture, decorations, and home accessories' },
  { value: 'kitchen', label: 'Kitchen & Dining', description: 'Cookware, appliances, and dining accessories' },
  { value: 'garden', label: 'Garden & Outdoor', description: 'Plants, garden tools, and outdoor equipment' },

  // Food & Beverage
  { value: 'food', label: 'Food & Beverages', description: 'Fresh food, packaged goods, and beverages' },
  { value: 'restaurant', label: 'Restaurant & Catering', description: 'Dining services and food delivery' },
  { value: 'bakery', label: 'Bakery & Sweets', description: 'Baked goods, desserts, and confectionery' },

  // Health & Fitness
  { value: 'health', label: 'Health & Wellness', description: 'Health products and wellness services' },
  { value: 'fitness', label: 'Sports & Fitness', description: 'Exercise equipment and sporting goods' },
  { value: 'pharmacy', label: 'Pharmacy & Medical', description: 'Medicines, medical supplies, and health services' },

  // Arts & Entertainment
  { value: 'books', label: 'Books & Media', description: 'Books, magazines, and digital media' },
  { value: 'art', label: 'Arts & Crafts', description: 'Artwork, craft supplies, and handmade items' },
  { value: 'music', label: 'Music & Instruments', description: 'Musical instruments and audio equipment' },

  // Services
  { value: 'services', label: 'Professional Services', description: 'Consulting, repair, and professional services' },
  { value: 'automotive', label: 'Automotive', description: 'Car parts, accessories, and automotive services' },
  { value: 'education', label: 'Education & Training', description: 'Educational services and learning materials' },

  // Miscellaneous
  { value: 'toys', label: 'Toys & Games', description: 'Children\'s toys, games, and educational items' },
  { value: 'pets', label: 'Pet Supplies', description: 'Pet food, accessories, and care products' },
  { value: 'other', label: 'Other', description: 'Miscellaneous products and services' },
];

/**
 * Get all shop categories as select options
 */
export function getShopCategoryOptions(): Array<{ value: string; label: string }> {
  return SHOP_CATEGORIES.map(({ value, label }) => ({
    value,
    label,
  }));
}

/**
 * Get category by value
 */
export function getCategoryByValue(value: string): ShopCategory | undefined {
  return SHOP_CATEGORIES.find(category => category.value === value);
}

/**
 * Get category label by value
 */
export function getCategoryLabel(value: string): string {
  const category = getCategoryByValue(value);
  return category?.label || value;
}