'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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

const SOCIAL_PLATFORMS = [
  'Instagram',
  'Facebook',
  'Twitter/X',
  'YouTube',
  'TikTok',
  'LinkedIn',
  'Pinterest',
];

type TabId = 'account' | 'security' | 'visibility' | 'social' | 'policies' | 'notifications';

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const [activeTab, setActiveTab] = useState<TabId>('account');

  const TABS = [
    { id: 'account' as const, label: t('tabAccount'), icon: UserCircle },
    { id: 'security' as const, label: t('tabSecurity'), icon: Lock },
    { id: 'visibility' as const, label: t('tabVisibility'), icon: Eye },
    { id: 'social' as const, label: t('tabSocial'), icon: Share2 },
    { id: 'policies' as const, label: t('tabPolicies'), icon: FileText },
    { id: 'notifications' as const, label: t('tabNotifications'), icon: BellRing },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('pageTitle')}</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-56 shrink-0">
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
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

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
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-[#ffffff] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
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

function AccountInfoTab() {
  const t = useTranslations('Settings');
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
      toast.success(t('profileUpdated'));
    },
    onError: (error: Error) => {
      toast.error(t('profileUpdateFailed'), { description: error.message });
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
        title={t('accountTitle')}
        description={t('accountDesc')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label={t('fieldFullName')}
          value={formData.name}
          onChange={(v) => setFormData((p) => ({ ...p, name: v }))}
          placeholder={t('placeholderName')}
        />
        <FormField
          label={t('fieldEmail')}
          value={formData.email}
          disabled
          hint={t('fieldEmailHint')}
        />
        <FormField
          label={t('fieldPhone')}
          value={formData.phoneNumber}
          onChange={(v) => setFormData((p) => ({ ...p, phoneNumber: v }))}
          placeholder={t('placeholderPhone')}
        />
        <FormField
          label={t('fieldCountry')}
          value={formData.country}
          onChange={(v) => setFormData((p) => ({ ...p, country: v }))}
          placeholder={t('placeholderCountry')}
        />
      </div>

      <SaveButton loading={mutation.isPending} label={t('saveChanges')} />
    </form>
  );
}

const PASSWORD_RULES_KEYS = [
  { key: 'passwordRuleLength', test: (p: string) => p.length >= 8 },
  { key: 'passwordRuleUppercase', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'passwordRuleLowercase', test: (p: string) => /[a-z]/.test(p) },
  { key: 'passwordRuleDigit', test: (p: string) => /\d/.test(p) },
  { key: 'passwordRuleSpecial', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
] as const;

function SecurityTab() {
  const t = useTranslations('Settings');
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
      toast.success(t('passwordChanged'));
      setTimeout(async () => {
        await logout();
        queryClient.clear();
        router.push('/login');
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error(t('passwordChangeFailed'), { description: error.message });
    },
  });

  const passwordsMatch =
    formData.newPassword.length > 0 &&
    formData.newPassword === formData.confirmPassword;
  const allRulesPass = PASSWORD_RULES_KEYS.every((rule) =>
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
        title={t('securityTitle')}
        description={t('securityDesc')}
      />

      <FormField
        label={t('fieldCurrentPassword')}
        type="password"
        value={formData.currentPassword}
        onChange={(v) => setFormData((p) => ({ ...p, currentPassword: v }))}
        placeholder={t('placeholderCurrentPassword')}
      />
      <FormField
        label={t('fieldNewPassword')}
        type="password"
        value={formData.newPassword}
        onChange={(v) => setFormData((p) => ({ ...p, newPassword: v }))}
        placeholder={t('placeholderNewPassword')}
      />
      <FormField
        label={t('fieldConfirmPassword')}
        type="password"
        value={formData.confirmPassword}
        onChange={(v) => setFormData((p) => ({ ...p, confirmPassword: v }))}
        placeholder={t('placeholderConfirmPassword')}
      />

      {formData.newPassword.length > 0 && (
        <div className="space-y-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-300 mb-2">
            {t('passwordRequirements')}
          </p>
          {PASSWORD_RULES_KEYS.map((rule) => {
            const passes = rule.test(formData.newPassword);
            return (
              <div key={rule.key} className="flex items-center gap-2 text-sm">
                {passes ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <X size={14} className="text-slate-500" />
                )}
                <span className={passes ? 'text-green-400' : 'text-slate-500'}>
                  {t(rule.key)}
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
                {t('passwordsMatch')}
              </span>
            </div>
          )}
        </div>
      )}

      <SaveButton
        loading={mutation.isPending}
        disabled={!canSubmit}
        label={t('changePassword')}
      />
    </form>
  );
}

function VisibilityTab() {
  const t = useTranslations('Settings');
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
          ? t('shopVisibilityUpdatedVisible')
          : t('shopVisibilityUpdatedHidden')
      );
    },
    onError: (error: Error) => {
      toast.error(t('shopVisibilityFailed'), { description: error.message });
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
        title={t('visibilityTitle')}
        description={t('visibilityDesc')}
      />

      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div>
          <p className="text-gray-900 font-medium">{t('shopStatus')}</p>
          <p className="text-sm text-slate-400 mt-1">
            {isActive ? t('shopVisible') : t('shopHidden')}
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
              {t('shopDeactivatedTitle')}
            </p>
            <p className="text-amber-400/80 text-sm mt-1">
              {t('shopDeactivatedDesc')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialLinksTab() {
  const t = useTranslations('Settings');
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
      toast.success(t('socialUpdated'));
    },
    onError: (error: Error) => {
      toast.error(t('socialUpdateFailed'), { description: error.message });
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
        title={t('socialTitle')}
        description={t('socialDesc')}
      />

      <div className="space-y-3">
        {links.map((link, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <select
              value={link.platform}
              onChange={(e) => updateLink(index, 'platform', e.target.value)}
              className="bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-40"
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
              className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {t('addLink')}
        </button>
      )}

      <SaveButton loading={mutation.isPending} label={t('saveChanges')} />
    </form>
  );
}

function PoliciesTab() {
  const t = useTranslations('Settings');
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
      toast.success(t('policiesUpdated'));
    },
    onError: (error: Error) => {
      toast.error(t('policiesUpdateFailed'), { description: error.message });
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
        title={t('policiesTitle')}
        description={t('policiesDesc')}
      />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {t('returnPolicyLabel')}
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
          placeholder={t('returnPolicyPlaceholder')}
          className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {t('shippingInfoLabel')}
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
          placeholder={t('shippingInfoPlaceholder')}
          className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <SaveButton loading={mutation.isPending} label={t('saveChanges')} />
    </form>
  );
}

const NOTIFICATION_GROUPS: { titleKey: 'notifGroupOrders' | 'notifGroupProducts' | 'notifGroupAccount'; keys: (keyof NotificationPreferences)[] }[] = [
  { titleKey: 'notifGroupOrders', keys: ['ORDER', 'DELIVERY'] },
  { titleKey: 'notifGroupProducts', keys: ['PRODUCT', 'SHOP'] },
  { titleKey: 'notifGroupAccount', keys: ['AUTH', 'SYSTEM', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'] },
];

const NOTIFICATION_LABEL_KEYS: Record<string, 'notifOrderUpdates' | 'notifDelivery' | 'notifProduct' | 'notifShop' | 'notifAuth' | 'notifSystem' | 'notifInfo' | 'notifSuccess' | 'notifWarning' | 'notifError'> = {
  ORDER: 'notifOrderUpdates',
  DELIVERY: 'notifDelivery',
  PRODUCT: 'notifProduct',
  SHOP: 'notifShop',
  AUTH: 'notifAuth',
  SYSTEM: 'notifSystem',
  INFO: 'notifInfo',
  SUCCESS: 'notifSuccess',
  WARNING: 'notifWarning',
  ERROR: 'notifError',
};

function NotificationsTab() {
  const t = useTranslations('Settings');
  const queryClient = useQueryClient();

  const { data: savedPrefs, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
    staleTime: 5 * 60 * 1000,
  });

  const [prefs, setPrefs] = useState<NotificationPreferences>({});

  useEffect(() => {
    if (savedPrefs) {
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
      toast.success(t('notifSaved'));
    },
    onError: (error: Error) => {
      toast.error(t('notifSaveFailed'), { description: error.message });
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
        title={t('notificationsTitle')}
        description={t('notificationsDesc')}
      />

      {NOTIFICATION_GROUPS.map((group) => (
        <div key={group.titleKey} className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300">{t(group.titleKey)}</h3>
          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
            {group.keys.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-gray-700 dark:text-slate-200">
                  {t(NOTIFICATION_LABEL_KEYS[key as string])}
                </span>
                <button
                  type="button"
                  onClick={() => togglePref(key as string)}
                  className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    prefs[key]
                      ? 'bg-blue-600'
                      : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      prefs[key]
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

      <SaveButton loading={mutation.isPending} label={t('saveChanges')} />
    </form>
  );
}

function TabHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-2">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
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
        className={`w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
  label,
}: {
  loading?: boolean;
  disabled?: boolean;
  label: string;
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
  const t = useTranslations('Settings');
  return (
    <div className="text-center py-12">
      <p className="text-slate-400">
        {t('noShopMessage')}
      </p>
    </div>
  );
}
