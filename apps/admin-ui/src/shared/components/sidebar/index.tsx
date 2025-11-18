/* eslint-disable @nx/enforce-module-boundaries */
'use client';
import useSidebar from 'apps/admin-ui/src/hooks/useSidebar';
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useAdmin from 'apps/admin-ui/src/hooks/useAdmin';
import Box from '../box';
import { Sidebar } from './sidebar.styles';
import Link from 'next/link';
import { Logo } from 'apps/admin-ui/src/assets/svgs/logo';
import SidebarItem from './sidebar.item';
import Home from 'apps/admin-ui/src/assets/svgs/icons/home-icon';
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
import { Payment } from 'apps/admin-ui/src/assets/svgs/icons/payment-icon';

const SidebarWrapper = () => {
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
        </Box>
      </Sidebar.Header>

      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItem
            title="Dashboard"
            icon={<Home fill={getIconColor('dashboard')} />}
            isActive={activeSidebar === '/dashboard'}
            href="/dashboard"
          >
            <div className="mt-2 block">
              <SidebarMenu title="Main Menu">
                <SidebarItem
                  isActive={activeSidebar === '/dashboard/orders'}
                  title="Orders"
                  href="/dashboard/orders"
                  icon={
                    <ListOrdered
                      size={26}
                      color={getIconColor('/dashboard/orders')}
                    />
                  }
                />

                <SidebarItem
                  isActive={activeSidebar === '/dashboard/payments'}
                  title="Payments"
                  href="/dashboard/payments"
                  icon={<Payment fill={getIconColor('/dashboard/payments')} />}
                />

                <SidebarItem
                  isActive={activeSidebar === '/dashboard/products'}
                  title="Products"
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
                  title="Events"
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
                  title="Users"
                  href="/dashboard/users"
                  icon={<Payment fill={getIconColor('/dashboard/users')} />}
                />

                <SidebarItem
                  isActive={activeSidebar === '/dashboard/sellers'}
                  title="Sellers"
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

              <SidebarMenu title="Controllers">
                <SidebarItem
                  isActive={activeSidebar === '/dashboard/loggers'}
                  title="Loggers"
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
                  title="Management"
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
                  title="Notifications"
                  href="/dashboard/notifications"
                  icon={
                    <BellRing
                      size={22}
                      color={getIconColor('/dashboard/notifications')}
                    />
                  }
                />
              </SidebarMenu>
              <SidebarMenu title="Customization">
                <SidebarItem
                  isActive={activeSidebar === '/dashboard/customization'}
                  title="All Customization"
                  href="/dashboard/customization"
                  icon={
                    <PencilRuler
                      size={22}
                      color={getIconColor('/dashboard/customization')}
                    />
                  }
                />
              </SidebarMenu>

              <SidebarMenu title="Extras">
                <SidebarItem
                  isActive={activeSidebar === '/logout'}
                  title="Logout"
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
