export const navItems: NavItemsTypes[] = [
  {
    title: 'Home',
    href: '/',
    translationKey: 'home',
  },
  { title: 'Products', href: '/all-products', translationKey: 'products' },
  { title: 'Shops', href: '/shops', translationKey: 'shops' },
  { title: 'Offers', href: '/offers', translationKey: 'offers' },
  {
    title: 'Become A Seller',
    href: `${process.env.NEXT_PUBLIC_SELLER_SERVER_URI ?? 'http://localhost:3001'}/become-seller`,
    translationKey: 'becomeASeller',
  },
];
