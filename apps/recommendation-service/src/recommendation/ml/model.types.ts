/**
 * Represents a single user-product interaction used for training/inference.
 */
export interface InteractionFeature {
  userId: string;
  productId: string;
  shopId?: string;
  /** Numeric score derived from action type (e.g. view=1, cart=3, purchase=5) */
  score: number;
  timestamp: Date;
}

/**
 * Mapping of action types to implicit rating scores.
 * Higher score = stronger purchase intent signal.
 */
export const ACTION_SCORES: Record<string, number> = {
  product_view: 1,
  add_to_wishlist: 2,
  add_to_cart: 3,
  purchase: 5,
  remove_from_wishlist: -1,
  remove_from_cart: -1,
};

/**
 * A product recommendation result with confidence score.
 */
export interface RecommendationResult {
  productId: string;
  score: number;
}

/**
 * Training data structure for the collaborative filtering model.
 */
export interface TrainingData {
  userIndices: number[];
  productIndices: number[];
  ratings: number[];
  numUsers: number;
  numProducts: number;
}

/**
 * Lookup maps that translate between string IDs and numeric indices
 * used by the TensorFlow model.
 */
export interface IdMappings {
  userIdToIndex: Map<string, number>;
  indexToUserId: Map<number, string>;
  productIdToIndex: Map<string, number>;
  indexToProductId: Map<number, string>;
}
