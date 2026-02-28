/* eslint-disable @nx/enforce-module-boundaries */
'use client';
import useSidebar from '../../../hooks/useSidebar';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import useAdmin from '../../../hooks/useAdmin';
import Box from '../box';
import { Sidebar } from './sidebar.styles';
import { Link } from '@/i18n/navigation';
import { Logo } from '../../../assets/svgs/logo';
import SidebarItem from './sidebar.item';
import Home from '../../../assets/svgs/icons/home-icon';
import SidebarMenu from './sidebar.menu';
import {
  BellPlus,
  BellRing,
  FileClock,
  ListOrdered,
  LogOut,
  PackageSearch,
  PencilRuler,
  Settings,
  Store,
} from 'lucide-react';
import { Payment } from '../../../assets/svgs/icons/payment-icon';
import { NotificationBell } from '../notification-bell';
import LanguageSwitcher from '../language-switcher';

const SidebarWrapper = () => {
  const t = useTranslations('Sidebar');
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { admin } = useAdmin();

  const getIconColor = (route: string) =>
    activeSidebar === route ? '#0085ff' : '#969696';

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  return (
    <Box
      $css={{
        height: '100vh',
        zIndex: 202,
        position: 'sticky',
        padding: '8px',
        top: 0,
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
                <h3 className="text-xl font-medium text-[#ecedee]">
                  {admin?.name}
                </h3>
                <h5 className="font-medium pl-2 text-xs text-[#ecedeecf] whitespace-none">
                  {admin?.email}
                </h5>
              </Box>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell />
            </div>
          </div>
        </Box>
      </Sidebar.Header>

      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItem
            title={t('dashboard')}
            icon={<Home fill={getIconColor('dashboard')} />}
            isActive={activeSidebar === '/dashboard'}
            href="/dashboard"
          >
            <div className="mt-2 block">
              <SidebarMenu title={t('mainMenu')}>
                <SidebarItem
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

                <SidebarItem
                  isActive={activeSidebar === '/dashboard/payment'}
                  title={t('payments')}
                  href="/dashboard/payment"
                  icon={<Payment fill={getIconColor('/dashboard/payment')} />}
                />

                <SidebarItem
                  isActive={activeSidebar === '/dashboard/products'}
                  title={t('products')}
                  href="/dashboard/products"
                  icon={
                    <PackageSearch
                      size={22}
                      color={getIconColor('/dashboard/products')}
                    />
                  }
                />
                <SidebarItem
                  isActive={activeSidebar === '/dashboard/events'}
                  title={t('events')}
                  href="/dashboard/events"
                  icon={
                    <BellPlus
                      size={24}
                      color={getIconColor('/dashboard/events')}
                    />
                  }
                />

                <SidebarItem
                  isActive={activeSidebar === '/dashboard/users'}
                  title={t('users')}
                  href="/dashboard/users"
                  icon={<Payment fill={getIconColor('/dashboard/users')} />}
                />

                <SidebarItem
                  isActive={activeSidebar === '/dashboard/sellers'}
                  title={t('sellers')}
                  href="/dashboard/sellers"
                  icon={
                    <Store
                      size={22}
                      color={getIconColor('/dashboard/sellers')}
                    />
                  }
                />
              </SidebarMenu>

              {/* Controllers */}

              <SidebarMenu title={t('controllers')}>
                <SidebarItem
                  isActive={activeSidebar === '/dashboard/loggers'}
                  title={t('loggers')}
                  href="/dashboard/loggers"
                  icon={
                    <FileClock
                      size={22}
                      color={getIconColor('/dashboard/loggers')}
                    />
                  }
                />

                <SidebarItem
                  isActive={activeSidebar === '/dashboard/management'}
                  title={t('management')}
                  href="/dashboard/management"
                  icon={
                    <Settings
                      size={22}
                      color={getIconColor('/dashboard/management')}
                    />
                  }
                />

                <SidebarItem
                  isActive={activeSidebar === '/dashboard/notifications'}
                  title={t('notifications')}
                  href="/dashboard/notifications"
                  icon={
                    <BellRing
                      size={22}
                      color={getIconColor('/dashboard/notifications')}
                    />
                  }
                />
              </SidebarMenu>
              <SidebarMenu title={t('customization')}>
                <SidebarItem
                  isActive={activeSidebar === '/dashboard/customization'}
                  title={t('allCustomization')}
                  href="/dashboard/customization"
                  icon={
                    <PencilRuler
                      size={22}
                      color={getIconColor('/dashboard/customization')}
                    />
                  }
                />
              </SidebarMenu>

              <SidebarMenu title={t('extras')}>
                <SidebarItem
                  isActive={activeSidebar === '/logout'}
                  title={t('logout')}
                  href="/"
                  icon={<LogOut size={20} color={getIconColor('/logout')} />}
                />
              </SidebarMenu>
            </div>
          </SidebarItem>
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SidebarWrapper;
