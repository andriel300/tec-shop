/**
 * Variant Manager Utility Functions
 * Pure functions for SKU generation, attribute detection, and placeholders
 */

/**
 * Check if an attribute name is color-related
 */
export const isColorAttribute = (attributeName: string): boolean => {
  const name = attributeName.toLowerCase();
  return name === 'color' || name === 'colour' || name === 'colors' || name === 'colours';
};

/**
 * Get contextual placeholder examples based on attribute name
 */
export const getAttributePlaceholder = (attributeName: string): string => {
  const name = attributeName.toLowerCase();

  const examples: Record<string, string> = {
    // Size variations
    size: 'XS, S, M, L, XL, XXL',
    sizes: 'XS, S, M, L, XL',

    // Color variations
    color: 'Red, Blue, Green, Black',
    colour: 'Red, Blue, Green',
    colors: 'Red, Blue, Black',

    // Material variations
    material: 'Cotton, Polyester, Leather, Plastic, Aluminium',
    materials: 'Wood, Metal, Plastic',
    fabric: 'Cotton, Silk, Denim',

    // Style variations
    style: 'Classic, Modern, Vintage',
    pattern: 'Solid, Striped, Checkered',
    design: 'Minimalist, Ornate, Abstract',

    // Fit variations
    fit: 'Slim, Regular, Loose',
    cut: 'Straight, Tapered, Bootcut',

    // Storage/Capacity
    storage: '64GB, 128GB, 256GB',
    capacity: '500ml, 1L, 2L',
    memory: '8GB, 16GB, 32GB',

    // Flavor/Scent
    flavor: 'Vanilla, Chocolate, Strawberry',
    flavour: 'Mint, Berry, Citrus',
    scent: 'Lavender, Rose, Vanilla',
    fragrance: 'Fresh, Floral, Woody',

    // Weight
    weight: '500g, 1kg, 2kg',

    // Length/Height
    length: 'Short, Medium, Long',
    height: '10cm, 20cm, 30cm',

    // Width/Diameter
    width: 'Narrow, Standard, Wide',
    diameter: '5cm, 10cm, 15cm',

    // Age/Level
    age: '3+, 5+, 8+, 12+',
    level: 'Beginner, Intermediate, Advanced',
    difficulty: 'Easy, Medium, Hard',

    // Edition/Version
    edition: 'Standard, Deluxe, Limited',
    version: 'Basic, Pro, Premium',

    // Finish/Texture
    finish: 'Matte, Glossy, Satin',
    texture: 'Smooth, Rough, Textured',

    // Power/Voltage
    power: '10W, 25W, 50W',
    voltage: '110V, 220V, 240V',

    // Speed/Performance
    speed: 'Low, Medium, High',
    performance: 'Standard, Enhanced, Maximum',
  };

  // Check for exact match
  if (examples[name]) {
    return examples[name];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(examples)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }

  // Default fallback
  return 'Option 1, Option 2, Option 3';
};

/**
 * Generate SKU from product name and variant attributes
 */
export const generateSKU = (productName: string, attributes: Record<string, string>): string => {
  const prefix = productName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);

  const suffix = Object.values(attributes)
    .map((val) => val.substring(0, 2).toUpperCase())
    .join('-');

  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${suffix}-${timestamp}`;
};

/**
 * Generate all possible variant combinations from attributes
 * Uses cartesian product algorithm
 */
export const generateVariantCombinations = <T extends Record<string, string[]>>(
  attributes: T
): Array<Record<keyof T, string>> => {
  const keys = Object.keys(attributes) as Array<keyof T>;
  const values = keys.map(key => attributes[key]);

  if (values.some(arr => arr.length === 0)) {
    return [];
  }

  const combinations: Array<Record<keyof T, string>> = [{}  as Record<keyof T, string>];

  for (let i = 0; i < keys.length; i++) {
    const newCombinations: Array<Record<keyof T, string>> = [];

    for (const combination of combinations) {
      for (const value of values[i]) {
        newCombinations.push({
          ...combination,
          [keys[i]]: value,
        });
      }
    }

    combinations.length = 0;
    combinations.push(...newCombinations);
  }

  return combinations;
};

/**
 * Calculate total variant combinations count
 */
export const calculateCombinationCount = (attributes: Array<{ values: unknown[] }>): number => {
  return attributes.reduce((acc, attr) => {
    return acc * (attr.values.length || 1);
  }, 1);
};
