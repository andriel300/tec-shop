/**
 * Variant Manager Constants
 * Centralized data for product option suggestions and color palette
 */

export interface ColorData {
  name: string;
  hex: string;
  textColor: string;
}

export interface AttributeSuggestion {
  name: string;
  category: string;
  icon: string;
}

/**
 * Predefined color palette with names and hex values
 * Used for visual color selection when Color is chosen as a product option
 */
export const COLOR_PALETTE: ColorData[] = [
  { name: 'Black', hex: '#000000', textColor: '#FFFFFF' },
  { name: 'White', hex: '#FFFFFF', textColor: '#000000' },
  { name: 'Gray', hex: '#9CA3AF', textColor: '#000000' },
  { name: 'Red', hex: '#EF4444', textColor: '#FFFFFF' },
  { name: 'Orange', hex: '#F97316', textColor: '#FFFFFF' },
  { name: 'Yellow', hex: '#FBBF24', textColor: '#000000' },
  { name: 'Green', hex: '#10B981', textColor: '#FFFFFF' },
  { name: 'Blue', hex: '#3B82F6', textColor: '#FFFFFF' },
  { name: 'Indigo', hex: '#6366F1', textColor: '#FFFFFF' },
  { name: 'Purple', hex: '#8B5CF6', textColor: '#FFFFFF' },
  { name: 'Pink', hex: '#EC4899', textColor: '#FFFFFF' },
  { name: 'Brown', hex: '#92400E', textColor: '#FFFFFF' },
  { name: 'Beige', hex: '#D4B896', textColor: '#000000' },
  { name: 'Navy', hex: '#1E3A8A', textColor: '#FFFFFF' },
  { name: 'Burgundy', hex: '#7F1D1D', textColor: '#FFFFFF' },
  { name: 'Teal', hex: '#14B8A6', textColor: '#FFFFFF' },
  { name: 'Lime', hex: '#84CC16', textColor: '#000000' },
  { name: 'Coral', hex: '#FF7F50', textColor: '#FFFFFF' },
  { name: 'Mint', hex: '#98FF98', textColor: '#000000' },
  { name: 'Lavender', hex: '#E6E6FA', textColor: '#000000' },
  { name: 'Gold', hex: '#FFD700', textColor: '#000000' },
  { name: 'Silver', hex: '#C0C0C0', textColor: '#000000' },
  { name: 'Rose Gold', hex: '#B76E79', textColor: '#FFFFFF' },
  { name: 'Charcoal', hex: '#36454F', textColor: '#FFFFFF' },
];

/**
 * Common product option suggestions grouped by category
 * Used for autocomplete dropdown when adding new product options (Size, Color, Material, etc.)
 */
export const ATTRIBUTE_SUGGESTIONS: AttributeSuggestion[] = [
  // Most Common
  { name: 'Size', category: 'Common', icon: '📏' },
  { name: 'Color', category: 'Common', icon: '🎨' },
  { name: 'Material', category: 'Common', icon: '🧵' },

  // Fashion & Apparel
  { name: 'Fit', category: 'Fashion', icon: '👔' },
  { name: 'Pattern', category: 'Fashion', icon: '🔲' },
  { name: 'Style', category: 'Fashion', icon: '✨' },
  { name: 'Fabric', category: 'Fashion', icon: '🧶' },
  { name: 'Cut', category: 'Fashion', icon: '✂️' },

  // Electronics
  { name: 'Storage', category: 'Electronics', icon: '💾' },
  { name: 'Memory', category: 'Electronics', icon: '🧠' },
  { name: 'Capacity', category: 'Electronics', icon: '📦' },
  { name: 'Power', category: 'Electronics', icon: '⚡' },
  { name: 'Voltage', category: 'Electronics', icon: '🔌' },

  // Physical Properties
  { name: 'Weight', category: 'Physical', icon: '⚖️' },
  { name: 'Length', category: 'Physical', icon: '📐' },
  { name: 'Width', category: 'Physical', icon: '↔️' },
  { name: 'Height', category: 'Physical', icon: '↕️' },
  { name: 'Diameter', category: 'Physical', icon: '⭕' },

  // Beauty & Personal Care
  { name: 'Scent', category: 'Beauty', icon: '🌸' },
  { name: 'Flavor', category: 'Food & Beauty', icon: '🍓' },
  { name: 'Fragrance', category: 'Beauty', icon: '💐' },

  // Product Variations
  { name: 'Edition', category: 'Version', icon: '🏷️' },
  { name: 'Version', category: 'Version', icon: '🔢' },
  { name: 'Level', category: 'Grade', icon: '📊' },
  { name: 'Age', category: 'Grade', icon: '👶' },
  { name: 'Difficulty', category: 'Grade', icon: '🎯' },

  // Finish & Texture
  { name: 'Finish', category: 'Surface', icon: '✨' },
  { name: 'Texture', category: 'Surface', icon: '🖐️' },

  // Performance
  { name: 'Speed', category: 'Performance', icon: '⚡' },
  { name: 'Performance', category: 'Performance', icon: '🚀' },
];

/**
 * Category order for displaying product option suggestions
 */
export const SUGGESTION_CATEGORIES = [
  'Common',
  'Fashion',
  'Electronics',
  'Physical',
  'Beauty',
  'Food & Beauty',
  'Version',
  'Grade',
  'Surface',
  'Performance',
] as const;
