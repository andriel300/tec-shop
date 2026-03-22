'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  BellPlus,
  BellRing,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Mail,
  PackageSearch,
  Settings,
  SquarePlus,
  TicketPercent,
  Trash2,
} from 'lucide-react';
import { createLogger } from '@tec-shop/next-logger';
import { toast } from 'sonner';

import { Link, usePathname, useRouter } from '../../i18n/navigation';
import { Logo } from '../../assets/svgs/logo';
import { Payment } from '../../assets/svgs/icons/payment-icon';
import { useUIStore } from '../../store/ui.store';
import { useSidebarStore } from '../../configs/constants';
import { useDeletedProducts } from '../../hooks/useProducts';
import { useAuth } from '../../contexts/auth-context';
import useSeller from '../../hooks/useSeller';
import SidebarItem from './SidebarItem';
import SidebarGroup from './SidebarGroup';

const logger = createLogger('seller-ui:sidebar');

const Sidebar = () => {
  const t = useTranslations('Sidebar');
  const tCommon = useTranslations('Common');

  const collapsed = useUIStore((s) => s.collapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const activeSidebar = useSidebarStore((s) => s.activeSidebar);
  const setActiveSidebar = useSidebarStore((s) => s.setActiveSidebar);

  const pathName = usePathname();
  const router = useRouter();
  const { seller } = useSeller();
  const { data: deletedProducts } = useDeletedProducts();
  const { logout } = useAuth();

  const deletedCount = deletedProducts?.length ?? 0;
  const displayName =
    seller?.shop?.businessName || seller?.name || 'TecShop Seller';

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const isActive = (route: string) => activeSidebar === route;

  const iconColor = (route: string) =>
    isActive(route) ? '#60A5FA' : '#6B7280';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(tCommon('loggedOut'));
      router.push('/login');
    } catch (error) {
      logger.error('Logout error:', { error });
      toast.error(tCommon('logoutFailed'));
    }
  };

  return (
    <aside
      className={`
        relative flex flex-col h-screen flex-shrink-0
        bg-white dark:bg-[#080E1A] border-r border-gray-200 dark:border-slate-800
        transition-[width] duration-300 ease-in-out overflow-hidden
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div
        className={`
          flex items-center h-16 border-b border-gray-200 dark:border-slate-800 flex-shrink-0
          ${collapsed ? 'justify-center px-2' : 'px-4 gap-3'}
        `}
      >
        <Link href="/" className="flex-shrink-0 dark:text-slate-400 text-slate-900">
          <Logo className="w-8 h-8" />
        </Link>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate leading-tight">
              {displayName}
            </p>
            {seller?.shop?.address && (
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">
                {seller.shop.address}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3"
        style={{ scrollbarWidth: 'none' }}
      >
        <SidebarItem
          icon={
            <LayoutDashboard size={18} color={iconColor('/dashboard')} />
          }
          title={t('dashboard')}
          isActive={isActive('/dashboard')}
          href="/dashboard"
        />

        <SidebarGroup title={t('mainMenu')}>
          <SidebarItem
            icon={
              <ListOrdered
                size={18}
                color={iconColor('/dashboard/orders')}
              />
            }
            title={t('orders')}
            isActive={isActive('/dashboard/orders')}
            href="/dashboard/orders"
          />
          <SidebarItem
            icon={
              <Payment size={18} color={iconColor('/dashboard/payments')} />
            }
            title={t('payments')}
            isActive={isActive('/dashboard/payments')}
            href="/dashboard/payments"
          />
        </SidebarGroup>

        <SidebarGroup title={t('products')}>
          <SidebarItem
            icon={
              <SquarePlus
                size={18}
                color={iconColor('/dashboard/create-product')}
              />
            }
            title={t('createProduct')}
            isActive={isActive('/dashboard/create-product')}
            href="/dashboard/create-product"
          />
          <SidebarItem
            icon={
              <PackageSearch
                size={18}
                color={iconColor('/dashboard/all-products')}
              />
            }
            title={t('allProducts')}
            isActive={isActive('/dashboard/all-products')}
            href="/dashboard/all-products"
          />
          <SidebarItem
            icon={
              <Trash2 size={18} color={iconColor('/dashboard/trash')} />
            }
            title={t('trash')}
            isActive={isActive('/dashboard/trash')}
            href="/dashboard/trash"
            badge={deletedCount}
          />
        </SidebarGroup>

        <SidebarGroup title={t('events')}>
          <SidebarItem
            icon={
              <CalendarPlus
                size={18}
                color={iconColor('/dashboard/create-event')}
              />
            }
            title={t('createEvent')}
            isActive={isActive('/dashboard/create-event')}
            href="/dashboard/create-event"
          />
          <SidebarItem
            icon={
              <BellPlus size={18} color={iconColor('/dashboard/events')} />
            }
            title={t('allEvents')}
            isActive={isActive('/dashboard/events')}
            href="/dashboard/events"
          />
        </SidebarGroup>

        <SidebarGroup title={t('controllers')}>
          <SidebarItem
            icon={
              <Mail size={18} color={iconColor('/dashboard/inbox')} />
            }
            title={t('inbox')}
            isActive={isActive('/dashboard/inbox')}
            href="/dashboard/inbox"
          />
          <SidebarItem
            icon={
              <Settings
                size={18}
                color={iconColor('/dashboard/settings')}
              />
            }
            title={t('settings')}
            isActive={isActive('/dashboard/settings')}
            href="/dashboard/settings"
          />
          <SidebarItem
            icon={
              <BellRing
                size={18}
                color={iconColor('/dashboard/notifications')}
              />
            }
            title={t('notifications')}
            isActive={isActive('/dashboard/notifications')}
            href="/dashboard/notifications"
          />
        </SidebarGroup>

        <SidebarGroup title={t('extras')}>
          <SidebarItem
            icon={
              <TicketPercent
                size={18}
                color={iconColor('/dashboard/discount-codes')}
              />
            }
            title={t('discountCodes')}
            isActive={isActive('/dashboard/discount-codes')}
            href="/dashboard/discount-codes"
          />
          <SidebarItem
            icon={<LogOut size={18} color="#6B7280" />}
            title={t('logout')}
            isActive={false}
            onClick={handleLogout}
          />
        </SidebarGroup>
      </nav>

      {/* Collapse toggle */}
      <div className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-slate-800">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center h-8 rounded-sm text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
