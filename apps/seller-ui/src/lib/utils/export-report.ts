export type ReportKpis = {
  totalEarnings: number;
  pendingEarnings: number;
  completedEarnings: number;
  totalTransactions: number;
};

export type ReportRow = {
  orderNumber: string;
  orderDate: string;
  itemCount: number;
  totalSales: number;
  platformFees: number;
  earnings: number;
  payoutStatus: string;
  orderStatus: string;
};

const fmtUSD = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const PAYOUT_BADGE: Record<string, { bg: string; color: string }> = {
  COMPLETED:  { bg: '#D1FAE5', color: '#065F46' },
  PENDING:    { bg: '#FEF3C7', color: '#92400E' },
  PROCESSING: { bg: '#DBEAFE', color: '#1E40AF' },
  FAILED:     { bg: '#FEE2E2', color: '#991B1B' },
};

const ORDER_BADGE: Record<string, { bg: string; color: string }> = {
  DELIVERED:  { bg: '#D1FAE5', color: '#065F46' },
  SHIPPED:    { bg: '#DBEAFE', color: '#1E40AF' },
  PAID:       { bg: '#EDE9FE', color: '#5B21B6' },
  CANCELLED:  { bg: '#FEE2E2', color: '#991B1B' },
  PENDING:    { bg: '#FEF3C7', color: '#92400E' },
};

const badge = (text: string, map: Record<string, { bg: string; color: string }>) => {
  const s = map[text] ?? { bg: '#F3F4F6', color: '#374151' };
  return `<span style="background:${s.bg};color:${s.color};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;white-space:nowrap;">${text}</span>`;
};

