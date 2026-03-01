'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import useSidebar from '../../hooks/useSidebar';
import { usePathname, useRouter } from '@/i18n/navigation';
import useSeller from '../../hooks/useSeller';
import Box from '../box';
import { Sidebar } from './sidebar.styles';
import { Link } from '@/i18n/navigation';
import { Logo } from '../../assets/svgs/logo';
import SidebarItems from './sidebar.item';
import Home from '../../assets/svgs/icons/home-icon';
import SidebarMenu from './sidebar.menu';
import {
  BellPlus,
  BellRing,
  CalendarPlus,
  ListOrdered,
  LogOut,
  Mail,
  PackageSearch,
  Settings,
  SquarePlus,
  TicketPercent,
  Trash2,
} from 'lucide-react';
import { Payment } from '../../assets/svgs/icons/payment-icon';
import { useDeletedProducts } from '../../hooks/useProducts';
import { useAuth } from '../../contexts/auth-context';
import { toast } from 'sonner';
import { NotificationBellV2 } from '../notification-bell-v2';
import LanguageSwitcher from '../language-switcher';

const SidebarBarWrapper = () => {
  const t = useTranslations('Sidebar');
  const tCommon = useTranslations('Common');
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const router = useRouter();
  const { seller, isLoading, isError } = useSeller();
  const { data: deletedProducts } = useDeletedProducts();
  const { logout } = useAuth();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const getIconColor = (route: string) =>
    activeSidebar === route ? '#0085ff' : '#969696';

  // Display shop name or seller name, with fallback
  const displayName =
    seller?.shop?.businessName || seller?.name || 'TecShop Seller';

  // Get count of deleted products for badge
  const deletedCount = deletedProducts?.length || 0;

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success(tCommon('loggedOut'));
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(tCommon('logoutFailed'));
    }
  };

  return (
    <Box
      $css={{
        height: '100vh',
        zIndex: 202,
        position: 'sticky',
        padding: '8px',
        top: '0',
        overflowY: 'scroll',
        scrollbarWidth: 'none',
      }}
      className="sidebar-wrapper"
    >
      <Sidebar.Header>
        <Box>
          <div className="flex items-center justify-between">
            <Link href={'/'} className="flex justify-center text-center gap-2">
              <Logo />
              <Box>
                {isLoading ? (
                  <div className="text-xl font-medium text-[#ecedee] animate-pulse">
                    {tCommon('loading')}
                  </div>
                ) : isError ? (
                  <div className="text-xl font-medium text-red-400">{tCommon('error')}</div>
                ) : (
                  <h3 className="text-xl font-medium text-[#ecedee]">
                    {displayName}
                  </h3>
                )}
                <h5 className="font-medium pl-2 text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]">
                  {seller?.shop?.address}
                </h5>
              </Box>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBellV2 />
            </div>
          </div>
        </Box>
      </Sidebar.Header>
      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItems
            title={t('dashboard')}
            icon={
              <Home className="w-8 h-8" fill={getIconColor('/dashboard')} />
            }
            isActive={activeSidebar === '/dashboard'}
            href="/dashboard"
          />
          <div className="mt-2 block">
            <SidebarMenu title={t('mainMenu')}>
              <SidebarItems
                isActive={activeSidebar === '/dashboard/orders'}
                title={t('orders')}
                href="/dashboard/orders"
                icon={
                  <ListOrdered
                    size={26}
                    color={getIconColor('/dashboard/orders')}
                  />
                }
              />
              <SidebarItems
                isActive={activeSidebar === '/dashboard/payments'}
                title={t('payments')}
                href="/dashboard/payments"
                icon={
                  <Payment
                    size={26}
                    color={getIconColor('/dashboard/payments')}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title={t('products')}>
              <SidebarItems
                isActive={activeSidebar === '/dashboard/create-product'}
                title={t('createProduct')}
                href="/dashboard/create-product"
                icon={
                  <SquarePlus
                    size={26}
                    color={getIconColor('/dashboard/create-product')}
                  />
                }
              />
              <SidebarItems
                isActive={activeSidebar === '/dashboard/all-products'}
                title={t('allProducts')}
                href="/dashboard/all-products"
                icon={
                  <PackageSearch
                    size={22}
                    color={getIconColor('/dashboard/all-products')}
                  />
                }
              />
              <SidebarItems
                isActive={activeSidebar === '/dashboard/trash'}
                title={t('trash')}
                href="/dashboard/trash"
                icon={
                  <Trash2 size={22} color={getIconColor('/dashboard/trash')} />
                }
                badge={deletedCount}
              />
            </SidebarMenu>
            <SidebarMenu title={t('events')}>
              <SidebarItems
                isActive={activeSidebar === '/dashboard/create-event'}
                title={t('createEvent')}
                href="/dashboard/create-event"
                icon={
                  <CalendarPlus
                    size={24}
                    color={getIconColor('/dashboard/create-event')}
                  />
                }
              />
              <SidebarItems
                isActive={activeSidebar === '/dashboard/events'}
                title={t('allEvents')}
                href="/dashboard/events"
                icon={
                  <BellPlus
                    size={24}
                    color={getIconColor('/dashboard/events')}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title={t('controllers')}>
              <SidebarItems
                isActive={activeSidebar === '/dashboard/inbox'}
                title={t('inbox')}
                href="/dashboard/inbox"
                icon={
                  <Mail size={20} color={getIconColor('/dashboard/inbox')} />
                }
              />
              <SidebarItems
                isActive={activeSidebar === '/dashboard/settings'}
                title={t('settings')}
                href="/dashboard/settings"
                icon={
                  <Settings
                    size={22}
                    color={getIconColor('/dashboard/settings')}
                  />
                }
              />
              <SidebarItems
                isActive={activeSidebar === '/dashboard/notifications'}
                title={t('notifications')}
                href="/dashboard/notifications"
                icon={
                  <BellRing
                    size={24}
                    color={getIconColor('/dashboard/notifications')}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title={t('extras')}>
              <SidebarItems
                isActive={activeSidebar === '/dashboard/discount-codes'}
                title={t('discountCodes')}
                href="/dashboard/discount-codes"
                icon={
                  <TicketPercent
                    size={22}
                    color={getIconColor('/dashboard/discount-codes')}
                  />
                }
              />
              <SidebarItems
                isActive={false}
                title={t('logout')}
                onClick={handleLogout}
                icon={<LogOut size={20} color="#969696" />}
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SidebarBarWrapper;
