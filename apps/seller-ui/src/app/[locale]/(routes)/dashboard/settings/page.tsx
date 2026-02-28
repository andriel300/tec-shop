'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  UserCircle,
  Lock,
  Eye,
  Share2,
  FileText,
  BellRing,
  Loader2,
  Plus,
  Trash2,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import useSeller from '../../../../../hooks/useSeller';
import { useAuth } from '../../../../../contexts/auth-context';
import {
  updateSellerProfile,
  updateShop,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../../../../lib/api/seller';
import type {
  SocialLink,
  NotificationPreferences,
  ChangePasswordData,
} from '../../../../../lib/api/seller';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useRouter } from 'apps/seller-ui/src/i18n/navigation';

// Tab definitions

const TABS = [
  { id: 'account', label: 'Account Info', icon: UserCircle },
  { id: 'security', label: 'Password & Security', icon: Lock },
  { id: 'visibility', label: 'Shop Visibility', icon: Eye },
  { id: 'social', label: 'Social Links', icon: Share2 },
  { id: 'policies', label: 'Shop Policies', icon: FileText },
  { id: 'notifications', label: 'Notifications', icon: BellRing },
] as const;

type TabId = (typeof TABS)[number]['id'];

const SOCIAL_PLATFORMS = [
  'Instagram',
  'Facebook',
  'Twitter/X',
  'YouTube',
  'TikTok',
  'LinkedIn',
  'Pinterest',
];

// Main Settings Page

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('account');

  return (
    <div className="min-h-screen p-4 md:p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="md:w-56 shrink-0">
          {/* Mobile: horizontal scrollable */}
          <div className="flex md:hidden gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Desktop: vertical tabs */}
          <nav className="hidden md:flex flex-col gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeTab === tab.id
                      ? ' text-blue-500 border border-blue-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-ui-background-dark border border-slate-700 rounded-xl p-6">
            {activeTab === 'account' && <AccountInfoTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'visibility' && <VisibilityTab />}
            {activeTab === 'social' && <SocialLinksTab />}
            {activeTab === 'policies' && <PoliciesTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab 1: Account Info

function AccountInfoTab() {
  const { seller, isLoading: sellerLoading } = useSeller();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
  });

  useEffect(() => {
    if (seller) {
      setFormData({
        name: seller.name || '',
        email: seller.email || '',
        phoneNumber: seller.phoneNumber || '',
        country: seller.country || '',
      });
    }
  }, [seller]);

  const mutation = useMutation({
    mutationFn: updateSellerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update profile', { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      country: formData.country,
    });
  };

  if (sellerLoading) {
    return <TabLoader />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TabHeader
        title="Account Information"
        description="Update your personal details."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Full Name"
          value={formData.name}
          onChange={(v) => setFormData((p) => ({ ...p, name: v }))}
          placeholder="Your name"
        />
        <FormField
          label="Email"
          value={formData.email}
          disabled
          hint="Email cannot be changed."
        />
        <FormField
          label="Phone Number"
          value={formData.phoneNumber}
          onChange={(v) => setFormData((p) => ({ ...p, phoneNumber: v }))}
          placeholder="+1 234 567 8900"
        />
        <FormField
          label="Country"
          value={formData.country}
          onChange={(v) => setFormData((p) => ({ ...p, country: v }))}
          placeholder="United States"
        />
      </div>

      <SaveButton loading={mutation.isPending} />
    </form>
  );
}

// Tab 2: Password & Security

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One digit', test: (p: string) => /\d/.test(p) },
  {
    label: 'One special character',
    test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
  },
];

function SecurityTab() {
  const { logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully. You will be logged out.');
      setTimeout(async () => {
        await logout();
        queryClient.clear();
        router.push('/login');
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error('Failed to change password', { description: error.message });
    },
  });

  const passwordsMatch =
    formData.newPassword.length > 0 &&
    formData.newPassword === formData.confirmPassword;
  const allRulesPass = PASSWORD_RULES.every((rule) =>
    rule.test(formData.newPassword)
  );
  const canSubmit =
    formData.currentPassword.length > 0 && passwordsMatch && allRulesPass;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TabHeader
        title="Password & Security"
        description="Change your password. You will be logged out after a successful change."
      />

      <FormField
        label="Current Password"
        type="password"
        value={formData.currentPassword}
        onChange={(v) => setFormData((p) => ({ ...p, currentPassword: v }))}
        placeholder="Enter current password"
      />
      <FormField
        label="New Password"
        type="password"
        value={formData.newPassword}
        onChange={(v) => setFormData((p) => ({ ...p, newPassword: v }))}
        placeholder="Enter new password"
      />
      <FormField
        label="Confirm New Password"
        type="password"
        value={formData.confirmPassword}
        onChange={(v) => setFormData((p) => ({ ...p, confirmPassword: v }))}
        placeholder="Confirm new password"
      />

      {formData.newPassword.length > 0 && (
        <div className="space-y-2 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <p className="text-sm font-medium text-slate-300 mb-2">
            Password requirements:
          </p>
          {PASSWORD_RULES.map((rule) => {
            const passes = rule.test(formData.newPassword);
            return (
              <div key={rule.label} className="flex items-center gap-2 text-sm">
                {passes ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <X size={14} className="text-slate-500" />
                )}
                <span className={passes ? 'text-green-400' : 'text-slate-500'}>
                  {rule.label}
                </span>
              </div>
            );
          })}
          {formData.confirmPassword.length > 0 && (
            <div className="flex items-center gap-2 text-sm mt-1">
              {passwordsMatch ? (
                <Check size={14} className="text-green-400" />
              ) : (
                <X size={14} className="text-red-400" />
              )}
              <span
                className={passwordsMatch ? 'text-green-400' : 'text-red-400'}
              >
                Passwords match
              </span>
            </div>
          )}
        </div>
      )}

      <SaveButton
        loading={mutation.isPending}
        disabled={!canSubmit}
        label="Change Password"
      />
    </form>
  );
}

