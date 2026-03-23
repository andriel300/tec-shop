export const navItems: NavItemsTypes[] = [
  {
    title: 'HOME',
    href: '/',
    translationKey: 'home',
  },
  { title: 'PRODUCTS', href: '/all-products', translationKey: 'products' },
  { title: 'SHOPS', href: '/shops', translationKey: 'shops' },
  { title: 'OFFERS', href: '/offers', translationKey: 'offers' },
  {
    title: 'BECOME A VENDOR',
    href: `${process.env.NEXT_PUBLIC_SELLER_SERVER_URI ?? 'http://localhost:3001'}/become-seller`,
    translationKey: 'becomeASeller',
  },
];
