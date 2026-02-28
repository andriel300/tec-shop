'use client';

import { usePathname } from '@/i18n/navigation';
import Footer from './footer';

// Pages where footer should be hidden
const HIDDEN_FOOTER_PATHS = ['/inbox'];

const ConditionalFooter = () => {
  const pathname = usePathname();

  // Check if current path should hide the footer
  const shouldHideFooter = HIDDEN_FOOTER_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;
