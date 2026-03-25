/* eslint-disable @nx/enforce-module-boundaries */
'use client';
import useSidebar from '../../../hooks/useSidebar';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import useAdmin from '../../../hooks/useAdmin';
import Box from '../box';
import { Sidebar } from './sidebar.styles';
import { Logo } from '../../../assets/svgs/logo';
import SidebarItem from './sidebar.item';
import Home from '../../../assets/svgs/icons/home-icon';
import SidebarMenu from './sidebar.menu';
import {
  BellRing,
  Brain,
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
import { Link, usePathname } from 'apps/admin-ui/src/i18n/navigation';
import { useTrainRecommendationModel } from '../../../hooks/useAdminData';

const SidebarWrapper = () => {
  const t = useTranslations('Sidebar');
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { admin } = useAdmin();
  const trainModel = useTrainRecommendationModel();

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
        overflowY: 'hidden',
      }}
      className="sidebar-wrapper"
    >
      <Sidebar.Header>
        <Box>
          <div className="flex items-center justify-between mb-2">
            <Link href={'/'} className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Logo className="w-4 h-4 text-white" />
              </div>
              <Box className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-200 truncate leading-tight">
                  {admin?.name}
                </h3>
                <h5 className="text-xs text-slate-500 truncate leading-tight">
                  {admin?.email}
                </h5>
              </Box>
            </Link>
            <NotificationBell />
          </div>
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>
        </Box>
      </Sidebar.Header>

      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItem
            title={t('dashboard')}
            icon={<Home className="w-5 h-5" fill={getIconColor('dashboard')} />}
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

                <SidebarItem
                  isActive={false}
                  title={trainModel.isPending ? 'Training...' : 'Train AI Model'}
                  onClick={() => !trainModel.isPending && trainModel.mutate()}
                  icon={
                    <Brain
                      size={22}
                      color={trainModel.isPending ? '#6366f1' : '#969696'}
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
