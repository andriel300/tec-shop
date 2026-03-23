export type InvoiceData = {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
    phoneNumber?: string;
  };
  items: Array<{
    productName: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    sellerPayout: number;
  }>;
  subtotalAmount: number;
  platformFee: number;
  finalAmount: number;
};

const fmtUSD = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const buildInvoiceHTML = (order: InvoiceData): string => {
  const isPaid = order.paymentStatus === 'COMPLETED';
  const addr = order.shippingAddress;
  const totalPayout = order.items.reduce((s, i) => s + i.sellerPayout, 0);
  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    COMPLETED: { bg: '#D1FAE5', color: '#065F46' },
    PENDING:   { bg: '#FEF3C7', color: '#92400E' },
    FAILED:    { bg: '#FEE2E2', color: '#991B1B' },
    REFUNDED:  { bg: '#EDE9FE', color: '#5B21B6' },
  };
  const badge = STATUS_COLORS[order.paymentStatus] ?? { bg: '#F3F4F6', color: '#374151' };

  const rows = order.items
    .map(
      (item, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#F9FAFB'};">
      <td style="padding:10px 14px;">
        <div style="font-weight:600;color:#111827;font-size:12px;">${item.productName}</div>
        ${item.sku ? `<div style="font-size:10px;color:#9CA3AF;margin-top:2px;">SKU: ${item.sku}</div>` : ''}
      </td>
      <td style="padding:10px 14px;text-align:center;font-family:monospace;font-size:12px;font-weight:600;">${String(item.quantity).padStart(2, '0')}</td>
      <td style="padding:10px 14px;text-align:right;font-size:12px;">${fmtUSD(item.unitPrice)}</td>
      <td style="padding:10px 14px;text-align:right;font-size:12px;font-weight:700;color:#0058BB;">${fmtUSD(item.sellerPayout)}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice — #${order.orderNumber}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 12px; color: #374151; background: #fff;
    }
    @page { margin: 0; size: A4 portrait; }
    .page { padding: 48px 52px; min-height: 100vh; display: flex; flex-direction: column; position: relative; overflow: hidden; }
    ${isPaid ? `.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-28deg); font-size: 96px; font-weight: 900; color: rgba(16,185,129,0.055); letter-spacing: 0.15em; pointer-events: none; white-space: nowrap; z-index: 0; user-select: none; }` : ''}
    .brand-bar { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 22px; border-bottom: 2px solid #0058BB; margin-bottom: 36px; }
    .brand-name { font-size: 22px; font-weight: 800; color: #0058BB; letter-spacing: -.03em; }
    .brand-tag { font-size: 10px; color: #6B7280; margin-top: 3px; }
    .doc-meta { text-align: right; }
    .doc-title { font-size: 18px; font-weight: 800; color: #111827; letter-spacing: -.02em; text-transform: uppercase; }
    .doc-number { font-size: 13px; font-family: monospace; color: #0058BB; font-weight: 700; margin-top: 6px; }
    .doc-sub { font-size: 11px; color: #6B7280; margin-top: 5px; line-height: 1.8; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; margin-top: 4px; }
    .three-col { display: flex; gap: 20px; margin-bottom: 36px; }
    .info-block { flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px 18px; }
    .info-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #9CA3AF; margin-bottom: 10px; }
    .info-value { font-size: 12px; color: #374151; line-height: 1.75; }
    .info-value strong { color: #111827; font-weight: 700; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #111827; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #F3F4F6; }
    th { padding: 9px 14px; text-align: left; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6B7280; border-bottom: 1px solid #E5E7EB; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    tbody tr { border-bottom: 1px solid #F3F4F6; }
    tbody tr:last-child { border-bottom: none; }
    .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals { width: 280px; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 9px 16px; font-size: 12px; border-bottom: 1px solid #F3F4F6; }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.final { background: #F0F7FF; border-top: 2px solid #0058BB; padding: 12px 16px; }
    .totals-label { color: #6B7280; }
    .fee-amount { color: #D97706; font-weight: 600; }
    .payout-amount { color: #059669; font-size: 15px; font-weight: 800; }
    .footer { margin-top: auto; padding-top: 22px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-left { font-size: 10px; color: #9CA3AF; line-height: 1.7; }
    .footer-right { text-align: right; }
    .confidential { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #9CA3AF; border: 1px solid #D1D5DB; border-radius: 4px; padding: 2px 7px; }
    .generated { font-size: 10px; color: #9CA3AF; margin-top: 4px; }
  </style>
</head>
<body>
<div class="page">

  ${isPaid ? '<div class="watermark">PAID</div>' : ''}

  <!-- Brand bar -->
  <div class="brand-bar">
    <div>
      <div class="brand-name">TecShop</div>
      <div class="brand-tag">Multi-Vendor Marketplace — Seller Invoice</div>
    </div>
    <div class="doc-meta">
      <div class="doc-title">Invoice</div>
      <div class="doc-number">#${order.orderNumber}</div>
      <div class="doc-sub">
        ${fmtDate(order.createdAt)}<br/>
        <span class="status-badge" style="background:${badge.bg};color:${badge.color};">${order.paymentStatus}</span>
      </div>
    </div>
  </div>

  <!-- Info blocks -->
  <div class="three-col">
    <div class="info-block">
      <div class="info-label">Ship To</div>
      <div class="info-value">
        <strong>${addr.name}</strong><br/>
        ${addr.street}<br/>
        ${addr.city}${addr.state ? ', ' + addr.state : ''}<br/>
        ${addr.zipCode}, ${addr.country}
        ${addr.phoneNumber ? `<br/>${addr.phoneNumber}` : ''}
      </div>
    </div>
    <div class="info-block">
      <div class="info-label">Order Details</div>
      <div class="info-value">
        <strong>#${order.orderNumber}</strong><br/>
        Placed: ${fmtDate(order.createdAt)}<br/>
        Status: ${order.status}<br/>
        Items: ${order.items.length}
      </div>
    </div>
    <div class="info-block">
      <div class="info-label">Document</div>
      <div class="info-value">
        <strong>Seller Invoice</strong><br/>
        Generated: ${generatedAt}<br/>
        TecShop Marketplace
      </div>
    </div>
  </div>

  <!-- Items table -->
  <div class="section-title">Ordered Items</div>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th class="center">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Your Payout</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Totals -->
  <div class="totals-wrap">
    <div class="totals">
      <div class="totals-row">
        <span class="totals-label">Gross Sale</span>
        <span>${fmtUSD(order.subtotalAmount)}</span>
      </div>
      <div class="totals-row">
        <span class="totals-label">Platform Fee (10%)</span>
        <span class="fee-amount">−${fmtUSD(order.platformFee)}</span>
      </div>
      <div class="totals-row final">
        <span style="font-weight:700;color:#111827;">Net Payout</span>
        <span class="payout-amount">${fmtUSD(totalPayout)}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      TecShop Seller Dashboard — Invoice generated automatically.<br/>
      Do not alter figures. Questions? Contact seller-support@tec-shop.com
    </div>
    <div class="footer-right">
      <div class="confidential">Confidential</div>
      <div class="generated">${generatedAt}</div>
    </div>
  </div>

</div>
</body>
</html>`;
};

export const exportInvoice = (order: InvoiceData): void => {
  const html = buildInvoiceHTML(order);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
};
