import type { NotificationType } from '@tec-shop/dto';

interface TemplateDefinition {
  title: string;
  message: string;
  type: NotificationType;
}

interface RenderedTemplate {
  title: string;
  message: string;
  type: NotificationType;
}

/**
 * Built-in templates inlined to avoid filesystem reads that fail in webpack bundles.
 * The JSON files in ./templates/ are kept as the source of truth for reference,
 * but this map is what actually gets used at runtime.
 */
const BUILT_IN_TEMPLATES: Record<string, TemplateDefinition> = {
  // auth templates
  'auth.welcome': {
    title: 'Welcome to TecShop',
    message:
      'Hi {{name}}, welcome to TecShop! Start exploring products and deals.',
    type: 'AUTH',
  },
  'auth.welcome_seller': {
    title: 'Welcome, Seller!',
    message:
      'Hi {{name}}, your seller account has been created. Set up your shop to start selling.',
    type: 'AUTH',
  },
  'auth.password_changed': {
    title: 'Password Changed',
    message:
      'Your password has been changed successfully. If you did not make this change, contact support immediately.',
    type: 'AUTH',
  },

  // order templates
  'order.placed': {
    title: 'New Order Received',
    message:
      'Order {{orderNumber}} has been placed by {{customerName}} for {{totalAmount}}.',
    type: 'ORDER',
  },
  'order.placed_admin': {
    title: 'New Order Placed',
    message:
      'Order {{orderNumber}} placed by {{customerName}} for {{totalAmount}}.',
    type: 'ORDER',
  },
  'order.paid': {
    title: 'Payment Confirmed',
    message: 'Payment for order {{orderNumber}} has been confirmed.',
    type: 'ORDER',
  },
  'order.shipped': {
    title: 'Order Shipped',
    message:
      'Your order {{orderNumber}} has been shipped. Tracking code: {{trackingNumber}}.',
    type: 'DELIVERY',
  },
  'order.delivered': {
    title: 'Order Delivered',
    message: 'Your order {{orderNumber}} has been delivered.',
    type: 'DELIVERY',
  },
  'order.cancelled': {
    title: 'Order Cancelled',
    message: 'Your order {{orderNumber}} has been cancelled.',
    type: 'ORDER',
  },
  'order.cancelled_seller': {
    title: 'Order Cancelled',
    message: 'Order {{orderNumber}} has been cancelled by the customer.',
    type: 'ORDER',
  },
  'order.delivered_review': {
    title: 'Share your experience',
    message:
      'Your order {{orderNumber}} has been delivered. Tell us what you think about {{productNames}}.',
    type: 'DELIVERY',
  },

  // product templates
  'product.new_rating': {
    title: 'New Review on {{productName}}',
    message:
      '{{reviewerName}} left a {{rating}}-star review on {{productName}}.',
    type: 'PRODUCT',
  },
  'product.low_stock': {
    title: 'Low Stock Alert',
    message:
      '{{productName}} (SKU: {{sku}}) has only {{quantity}} units left.',
    type: 'WARNING',
  },

  // seller templates
  'seller.verification_update': {
    title: 'Verification Status Updated',
    message:
      'Your seller verification status has been updated to: {{status}}.',
    type: 'SHOP',
  },
  'seller.shop_approved': {
    title: 'Shop Approved',
    message: 'Your shop {{shopName}} has been approved and is now live.',
    type: 'SUCCESS',
  },
  'seller.payout_completed': {
    title: 'Payout Processed',
    message:
      'A payout of {{amount}} has been processed for order {{orderNumber}}.',
    type: 'INFO',
  },

  // system templates
  'system.new_user_registered': {
    title: 'New User Registered',
    message: 'A new user {{name}} ({{email}}) has registered.',
    type: 'SYSTEM',
  },
  'system.new_seller_registered': {
    title: 'New Seller Registered',
    message: 'A new seller {{name}} ({{email}}) has registered.',
    type: 'SYSTEM',
  },
  'system.account_banned': {
    title: 'Account Suspended',
    message:
      'Your account has been suspended. Contact support for more information.',
    type: 'WARNING',
  },
  'system.account_unbanned': {
    title: 'Account Restored',
    message:
      'Your account has been restored. You can now access all features.',
    type: 'SUCCESS',
  },
};

export class TemplateEngine {
  private templates = new Map<string, TemplateDefinition>();

  constructor() {
    this.loadBuiltInTemplates();
  }

  private loadBuiltInTemplates(): void {
    for (const [key, template] of Object.entries(BUILT_IN_TEMPLATES)) {
      this.templates.set(key, template);
    }
  }

  registerTemplate(id: string, template: TemplateDefinition): void {
    this.templates.set(id, template);
  }

  render(
    templateId: string,
    variables: Record<string, string>
  ): RenderedTemplate {
    const template = this.templates.get(templateId);

    if (!template) {
      return {
        title: templateId,
        message: `Notification: ${templateId}`,
        type: 'INFO' as NotificationType,
      };
    }

    return {
      title: this.interpolate(template.title, variables),
      message: this.interpolate(template.message, variables),
      type: template.type,
    };
  }

  private interpolate(
    text: string,
    variables: Record<string, string>
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      return variables[key] ?? match;
    });
  }

  getTemplateIds(): string[] {
    return Array.from(this.templates.keys());
  }

  hasTemplate(templateId: string): boolean {
    return this.templates.has(templateId);
  }
}
