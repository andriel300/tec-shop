'use client';

import { useRef, useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { Link } from '../../i18n/navigation';
import useStore from '../../store';
import CartIcon from '../../assets/svgs/cart-icon';

export function CartDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cart = useStore((state) => state.cart);
  const removeFromCart = useStore((state) => state.removeFromCart);

  const total = cart.reduce(
    (sum, item) => sum + (item.salePrice || item.price) * item.quantity,
    0
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-ui-muted rounded-full transition-colors"
        title="Cart"
      >
        <CartIcon className="w-7 h-7 text-text-primary" />
        {cart.length > 0 && (
          <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-5px] right-[-5px]">
            <span className="text-white font-medium text-sm">
              {cart.length > 99 ? '99+' : cart.length}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-ui-surface border border-ui-divider rounded-[10px] shadow-elev-lg z-50 max-h-[460px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-ui-divider">
            <ShoppingCart size={14} className="text-text-secondary" />
            <h3 className="text-text-primary font-semibold text-sm">Cart</h3>
            <span className="ml-auto text-xs text-text-muted">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Items */}
          <div className="overflow-y-auto flex-1">
            {cart.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-secondary text-sm">
                Your cart is empty
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.id}-${item.variantId ?? ''}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-ui-divider last:border-b-0 hover:bg-ui-muted transition-colors"
                >
                  <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {item.image ? (
                      <Image
                        src={item.image as string}
                        alt={item.title}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-ui-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/productview/${item.slug || item.id}`}
                      onClick={() => setIsOpen(false)}
                      className="block text-sm text-text-primary font-medium truncate hover:text-brand-primary transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-text-secondary mt-0.5">
                      ${(item.salePrice || item.price).toFixed(2)} &times; {item.quantity}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-semibold text-brand-secondary">
                      ${((item.salePrice || item.price) * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="mt-1 p-0.5 text-text-muted hover:text-red-500 transition-colors rounded"
                      title="Remove"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total + CTA */}
          {cart.length > 0 && (
            <div className="border-t border-ui-divider px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-text-secondary font-medium">Total</span>
              <span className="text-base font-bold text-text-primary">
                ${total.toFixed(2)}
              </span>
            </div>
          )}
          <Link
            href="/cart"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-center text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-800 transition-colors"
          >
            View Cart
          </Link>
        </div>
      )}
    </div>
  );
}
