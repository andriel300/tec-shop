'use client';

import { useQueryClient } from '@tanstack/react-query';
import ProfileIcon from 'apps/user-ui/src/assets/svgs/profile-icon';
import QuickActionCard from 'apps/user-ui/src/components/cards/quick-action.card';
import StatCard from 'apps/user-ui/src/components/cards/stat.card';
import ShippingAddressSection from 'apps/user-ui/src/components/shippingAddress';
import OrdersSection from 'apps/user-ui/src/components/orders';
import { useAuth } from 'apps/user-ui/src/hooks/use-auth';
import { useOrders } from 'apps/user-ui/src/hooks/use-orders';
import apiClient from 'apps/user-ui/src/lib/api/client';
import {
  BadgeCheck,
  Bell,
  CheckCircle,
  Clock,
  Gift,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  PhoneCall,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { userProfile, user, isLoading } = useAuth();
  const { data: orders = [] } = useOrders();
  const queryTab = searchParams.get('active') || searchParams.get('tab') || 'Profile';
  const [activeTab, setActiveTab] = useState(queryTab);

  useEffect(() => {
    if (activeTab !== queryTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('active', activeTab);
      router.replace(`/profile?${newParams.toString()}`);
    }
  }, [activeTab]);

  const logOutHandler = async () => {
    await apiClient.post('auth/logout').then(() => {
      queryClient.invalidateQueries({ queryKey: ['user'] });

      router.push('/login');
    });
  };

  return (
    <div className="bg-gray-50 p-6 pb-14">
      <div className="md:max-w-7xl mx-auto">
        {/* Greeting */}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back,{' '}
            <span className="text-blue-600">
              {isLoading ? (
                <Loader2 className="inline animate-spin w-5 h-5" size={20} />
              ) : (
                user?.name || 'User'
              )}
            </span>{' '}
            👋
          </h1>
        </div>

        {/* Profile Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard title="Total Orders" count={orders.length} Icon={Clock} />
          <StatCard
            title="Processing Orders"
            count={orders.filter((o) => o.status === 'PAID' || o.status === 'SHIPPED').length}
            Icon={Truck}
          />
          <StatCard
            title="Completed Orders"
            count={orders.filter((o) => o.status === 'DELIVERED').length}
            Icon={CheckCircle}
          />
        </div>

        {/* sidebar and content layout */}

        <div className="mt-10 flex flex-col md:flex-row gap-6">
          {/* Left Navigation */}

          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 w-full md:w-1/5">
            <nav className="space-y-2">
              <NavItem
                label="Profile"
                Icon={User}
                active={activeTab === 'Profile'}
                onClick={() => setActiveTab('Profile')}
              />
              <NavItem
                label="My Orders"
                Icon={ShoppingBag}
                active={activeTab === 'My Orders'}
                onClick={() => setActiveTab('My Orders')}
              />
              <NavItem
                label="Inbox"
                Icon={Inbox}
                active={activeTab === 'Inbox'}
                onClick={() => router.push('/inbox')}
              />
              <NavItem
                label="Notifications"
                Icon={Bell}
                active={activeTab === 'Notifications'}
                onClick={() => setActiveTab('Notifications')}
              />
              <NavItem
                label="Shipping Address"
                Icon={MapPin}
                active={activeTab === 'Shipping Address'}
                onClick={() => setActiveTab('Shipping Address')}
              />
              <NavItem
                label="Change Password"
                Icon={Lock}
                active={activeTab === 'Change Password'}
                onClick={() => setActiveTab('Change Password')}
              />
              <NavItem
                label="Logout"
                Icon={LogOut}
                danger
                onClick={logOutHandler}
              />
            </nav>
          </div>

          {/* Main Content */}

          <div className="bg-white p-6 rounded-md shadow-sm border border-gray-100 w-full md:w-[50%]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {activeTab}
            </h2>
            {activeTab === 'Profile' && !isLoading && userProfile && user ? (
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  {userProfile?.picture ? (
                    <Image
                      src={userProfile.picture}
                      alt="Profile picture"
                      width={60}
                      height={60}
                      className="w-16 h-16 rounded-full border border-gray-200"
                    />
                  ) : (
                    <ProfileIcon className="w-16 h-16 text-gray-400" />
                  )}

                  <button className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                    <Pencil className="w-4 h-4" /> Change Photo
                  </button>
                </div>
                <p>
                  <span className="font-semibold">Name: </span> {user.name || 'Not set'}
                </p>
                <p>
                  <span className="font-semibold">Email: </span> {user.email || 'Not set'}
                </p>

                <p>
                  <span className="font-semibold">Joined:</span>{' '}
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
                </p>
              </div>
            ) : activeTab === 'Shipping Address' ? (
              <ShippingAddressSection />
            ) : activeTab === 'My Orders' ? (
              <OrdersSection />
            ) : (
              <p className="text-gray-500 text-sm">Content for {activeTab} coming soon...</p>
            )}
          </div>

          {/* Right Quick Panel */}
          <div className="w-full md:w-1/4 space-y-4">
            <QuickActionCard
              Icon={Gift}
              title="Referral Program"
              description="Invite friends and earn rewards."
            />
            <QuickActionCard
              Icon={BadgeCheck}
              title="Your Badges"
              description="View your earned achievements"
            />
            <QuickActionCard
              Icon={Settings}
              title="Account Settings"
              description="Manage preferences and security."
            />
            <QuickActionCard
              Icon={Receipt}
              title="Billing History"
              description="Check your recent payments."
            />
            <QuickActionCard
              Icon={PhoneCall}
              title="Support Center"
              description="Need help? Contact support"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Page;

const NavItem = ({ label, Icon, active, danger, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
      active
        ? 'bg-blue-100 text-blue-600'
        : danger
        ? 'text-red-500 hover:bg-red-50'
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);
