'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { NotificationEntry } from '../lib/api/notifications-v2';

const TITLE_KEY_MAP: Record<string, string> = {
  'order.placed_seller':         'title_order_placed_seller',
  'order.delivered_seller':      'title_order_delivered_seller',
  'order.cancelled_seller':      'title_order_cancelled_seller',
  'chat.new_message':            'title_chat_new_message',
  'product.new_rating':          'title_product_new_rating',
  'product.low_stock':           'title_product_low_stock',
  'seller.verification_update':  'title_seller_verification_update',
  'seller.shop_approved':        'title_seller_shop_approved',
  'seller.payout_completed':     'title_seller_payout_completed',
};

export function useNotificationContent() {
  const t = useTranslations('NotificationContent');

  const getContent = useCallback(
    (notification: NotificationEntry): { title: string; message: string } => {
      const { templateId, metadata } = notification;

      const titleKey = TITLE_KEY_MAP[templateId];
      const title = titleKey ? t(titleKey) : notification.title;

      let message = notification.message;

      if (templateId === 'order.delivered_seller' && metadata?.orderNumber) {
        message = t('msg_order_delivered_seller', {
          orderNumber: String(metadata.orderNumber),
        });
      } else if (templateId === 'order.cancelled_seller' && metadata?.orderNumber) {
        message = t('msg_order_cancelled_seller', {
          orderNumber: String(metadata.orderNumber),
        });
      }

      return { title, message };
    },
    [t]
  );

  const formatTimeAgo = useCallback(
    (dateStr: string): string => {
      const now = Date.now();
      const diff = now - new Date(dateStr).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return t('timeJustNow');
      if (minutes < 60) return t('timeMinutesAgo', { minutes });
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return t('timeHoursAgo', { hours });
      const days = Math.floor(hours / 24);
      return t('timeDaysAgo', { days });
    },
    [t]
  );

  return { getContent, formatTimeAgo };
}