// Tab 3: Shop Visibility

function VisibilityTab() {
  const { seller, isLoading: sellerLoading } = useSeller();
  const queryClient = useQueryClient();

  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (seller?.shop) {
      setIsActive(seller.shop.isActive);
    }
  }, [seller]);

  const mutation = useMutation({
    mutationFn: (active: boolean) => updateShop({ isActive: active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      toast.success(
        isActive
          ? 'Shop is now visible to customers'
          : 'Shop has been deactivated'
      );
    },
    onError: (error: Error) => {
      toast.error('Failed to update shop visibility', {
        description: error.message,
      });
      // Revert on error
      if (seller?.shop) {
        setIsActive(seller.shop.isActive);
      }
    },
  });

  const handleToggle = () => {
    const newValue = !isActive;
    setIsActive(newValue);
    mutation.mutate(newValue);
  };

  if (sellerLoading) {
    return <TabLoader />;
  }

  if (!seller?.shop) {
    return <NoShopMessage />;
  }

  return (
    <div className="space-y-5">
      <TabHeader
        title="Shop Visibility"
        description="Control whether your shop is visible to customers."
      />

      <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
        <div>
          <p className="text-white font-medium">Shop Status</p>
          <p className="text-sm text-slate-400 mt-1">
            {isActive
              ? 'Your shop is currently visible to customers.'
              : 'Your shop is hidden from customers.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={mutation.isPending}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isActive ? 'bg-blue-600' : 'bg-slate-600'
          } ${mutation.isPending ? 'opacity-50' : ''}`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {!isActive && (
        <div className="flex gap-3 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
          <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-medium text-sm">
              Shop Deactivated
            </p>
            <p className="text-amber-400/80 text-sm mt-1">
              Your shop and all its products are hidden from customers. Existing
              orders will still be processed. You can reactivate at any time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Tab 4: Social Media Links

function SocialLinksTab() {
  const { seller, isLoading: sellerLoading } = useSeller();
  const queryClient = useQueryClient();

  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    if (seller?.shop?.socialLinks) {
      setLinks(
        (seller.shop.socialLinks as SocialLink[]).map((l) => ({
          platform: l.platform,
          url: l.url,
        }))
      );
    }
  }, [seller]);

  const mutation = useMutation({
    mutationFn: (socialLinks: SocialLink[]) => updateShop({ socialLinks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      toast.success('Social links updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update social links', {
        description: error.message,
      });
    },
  });

  const addLink = () => {
    if (links.length >= 7) return;
    setLinks([...links, { platform: 'Instagram', url: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (
    index: number,
    field: keyof SocialLink,
    value: string
  ) => {
    setLinks(
      links.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out links with empty URLs
    const validLinks = links.filter((l) => l.url.trim().length > 0);
    mutation.mutate(validLinks);
  };

  if (sellerLoading) {
    return <TabLoader />;
  }

  if (!seller?.shop) {
    return <NoShopMessage />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TabHeader
        title="Social Media Links"
        description="Add your social media profiles so customers can follow you."
      />

      <div className="space-y-3">
        {links.map((link, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-800 rounded-lg border border-slate-700"
          >
            <select
              value={link.platform}
              onChange={(e) => updateLink(index, 'platform', e.target.value)}
              className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-40"
            >
              {SOCIAL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <input
              type="url"
              value={link.url}
              onChange={(e) => updateLink(index, 'url', e.target.value)}
              placeholder="https://..."
              className="flex-1 bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => removeLink(index)}
              className="text-red-400 hover:text-red-300 p-2 self-center"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {links.length < 7 && (
        <button
          type="button"
          onClick={addLink}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus size={16} />
          Add Link
        </button>
      )}

      <SaveButton loading={mutation.isPending} />
    </form>
  );
}

// Tab 5: Shop Policies

function PoliciesTab() {
  const { seller, isLoading: sellerLoading } = useSeller();
  const queryClient = useQueryClient();

  const [returnPolicy, setReturnPolicy] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');

  useEffect(() => {
    if (seller?.shop) {
      setReturnPolicy(seller.shop.returnPolicy || '');
      setShippingPolicy(seller.shop.shippingPolicy || '');
    }
  }, [seller]);

  const mutation = useMutation({
    mutationFn: (data: { returnPolicy?: string; shippingPolicy?: string }) =>
      updateShop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      toast.success('Policies updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update policies', {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ returnPolicy, shippingPolicy });
  };

  if (sellerLoading) {
    return <TabLoader />;
  }

  if (!seller?.shop) {
    return <NoShopMessage />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TabHeader
        title="Shop Policies"
        description="Define your return and shipping policies for customers."
      />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-slate-300">
            Return Policy
          </label>
          <span className="text-xs text-slate-500">
            {returnPolicy.length}/5000
          </span>
        </div>
        <textarea
          value={returnPolicy}
          onChange={(e) => setReturnPolicy(e.target.value)}
          maxLength={5000}
          rows={6}
          placeholder="Describe your return policy..."
          className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-slate-300">
            Shipping Information
          </label>
          <span className="text-xs text-slate-500">
            {shippingPolicy.length}/5000
          </span>
        </div>
        <textarea
          value={shippingPolicy}
          onChange={(e) => setShippingPolicy(e.target.value)}
          maxLength={5000}
          rows={6}
          placeholder="Describe your shipping options and timelines..."
          className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <SaveButton loading={mutation.isPending} />
    </form>
  );
}

// Tab 6: Notification Preferences

const NOTIFICATION_GROUPS = [
  {
    title: 'Orders & Delivery',
    keys: ['ORDER', 'DELIVERY'] as const,
  },
  {
    title: 'Products & Shop',
    keys: ['PRODUCT', 'SHOP'] as const,
  },
  {
    title: 'Account & System',
    keys: ['AUTH', 'SYSTEM', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'] as const,
  },
];

const NOTIFICATION_LABELS: Record<string, string> = {
  ORDER: 'Order updates',
  DELIVERY: 'Delivery notifications',
  PRODUCT: 'Product alerts',
  SHOP: 'Shop activity',
  AUTH: 'Account & security',
  SYSTEM: 'System messages',
  INFO: 'General information',
  SUCCESS: 'Success confirmations',
  WARNING: 'Warning alerts',
  ERROR: 'Error notifications',
};

function NotificationsTab() {
  const queryClient = useQueryClient();

  const { data: savedPrefs, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
    staleTime: 5 * 60 * 1000,
  });

  const [prefs, setPrefs] = useState<NotificationPreferences>({});

  useEffect(() => {
    if (savedPrefs) {
      // Default all to true if not set
      const defaults: NotificationPreferences = {
        ORDER: true,
        PRODUCT: true,
        SHOP: true,
        DELIVERY: true,
        AUTH: true,
        SYSTEM: true,
        INFO: true,
        SUCCESS: true,
        WARNING: true,
        ERROR: true,
      };
      setPrefs({ ...defaults, ...savedPrefs });
    }
  }, [savedPrefs]);

  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preferences saved');
    },
    onError: (error: Error) => {
      toast.error('Failed to save preferences', {
        description: error.message,
      });
    },
  });

  const togglePref = useCallback((key: string) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key as keyof NotificationPreferences],
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(prefs);
  };

  if (isLoading) {
    return <TabLoader />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TabHeader
        title="Notification Preferences"
        description="Choose which notifications you want to receive."
      />

      {NOTIFICATION_GROUPS.map((group) => (
        <div key={group.title} className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300">{group.title}</h3>
          <div className="bg-slate-800 rounded-lg border border-slate-700 divide-y divide-slate-700">
            {group.keys.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-slate-200">
                  {NOTIFICATION_LABELS[key]}
                </span>
                <button
                  type="button"
                  onClick={() => togglePref(key)}
                  className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    prefs[key as keyof NotificationPreferences]
                      ? 'bg-blue-600'
                      : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      prefs[key as keyof NotificationPreferences]
                        ? 'translate-x-4'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <SaveButton loading={mutation.isPending} />
    </form>
  );
}

// Shared Components

function TabHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-2">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="text-sm text-slate-400 mt-1">{description}</p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  hint,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function SaveButton({
  loading = false,
  disabled = false,
  label = 'Save Changes',
}: {
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="pt-2">
      <button
        type="submit"
        disabled={loading || disabled}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {label}
      </button>
    </div>
  );
}

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={28} className="animate-spin text-blue-500" />
    </div>
  );
}

function NoShopMessage() {
  return (
    <div className="text-center py-12">
      <p className="text-slate-400">
        You need to set up your shop first before managing these settings.
      </p>
    </div>
  );
}