const buildReportHTML = (kpis: ReportKpis, rows: ReportRow[]): string => {
  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const kpiCards = [
    { label: 'Total Earnings',     value: fmtUSD(kpis.totalEarnings),     accent: '#059669', light: '#D1FAE5' },
    { label: 'Pending Payouts',    value: fmtUSD(kpis.pendingEarnings),    accent: '#D97706', light: '#FEF3C7' },
    { label: 'Completed Payouts',  value: fmtUSD(kpis.completedEarnings),  accent: '#0058BB', light: '#DBEAFE' },
    { label: 'Total Transactions', value: kpis.totalTransactions.toLocaleString(), accent: '#7C3AED', light: '#EDE9FE' },
  ]
    .map(
      (k) => `
      <div style="flex:1;border:1px solid #E5E7EB;border-top:3px solid ${k.accent};border-radius:8px;padding:16px 18px;background:#fff;">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6B7280;margin-bottom:8px;">${k.label}</div>
        <div style="font-size:20px;font-weight:800;color:#111827;letter-spacing:-.02em;">${k.value}</div>
      </div>`
    )
    .join('');

  const tableRows = rows
    .map(
      (r, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#F9FAFB'};">
        <td style="padding:10px 12px;font-family:monospace;font-size:11px;font-weight:700;color:#0058BB;white-space:nowrap;">#${r.orderNumber}</td>
        <td style="padding:10px 12px;white-space:nowrap;">${fmtDate(r.orderDate)}</td>
        <td style="padding:10px 12px;text-align:center;">${r.itemCount}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;">${fmtUSD(r.totalSales)}</td>
        <td style="padding:10px 12px;text-align:right;color:#D97706;font-weight:600;">-${fmtUSD(r.platformFees)}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:800;color:#059669;">${fmtUSD(r.earnings)}</td>
        <td style="padding:10px 12px;">${badge(r.payoutStatus, PAYOUT_BADGE)}</td>
        <td style="padding:10px 12px;">${badge(r.orderStatus, ORDER_BADGE)}</td>
      </tr>`
    )
    .join('');

  const netRate = kpis.totalEarnings > 0
    ? (((kpis.totalEarnings) / (kpis.totalEarnings + rows.reduce((s, r) => s + r.platformFees, 0))) * 100).toFixed(1)
    : '—';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>TecShop — Payments Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #374151;
      background: #fff;
    }

    /* suppress browser-injected URL / date headers */
    @page {
      margin: 0;
      size: A4 portrait;
    }

    .page-wrap { padding: 48px 52px; min-height: 100vh; display: flex; flex-direction: column; }

    /* ── Brand bar ── */
    .brand-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #0058BB;
      margin-bottom: 28px;
    }
    .brand-name {
      font-size: 20px; font-weight: 800; color: #0058BB; letter-spacing: -.03em;
    }
    .brand-tag { font-size: 10px; color: #6B7280; margin-top: 2px; }
    .report-meta { text-align: right; font-size: 11px; color: #6B7280; line-height: 1.8; }
    .report-meta strong { color: #111827; font-size: 13px; font-weight: 700; }

    /* ── KPIs ── */
    .kpis { display: flex; gap: 12px; margin-bottom: 32px; }

    /* ── Section header ── */
    .section-header {
      display: flex; justify-content: space-between; align-items: baseline;
      margin-bottom: 10px;
    }
    .section-title { font-size: 12px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: .05em; }
    .section-sub { font-size: 10.5px; color: #9CA3AF; }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    thead tr { background: #F3F4F6; }
    th {
      padding: 9px 12px; text-align: left;
      font-size: 9.5px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; color: #6B7280;
      border-bottom: 1px solid #E5E7EB;
    }
    th.right, td.right { text-align: right; }
    th.center, td.center { text-align: center; }
    tbody tr { border-bottom: 1px solid #F3F4F6; }
    tbody tr:last-child { border-bottom: none; }
    td { padding: 10px 12px; color: #374151; vertical-align: middle; }

    /* ── Summary strip ── */
    .summary-strip {
      margin-top: 20px; padding: 14px 18px;
      background: #F0F7FF; border: 1px solid #BFDBFE; border-radius: 8px;
      display: flex; gap: 32px; align-items: center;
    }
    .sum-item { font-size: 11px; color: #374151; }
    .sum-item strong { color: #0058BB; font-size: 13px; font-weight: 800; }

    /* ── Footer ── */
    .footer {
      margin-top: auto; padding-top: 24px;
      border-top: 1px solid #E5E7EB;
      display: flex; justify-content: space-between; align-items: center;
    }
    .footer-left { font-size: 10px; color: #9CA3AF; line-height: 1.6; }
    .footer-right { font-size: 10px; color: #9CA3AF; text-align: right; }
    .confidential {
      display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; color: #9CA3AF;
      border: 1px solid #D1D5DB; border-radius: 4px; padding: 2px 6px;
    }
  </style>
</head>
<body>
<div class="page-wrap">

  <!-- Brand bar -->
  <div class="brand-bar">
    <div>
      <div class="brand-name">TecShop</div>
      <div class="brand-tag">Multi-Vendor Marketplace</div>
    </div>
    <div class="report-meta">
      <strong>Payments &amp; Earnings Report</strong><br/>
      Generated: ${generatedAt}<br/>
      ${rows.length} transaction${rows.length !== 1 ? 's' : ''} &bull; All amounts in USD
    </div>
  </div>

  <!-- KPI cards -->
  <div class="kpis">${kpiCards}</div>

  <!-- Table section -->
  <div class="section-header">
    <span class="section-title">Transaction Ledger</span>
    <span class="section-sub">${rows.length} record${rows.length !== 1 ? 's' : ''} exported</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Order ID</th>
        <th>Date</th>
        <th class="center">Items</th>
        <th class="right">Total Sales</th>
        <th class="right">Platform Fee</th>
        <th class="right">Net Earnings</th>
        <th>Payout</th>
        <th>Order Status</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <!-- Summary strip -->
  <div class="summary-strip">
    <div class="sum-item">Total Net Earnings<br/><strong>${fmtUSD(kpis.totalEarnings)}</strong></div>
    <div class="sum-item">Avg. Net Rate<br/><strong>${netRate}%</strong></div>
    <div class="sum-item">Completed<br/><strong>${fmtUSD(kpis.completedEarnings)}</strong></div>
    <div class="sum-item">Pending<br/><strong>${fmtUSD(kpis.pendingEarnings)}</strong></div>
    <div class="sum-item">Transactions<br/><strong>${kpis.totalTransactions.toLocaleString()}</strong></div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      TecShop Seller Dashboard<br/>
      This report was generated automatically. Do not alter figures.
    </div>
    <div class="footer-right">
      <span class="confidential">Confidential</span><br/>
      <span style="margin-top:4px;display:block;">${generatedAt}</span>
    </div>
  </div>

</div>
</body>
</html>`;
};

export const exportReport = (kpis: ReportKpis, rows: ReportRow[]): void => {
  const html = buildReportHTML(kpis, rows);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  // Small delay lets the browser fully render before the print dialog opens
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
};
