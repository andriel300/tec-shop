'use client';

import { Link } from '../../i18n/navigation';
import Image from 'next/image';
import { Product, Shop } from './SearchBar';

interface Props {
  show: boolean;
  query: string;
  results: {
    products: Product[];
    shops: Shop[];
  };
  isSearching: boolean;
  close: () => void;
  clear: () => void;
}

const SearchDropdown = ({
  show,
  query,
  results,
  isSearching,
  close,
  clear,
}: Props) => {
  if (!show) return null;

  const hasResults = results.products.length > 0 || results.shops.length > 0;

  return (
    <div className="absolute top-full left-0 w-full bg-ui-surface border-2 border-t-0 border-brand-primary rounded-b-md shadow-elev-lg z-50 max-h-[500px] overflow-y-auto">
      {isSearching && (
        <div className="p-4 text-center text-text-secondary">Searching...</div>
      )}

      {!isSearching && !hasResults && (
        <div className="p-4 text-sm text-gray-500">
          No results found for "{query}"
        </div>
      )}

      {/* Products */}
      {results.products.length > 0 && (
        <div className="border-b border-ui-divider">
          <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
            Products
          </div>

          {results.products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              onClick={() => {
                close();
                clear();
              }}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100"
            >
              <div className="relative w-12 h-12">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-contain rounded"
                  sizes="48px"
                />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-1">
                  {product.name}
                </p>
                <p className="text-sm text-brand-primary font-semibold">
                  R$ {product.price.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Shops */}
      {results.shops.length > 0 && (
        <div>
          <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
            Shops
          </div>

          {results.shops.map((shop) => (
            <Link
              key={shop.id}
              href={`/shop/${shop.id}`}
              onClick={() => {
                close();
                clear();
              }}
              className="block px-4 py-2 hover:bg-gray-100"
            >
              <p className="text-sm font-medium">{shop.businessName}</p>
              <p className="text-xs text-gray-500">{shop.category}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
