'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  FileClock,
  ListOrdered,
  LogOut,
  PackageSearch,
  PencilRuler,
  Settings,
  ShieldCheck,
  Store,
  LayoutDashboard,
} from 'lucide-react';
import { toast } from 'sonner';
import { createLogger } from '@tec-shop/next-logger';
import { useQueryClient } from '@tanstack/react-query';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { Link, usePathname, useRouter } from 'apps/admin-ui/src/i18n/navigation';
import { Logo } from '../../../assets/svgs/logo';
import { Payment } from '../../../assets/svgs/icons/payment-icon';
import { useUIStore } from '../../../store/ui.store';
import { useSidebarStore } from '../../../configs/constants';
import { useTrainRecommendationModel, useAdminPendingCounts } from '../../../hooks/useAdminData';
import useAdmin from '../../../hooks/useAdmin';
import apiClient from '../../../lib/api/client';
import SidebarItem from './SidebarItem';
import SidebarGroup from './SidebarGroup';

const logger = createLogger('admin-ui:sidebar');

const Sidebar = () => {
  const t = useTranslations('Sidebar');
  const collapsed = useUIStore((s) => s.collapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const activeSidebar = useSidebarStore((s) => s.activeSidebar);
  const setActiveSidebar = useSidebarStore((s) => s.setActiveSidebar);

  const pathName = usePathname();
  const router = useRouter();
  const { admin } = useAdmin();
  const trainModel = useTrainRecommendationModel();
  const { data: pendingCounts } = useAdminPendingCounts();
  const queryClient = useQueryClient();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const isActive = (route: string) => activeSidebar === route;
  const iconColor = (route: string) => (isActive(route) ? '#60A5FA' : '#6B7280');

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout', { userType: 'admin' });
      sessionStorage.removeItem('admin');
      queryClient.clear();
      router.push('/');
    } catch (error) {
      logger.error('Logout error:', { error });
      toast.error('Failed to logout');
    }
  };

  return (
    <aside
      className={`
        relative flex flex-col h-screen flex-shrink-0
        bg-[#080E1A] border-r border-slate-800
        transition-[width] duration-300 ease-in-out overflow-hidden
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div
        className={`
          flex items-center h-16 border-b border-slate-800 flex-shrink-0
          ${collapsed ? 'justify-center px-2' : 'px-4 gap-3'}
        `}
      >
        <Link href="/" className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Logo className="w-5 h-5 text-white" />
          </div>
        </Link>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
              {admin?.name ?? 'Admin'}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{admin?.email}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3"
        style={{ scrollbarWidth: 'none' }}
      >
        <SidebarItem
          icon={<LayoutDashboard size={18} color={iconColor('/dashboard')} />}
          title={t('dashboard')}
          isActive={isActive('/dashboard')}
          href="/dashboard"
        />

        <SidebarGroup title={t('mainMenu')}>
          <SidebarItem
            icon={<ListOrdered size={18} color={iconColor('/dashboard/orders')} />}
            title={t('orders')}
            isActive={isActive('/dashboard/orders')}
            href="/dashboard/orders"
            badge={pendingCounts?.failedPayments}
          />
          <SidebarItem
            icon={<Payment size={18} color={iconColor('/dashboard/payment')} />}
            title={t('payments')}
            isActive={isActive('/dashboard/payment')}
            href="/dashboard/payment"
          />
          <SidebarItem
            icon={<PackageSearch size={18} color={iconColor('/dashboard/products')} />}
            title={t('products')}
            isActive={isActive('/dashboard/products')}
            href="/dashboard/products"
          />
          <SidebarItem
            icon={<Payment size={18} color={iconColor('/dashboard/users')} />}
            title={t('users')}
            isActive={isActive('/dashboard/users')}
            href="/dashboard/users"
          />
          <SidebarItem
            icon={<Store size={18} color={iconColor('/dashboard/sellers')} />}
            title={t('sellers')}
            isActive={isActive('/dashboard/sellers')}
            href="/dashboard/sellers"
            badge={pendingCounts?.unverifiedSellers}
          />
        </SidebarGroup>

        <SidebarGroup title={t('controllers')}>
          <SidebarItem
            icon={<FileClock size={18} color={iconColor('/dashboard/loggers')} />}
            title={t('loggers')}
            isActive={isActive('/dashboard/loggers')}
            href="/dashboard/loggers"
          />
          <SidebarItem
            icon={<Settings size={18} color={iconColor('/dashboard/management')} />}
            title={t('management')}
            isActive={isActive('/dashboard/management')}
            href="/dashboard/management"
          />

          <SidebarItem
            icon={<Brain size={18} color={trainModel.isPending ? '#6366f1' : '#6B7280'} />}
            title={trainModel.isPending ? 'Training...' : 'Train AI Model'}
            isActive={false}
            onClick={() => !trainModel.isPending && trainModel.mutate()}
          />
        </SidebarGroup>

        <SidebarGroup title={t('customization')}>
          <SidebarItem
            icon={<PencilRuler size={18} color={iconColor('/dashboard/customization')} />}
            title={t('allCustomization')}
            isActive={isActive('/dashboard/customization')}
            href="/dashboard/customization"
          />
        </SidebarGroup>

        <SidebarGroup title={t('extras')}>
          <SidebarItem
            icon={<ShieldCheck size={18} color={iconColor('/dashboard/settings')} />}
            title="Security"
            isActive={isActive('/dashboard/settings')}
            href="/dashboard/settings"
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
      <div className="flex-shrink-0 p-2 border-t border-slate-800">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center h-8 rounded-sm text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
