import useStore from './index';

jest.mock('../actions/track-user', () => ({
  sendKafkaEvent: jest.fn(),
}));

import { sendKafkaEvent } from '../actions/track-user';

const mockSendKafkaEvent = sendKafkaEvent as jest.MockedFunction<typeof sendKafkaEvent>;

type Product = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  shopId: string;
  sellerId: string;
  variantId?: string;
  sku?: string;
  variantAttributes?: Record<string, string>;
  image?: string;
  slug?: string;
  salePrice?: number;
};

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  title: 'Test Product',
  price: 100,
  quantity: 1,
  shopId: 'shop-1',
  sellerId: 'seller-1',
  ...overrides,
});

const user = { id: 'user-1' };
const location = { country: 'US', city: 'New York' };
const device = 'desktop';

beforeEach(() => {
  useStore.setState({ cart: [], wishlist: [] });
  mockSendKafkaEvent.mockClear();
});

// ---------------------------------------------------------------------------
// addToCart
// ---------------------------------------------------------------------------
describe('addToCart', () => {
  it('adds a new product to an empty cart', () => {
    useStore.getState().addToCart(makeProduct());

    const { cart } = useStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ id: 'prod-1', quantity: 1 });
  });

  it('increments quantity when the same simple product is added again', () => {
    const product = makeProduct({ quantity: 1 });
    useStore.getState().addToCart(product);
    useStore.getState().addToCart(product);

    const { cart } = useStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it('treats products with same id but different variantIds as separate entries', () => {
    useStore.getState().addToCart(makeProduct({ id: 'prod-1' }));
    useStore.getState().addToCart(makeProduct({ id: 'prod-1', variantId: 'var-A' }));
    useStore.getState().addToCart(makeProduct({ id: 'prod-1', variantId: 'var-B' }));

    expect(useStore.getState().cart).toHaveLength(3);
  });

  it('increments quantity when the same product+variant is added again', () => {
    const variant = makeProduct({ id: 'prod-1', variantId: 'var-A', quantity: 1 });
    useStore.getState().addToCart(variant);
    useStore.getState().addToCart(variant);

    const { cart } = useStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it('does not merge a simple product with a variant of the same id', () => {
    useStore.getState().addToCart(makeProduct({ id: 'prod-1' }));
    useStore.getState().addToCart(makeProduct({ id: 'prod-1', variantId: 'var-A' }));

    expect(useStore.getState().cart).toHaveLength(2);
  });

  it('fires sendKafkaEvent when user, location, and device are all provided', () => {
    useStore.getState().addToCart(makeProduct(), user, location, device);

    expect(mockSendKafkaEvent).toHaveBeenCalledTimes(1);
    expect(mockSendKafkaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        productId: 'prod-1',
        shopId: 'shop-1',
        action: 'add_to_cart',
        country: 'US',
        city: 'New York',
        device: 'desktop',
      })
    );
  });

  it('does not fire sendKafkaEvent when user is missing', () => {
    useStore.getState().addToCart(makeProduct(), undefined, location, device);
    expect(mockSendKafkaEvent).not.toHaveBeenCalled();
  });

  it('does not fire sendKafkaEvent when location is missing', () => {
    useStore.getState().addToCart(makeProduct(), user, undefined, device);
    expect(mockSendKafkaEvent).not.toHaveBeenCalled();
  });

  it('does not fire sendKafkaEvent when deviceInfo is missing', () => {
    useStore.getState().addToCart(makeProduct(), user, location, undefined);
    expect(mockSendKafkaEvent).not.toHaveBeenCalled();
  });

  it('uses "Unknown" fallbacks when location fields are empty strings', () => {
    useStore.getState().addToCart(makeProduct(), user, {}, device);

    expect(mockSendKafkaEvent).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'Unknown', city: 'Unknown' })
    );
  });
});

