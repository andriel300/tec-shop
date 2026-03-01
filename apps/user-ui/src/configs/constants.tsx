export const navItems: NavItemsTypes[] = [
  {
    title: 'Home',
    href: '/',
    translationKey: 'home',
  },
  { title: 'Products', href: '/products', translationKey: 'products' },
  { title: 'Shops', href: '/shops', translationKey: 'shops' },
  { title: 'Offers', href: '/offers', translationKey: 'offers' },
  {
    title: 'Become A Seller',
    href: `${process.env.NEXT_PUBLIC_SELLER_SERVER_URI}/signup`,
    translationKey: 'becomeASeller',
  },
  { title: 'Terms of Service', href: '/terms-of-service', translationKey: 'termsOfService' },
];
