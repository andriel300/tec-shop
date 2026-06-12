'use client';

import type { SellerStatistics } from '../../../../../lib/api/seller';
import { useTranslations } from 'next-intl';

interface StatsCardsProps {
  stats: SellerStatistics;
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  const t = useTranslations('Dashboard');
  return (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {/* Revenue */}
    <div className="bg-surface-container-lowest rounded-lg p-5 border-l-4 border-l-brand-primary-600 shadow-ambient">
      <div className="text-brand-primary-600 text-sm font-medium mb-1">{t('totalRevenue')}</div>
      <div className="text-gray-900 font-display text-xl font-bold mb-1">
        $
        {(stats.revenue.total / 100).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <div className="text-gray-500 text-xs">
        {t('fromLastMonth', {
          growth: `${stats.revenue.growth > 0 ? '+' : ''}${stats.revenue.growth.toFixed(1)}`,
        })}
      </div>
    </div>

    {/* Orders */}
    <div className="bg-surface-container-lowest rounded-lg p-5 border-l-4 border-l-feedback-success shadow-ambient">
      <div className="text-feedback-success text-sm font-medium mb-1">{t('totalOrders')}</div>
      <div className="text-gray-900 font-display text-xl font-bold mb-1">
        {stats.orders.total.toLocaleString()}
      </div>
      <div className="text-gray-500 text-xs">{t('thisMonth', { count: stats.orders.thisMonth })}</div>
    </div>

    {/* Products */}
    <div className="bg-surface-container-lowest rounded-lg p-5 border-l-4 border-l-purple-500 shadow-ambient">
      <div className="text-purple-600 text-sm font-medium mb-1">{t('totalProducts')}</div>
      <div className="text-gray-900 font-display text-xl font-bold mb-1">
        {stats.products.total.toLocaleString()}
      </div>
      <div className="text-gray-500 text-xs">
        {t('activeAndOutOfStock', {
          active: stats.products.active,
          outOfStock: stats.products.outOfStock,
        })}
      </div>
    </div>

    {/* Rating */}
    <div className="bg-surface-container-lowest rounded-lg p-5 border-l-4 border-l-feedback-warning shadow-ambient">
      <div className="text-feedback-warning text-sm font-medium mb-1">{t('shopRating')}</div>
      <div className="text-gray-900 font-display text-xl font-bold mb-1">
        {stats.shop.rating.toFixed(1)} &#9733;
      </div>
      <div className="text-gray-500 text-xs">
        {stats.shop.isActive ? t('shopActive') : t('shopInactive')}
      </div>
    </div>
  </div>
  );
};

export default StatsCards;