// ---------------------------------------------------------------------------
// removeFromCart
// ---------------------------------------------------------------------------
describe('removeFromCart', () => {
  it('decrements quantity when quantity is greater than 1', () => {
    useStore.setState({ cart: [makeProduct({ quantity: 3 })], wishlist: [] });
    useStore.getState().removeFromCart('prod-1');

    const { cart } = useStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it('removes the item entirely when quantity is 1', () => {
    useStore.setState({ cart: [makeProduct({ quantity: 1 })], wishlist: [] });
    useStore.getState().removeFromCart('prod-1');

    expect(useStore.getState().cart).toHaveLength(0);
  });

  it('does not change state when removing a non-existent id', () => {
    useStore.setState({ cart: [makeProduct()], wishlist: [] });
    useStore.getState().removeFromCart('does-not-exist');

    expect(useStore.getState().cart).toHaveLength(1);
  });

  it('fires sendKafkaEvent with remove_from_cart action', () => {
    useStore.setState({ cart: [makeProduct({ quantity: 1 })], wishlist: [] });
    useStore.getState().removeFromCart('prod-1', user, location, device);

    expect(mockSendKafkaEvent).toHaveBeenCalledTimes(1);
    expect(mockSendKafkaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        productId: 'prod-1',
        action: 'remove_from_cart',
      })
    );
  });

  it('does not fire sendKafkaEvent when user is missing', () => {
    useStore.setState({ cart: [makeProduct({ quantity: 1 })], wishlist: [] });
    useStore.getState().removeFromCart('prod-1', undefined, location, device);

    expect(mockSendKafkaEvent).not.toHaveBeenCalled();
  });

  it('does not fire sendKafkaEvent when item does not exist in cart', () => {
    useStore.getState().removeFromCart('non-existent', user, location, device);

    expect(mockSendKafkaEvent).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// addToWishList
// ---------------------------------------------------------------------------
describe('addToWishList', () => {
  it('adds a product to an empty wishlist', () => {
    useStore.getState().addToWishList(makeProduct());

    expect(useStore.getState().wishlist).toHaveLength(1);
  });

  it('does not add a duplicate (idempotent)', () => {
    const product = makeProduct();
    useStore.getState().addToWishList(product);
    useStore.getState().addToWishList(product);

    expect(useStore.getState().wishlist).toHaveLength(1);
  });

  it('allows products with different ids', () => {
    useStore.getState().addToWishList(makeProduct({ id: 'prod-1' }));
    useStore.getState().addToWishList(makeProduct({ id: 'prod-2' }));

    expect(useStore.getState().wishlist).toHaveLength(2);
  });

  it('fires sendKafkaEvent when user, location, and device are all provided', () => {
    useStore.getState().addToWishList(makeProduct(), user, location, device);

    expect(mockSendKafkaEvent).toHaveBeenCalledTimes(1);
    expect(mockSendKafkaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        productId: 'prod-1',
        action: 'add_to_wishlist',
      })
    );
  });

  it('fires sendKafkaEvent even when product is already in wishlist', () => {
    // Event fires regardless of duplicate check — state is not updated but event is
    const product = makeProduct();
    useStore.getState().addToWishList(product, user, location, device);
    mockSendKafkaEvent.mockClear();

    useStore.getState().addToWishList(product, user, location, device);

    expect(mockSendKafkaEvent).toHaveBeenCalledTimes(1);
    expect(useStore.getState().wishlist).toHaveLength(1); // still no duplicate
  });

  it('does not fire sendKafkaEvent when location is missing', () => {
    useStore.getState().addToWishList(makeProduct(), user, undefined, device);
    expect(mockSendKafkaEvent).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// removeFromWishList
// ---------------------------------------------------------------------------
describe('removeFromWishList', () => {
  it('removes the product from the wishlist', () => {
    useStore.setState({ cart: [], wishlist: [makeProduct()] });
    useStore.getState().removeFromWishList('prod-1');

    expect(useStore.getState().wishlist).toHaveLength(0);
  });

  it('is a no-op when the product is not in the wishlist', () => {
    useStore.setState({ cart: [], wishlist: [makeProduct({ id: 'prod-2' })] });
    useStore.getState().removeFromWishList('prod-1');

    expect(useStore.getState().wishlist).toHaveLength(1);
  });

  it('does not remove other products', () => {
    useStore.setState({
      cart: [],
      wishlist: [makeProduct({ id: 'prod-1' }), makeProduct({ id: 'prod-2' })],
    });
    useStore.getState().removeFromWishList('prod-1');

    const { wishlist } = useStore.getState();
    expect(wishlist).toHaveLength(1);
    expect(wishlist[0].id).toBe('prod-2');
  });

  it('fires sendKafkaEvent with remove_from_wishlist action', () => {
    useStore.setState({ cart: [], wishlist: [makeProduct()] });
    useStore.getState().removeFromWishList('prod-1', user, location, device);

    expect(mockSendKafkaEvent).toHaveBeenCalledTimes(1);
    expect(mockSendKafkaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        productId: 'prod-1',
        action: 'remove_from_wishlist',
      })
    );
  });

  it('does not fire sendKafkaEvent when product was not in wishlist', () => {
    useStore.getState().removeFromWishList('non-existent', user, location, device);
    expect(mockSendKafkaEvent).not.toHaveBeenCalled();
  });

  it('does not fire sendKafkaEvent when user is missing', () => {
    useStore.setState({ cart: [], wishlist: [makeProduct()] });
    useStore.getState().removeFromWishList('prod-1', undefined, location, device);
    expect(mockSendKafkaEvent).not.toHaveBeenCalled();
  });
});
