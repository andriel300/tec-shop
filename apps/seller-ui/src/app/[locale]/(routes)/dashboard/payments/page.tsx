/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Package,
  Download,
  FileDown,
  ChevronDown,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { apiClient } from 'apps/seller-ui/src/lib/api/client';
import { exportCSV, type CsvColumn } from 'apps/seller-ui/src/lib/utils/export-csv';
import { exportReport } from 'apps/seller-ui/src/lib/utils/export-report';
import { Breadcrumb } from 'apps/seller-ui/src/components/navigation/Breadcrumb';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sellerPayout: number;
  platformFee: number;
}

interface SellerPayout {
  id: string;
  totalAmount: number;
  platformFee: number;
  payoutAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stripeTransferId?: string;
  processedAt?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  subtotalAmount: number;
  finalAmount: number;
  items: OrderItem[];
  payouts: SellerPayout[];
  createdAt: string;
}

type PaymentRecord = {
  id: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  paymentStatus: string;
  totalSales: number;
  platformFees: number;
  earnings: number;
  payoutStatus: string;
  payoutId: string | undefined;
  stripeTransferId: string | undefined;
  processedAt: string | undefined;
  itemCount: number;
};

type PayoutBarEntry = {
  day: string;
  amount: number;
  fill: string;
  fillOpacity: number;
};

type PayoutTooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
};

const PayoutTooltip = ({ active, payload, label }: PayoutTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest border border-gray-200 rounded-md px-3 py-2 shadow-elev-md">
      <p className="text-xs font-semibold text-gray-900">
        {fmtUSD(payload[0].value * 100)}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
};

type CustomBarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  fillOpacity?: number;
};

const CustomBarShape = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  fillOpacity,
}: CustomBarShapeProps) => {
  if (height <= 0) return null;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      fillOpacity={fillOpacity}
      rx={4}
    />
  );
};


const fetchPaidOrders = async () => {
  const res = await apiClient.get('/orders/get-sellers-orders', {
    params: { paymentStatus: 'COMPLETED' },
  });
  return res.data;
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

type StatusConfigEntry = {
  icon: typeof CheckCircle;
  color: string;
  bg: string;
  label: string;
};

const PAYOUT_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  PENDING: {
    icon: Clock,
    color: 'text-feedback-warning',
    bg: 'bg-yellow-500/10',
    label: 'Pending',
  },
  PROCESSING: {
    icon: TrendingUp,
    color: 'text-brand-primary',
    bg: 'bg-blue-500/10',
    label: 'Processing',
  },
  COMPLETED: {
    icon: CheckCircle,
    color: 'text-feedback-success',
    bg: 'bg-green-500/10',
    label: 'Completed',
  },
  FAILED: {
    icon: XCircle,
    color: 'text-feedback-error',
    bg: 'bg-red-500/10',
    label: 'Failed',
  },
};

type OrderStatusEntry = { color: string; bg: string };
const ORDER_STATUS_CONFIG: Record<string, OrderStatusEntry> = {
  PAID: { color: 'text-feedback-success', bg: 'bg-green-500/10' },
  SHIPPED: { color: 'text-brand-primary', bg: 'bg-blue-500/10' },
  DELIVERED: { color: 'text-brand-accent', bg: 'bg-teal-500/10' },
  CANCELLED: { color: 'text-feedback-error', bg: 'bg-red-500/10' },
};

const PayoutBadge = ({ status }: { status: string }) => {
  const cfg = PAYOUT_STATUS_CONFIG[status] ?? PAYOUT_STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-medium ${cfg.bg} ${cfg.color}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

const OrderBadge = ({ status }: { status: string }) => {
  const cfg = ORDER_STATUS_CONFIG[status] ?? {
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-medium ${cfg.bg} ${cfg.color}`}
    >
      {status}
    </span>
  );
};

const KpiCard = ({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  badge,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof DollarSign;
  iconBg: string;
  iconColor: string;
  badge?: React.ReactNode;
}) => (
  <div className="bg-surface-container-lowest rounded-lg p-5 shadow-elev-low flex flex-col gap-2">
    <div className="flex items-start justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      {badge ?? (
        <div className={`p-2 rounded-md ${iconBg}`}>
          <Icon size={15} className={iconColor} />
        </div>
      )}
    </div>
    <p className="text-2xl font-bold font-display text-gray-900 leading-none">
      {value}
    </p>
    <p className="text-xs text-gray-500">{sub}</p>
  </div>
);

const PAYMENT_CSV_COLUMNS: CsvColumn<PaymentRecord>[] = [
  { header: 'Order ID',          value: (p) => p.orderNumber },
  { header: 'Date',              value: (p) => fmtDate(p.orderDate) },
  { header: 'Items',             value: (p) => String(p.itemCount) },
  { header: 'Total Sales',       value: (p) => (p.totalSales / 100).toFixed(2) },
  { header: 'Platform Fee',      value: (p) => (p.platformFees / 100).toFixed(2) },
  { header: 'Net Earnings',      value: (p) => (p.earnings / 100).toFixed(2) },
  { header: 'Payout Status',     value: (p) => p.payoutStatus },
  { header: 'Order Status',      value: (p) => p.orderStatus },
  { header: 'Stripe Transfer ID',value: (p) => p.stripeTransferId ?? '' },
  { header: 'Processed At',      value: (p) => (p.processedAt ? fmtDate(p.processedAt) : '') },
];

const PaymentsPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-payments', payoutStatusFilter],
    queryFn: fetchPaidOrders,
    staleTime: 1000 * 60 * 5,
  });

  const orders = (data?.data as Order[]) || [];

  const payments = useMemo<PaymentRecord[]>(() => {
    return orders
      .map((order) => {
        const sellerEarnings = order.items.reduce(
          (sum, item) => sum + item.sellerPayout,
          0
        );
        const platformFees = order.items.reduce(
          (sum, item) => sum + item.platformFee,
          0
        );
        const totalSales = order.items.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );
        const payout = order.payouts?.[0];
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
          totalSales,
          platformFees,
          earnings: sellerEarnings,
          payoutStatus: payout?.status || 'PENDING',
          payoutId: payout?.id,
          stripeTransferId: payout?.stripeTransferId,
          processedAt: payout?.processedAt,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        };
      })
      .filter((p) => !payoutStatusFilter || p.payoutStatus === payoutStatusFilter);
  }, [orders, payoutStatusFilter]);

  const weeklyPayoutData = useMemo<PayoutBarEntry[]>(() => {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const jsDay = now.getDay(); // 0=Sun … 6=Sat
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
    const monday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + mondayOffset
    );
    const todayIdx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon … 6=Sun

    const dailyCents = new Array(7).fill(0);
    for (const order of orders) {
      const d = new Date(order.createdAt);
      const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diffDays = Math.floor(
        (local.getTime() - monday.getTime()) / 86_400_000
      );
      if (diffDays >= 0 && diffDays < 7) {
        dailyCents[diffDays] += order.items.reduce(
          (sum, item) => sum + item.sellerPayout,
          0
        );
      }
    }

    return DAYS.map((day, i) => ({
      day,
      amount: Math.round(dailyCents[i] / 100),
      fill: i === todayIdx ? '#0058BB' : '#4B5563',
      fillOpacity: i === todayIdx ? 1 : 0.45,
    }));
  }, [orders]);

  const totalEarnings = payments.reduce((sum, p) => sum + p.earnings, 0);
  const pendingEarnings = payments
    .filter((p) => p.payoutStatus === 'PENDING')
    .reduce((sum, p) => sum + p.earnings, 0);
  const completedEarnings = payments
    .filter((p) => p.payoutStatus === 'COMPLETED')
    .reduce((sum, p) => sum + p.earnings, 0);
  const totalTransactions = payments.length;

  const platformMetrics = useMemo(() => {
    if (!payments.length) {
      return [
        { label: 'Payout Reliability', value: '—', pct: 0 },
        { label: 'Order Fulfillment', value: '—', pct: 0 },
        { label: 'Settlement Rate', value: '—', pct: 0 },
      ];
    }

    const failedCount = payments.filter((p) => p.payoutStatus === 'FAILED').length;
    const payoutReliability = ((payments.length - failedCount) / payments.length) * 100;

    const nonCancelled = payments.filter((p) => p.orderStatus !== 'CANCELLED').length;
    const fulfilled = payments.filter(
      (p) => p.orderStatus === 'DELIVERED' || p.orderStatus === 'SHIPPED'
    ).length;
    const fulfillmentRate = nonCancelled > 0 ? (fulfilled / nonCancelled) * 100 : 100;

    const settlementRate = totalEarnings > 0 ? (completedEarnings / totalEarnings) * 100 : 0;

    return [
      { label: 'Payout Reliability', value: `${payoutReliability.toFixed(1)}%`, pct: payoutReliability },
      { label: 'Order Fulfillment',  value: `${fulfillmentRate.toFixed(1)}%`,   pct: fulfillmentRate },
      { label: 'Settlement Rate',    value: `${settlementRate.toFixed(1)}%`,     pct: settlementRate },
    ];
  }, [payments, totalEarnings, completedEarnings]);

  const lastSync = useMemo(() => {
    if (!payments.length) return null;
    return payments.reduce<Date>((latest, p) => {
      const d = new Date(p.processedAt ?? p.orderDate);
      return d > latest ? d : latest;
    }, new Date(0));
  }, [payments]);

  const healthStatus = useMemo(() => {
    if (!payments.length) return 'unknown';
    const min = Math.min(...platformMetrics.map((m) => m.pct));
    if (min >= 90) return 'operational';
    if (min >= 70) return 'degraded';
    return 'issues';
  }, [platformMetrics, payments.length]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'orderNumber',
        header: ({
          column,
        }: {
          column: { toggleSorting: (desc?: boolean) => void };
        }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Order ID
            <ArrowUpDown size={11} />
          </button>
        ),
        cell: ({ row }: { row: { original: PaymentRecord } }) => (
          <span className="font-mono text-sm font-semibold text-brand-primary-500 dark:text-brand-primary-400">
            #{row.original.orderNumber}
          </span>
        ),
      },
      {
        accessorKey: 'orderDate',
        header: ({
          column,
        }: {
          column: { toggleSorting: (desc?: boolean) => void };
        }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Date
            <ArrowUpDown size={11} />
          </button>
        ),
        cell: ({ row }: { row: { original: PaymentRecord } }) => (
          <span className="text-sm text-gray-500">
            {fmtDate(row.original.orderDate)}
          </span>
        ),
      },
      {
        accessorKey: 'itemCount',
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Items
          </span>
        ),
        cell: ({ row }: { row: { original: PaymentRecord } }) => (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Package size={13} />
            <span className="text-sm">{row.original.itemCount}</span>
          </div>
        ),
      },
      {
        accessorKey: 'totalSales',
        header: ({
          column,
        }: {
          column: { toggleSorting: (desc?: boolean) => void };
        }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Amount
            <ArrowUpDown size={11} />
          </button>
        ),
        cell: ({ row }: { row: { original: PaymentRecord } }) => (
          <span className="text-sm font-medium text-gray-900">
            {fmtUSD(row.original.totalSales)}
          </span>
        ),
      },
      {
        accessorKey: 'platformFees',
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Platform Fee
          </span>
        ),
        cell: ({ row }: { row: { original: PaymentRecord } }) => (
          <span className="text-sm text-feedback-warning">
            -{fmtUSD(row.original.platformFees)}
          </span>
        ),
      },
      {
        accessorKey: 'earnings',
        header: ({
          column,
        }: {
          column: { toggleSorting: (desc?: boolean) => void };
        }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Net Earnings
            <ArrowUpDown size={11} />
          </button>
        ),
        cell: ({ row }: { row: { original: PaymentRecord } }) => (
          <span className="text-sm font-bold text-feedback-success">
            {fmtUSD(row.original.earnings)}
          </span>
        ),
      },
      {
        accessorKey: 'payoutStatus',
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Payout Status
          </span>
        ),
        cell: ({ row }: { row: { original: PaymentRecord } }) => (
          <PayoutBadge status={row.original.payoutStatus} />
        ),
      },
      {
        accessorKey: 'orderStatus',
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Order Status
          </span>
        ),
        cell: ({ row }: { row: { original: PaymentRecord } }) => (
          <OrderBadge status={row.original.orderStatus} />
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: 'orderDate', desc: true }],
    },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageStart = pageIndex * pageSize + 1;
  const pageEnd = Math.min((pageIndex + 1) * pageSize, totalFiltered);

  return (
    <div className="min-h-screen p-6 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 leading-tight">
            Payments & Earnings
          </h1>
          <Breadcrumb title="Payments" items={[]} />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              const rows = table.getFilteredRowModel().rows.map((r) => r.original);
              const date = new Date().toISOString().slice(0, 10);
              exportCSV(rows, PAYMENT_CSV_COLUMNS, `payments-${date}`);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <FileDown size={14} />
            Export CSV
          </button>
          <button
            onClick={() => {
              const rows = table.getFilteredRowModel().rows.map((r) => r.original);
              exportReport(
                { totalEarnings, pendingEarnings, completedEarnings, totalTransactions },
                rows
              );
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary-700 transition-colors cursor-pointer shadow-elev-low"
          >
            <Download size={14} />
            Download Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Earnings"
          value={fmtUSD(totalEarnings)}
          sub="Net revenue across all channels"
          icon={DollarSign}
          iconBg="bg-green-500/10"
          iconColor="text-feedback-success"
        />
        <KpiCard
          label="Pending Payouts"
          value={fmtUSD(pendingEarnings)}
          sub="Processing for next settlement cycle"
          icon={Clock}
          iconBg="bg-yellow-500/10"
          iconColor="text-feedback-warning"
          badge={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-medium bg-yellow-500/10 text-feedback-warning">
              <Clock size={9} />
              In Progress
            </span>
          }
        />
        <KpiCard
          label="Completed Payouts"
          value={fmtUSD(completedEarnings)}
          sub="Total successfully transferred"
          icon={CheckCircle}
          iconBg="bg-blue-500/10"
          iconColor="text-brand-primary"
        />
        <KpiCard
          label="Total Transactions"
          value={totalTransactions.toLocaleString()}
          sub="Verified orders processed"
          icon={TrendingUp}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-500"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest rounded-lg px-3 py-2.5">
          <Search size={14} className="text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by order number..."
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center gap-2 px-3 py-2.5 bg-surface-container-lowest rounded-lg text-sm text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap">
          <span>Last 30 Days</span>
          <ChevronDown size={14} className="text-gray-500" />
        </button>
        <select
          className="bg-surface-container-lowest text-gray-900 text-sm px-3 py-2.5 rounded-lg outline-none transition-colors cursor-pointer"
          value={payoutStatusFilter}
          onChange={(e) => setPayoutStatusFilter(e.target.value)}
        >
          <option value="">All Payout Status</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface-container-lowest rounded-lg shadow-elev-low overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 font-display">
              Recent Transactions Ledger
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalFiltered.toLocaleString()} records found
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-brand-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="bg-gray-50"
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-5 py-3.5 text-left"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <DollarSign size={36} className="opacity-30" />
                          <p className="text-sm font-medium">No payments found</p>
                          <p className="text-xs">
                            Your earnings from completed orders will appear here
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-5 py-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalFiltered > 0 && (
              <div className="px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Showing{' '}
                  <span className="font-semibold text-gray-900">{pageStart}</span>
                  {' '}–{' '}
                  <span className="font-semibold text-gray-900">{pageEnd}</span>
                  {' '}of{' '}
                  <span className="font-semibold text-gray-900">
                    {totalFiltered.toLocaleString()}
                  </span>{' '}
                  results
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-surface-container-lowest text-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </button>
                  {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
                    const total = table.getPageCount();
                    const half = 2;
                    let start = Math.max(0, pageIndex - half);
                    const end = Math.min(total - 1, start + 4);
                    start = Math.max(0, end - 4);
                    return start + i;
                  })
                    .filter((idx) => idx < table.getPageCount())
                    .map((idx) => (
                      <button
                        key={idx}
                        onClick={() => table.setPageIndex(idx)}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                          pageIndex === idx
                            ? 'bg-brand-primary text-white'
                            : 'bg-surface-container-lowest text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  {table.getPageCount() > 5 && (
                    <span className="px-2 text-gray-500 text-sm">
                      … {table.getPageCount()}
                    </span>
                  )}
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-surface-container-lowest text-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom: Payout Schedule + Platform Health */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Payout Schedule */}
        <div className="xl:col-span-3 bg-surface-container-lowest rounded-lg shadow-elev-low p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 font-display">
                Payout Schedule
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Automated weekly settlement forecast
              </p>
            </div>
            <Activity size={16} className="text-gray-400 mt-0.5" />
          </div>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={weeklyPayoutData}
                barSize={32}
                margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                />
                <YAxis hide />
                <Tooltip content={<PayoutTooltip />} cursor={false} />
                <Bar
                  dataKey="amount"
                  shape={<CustomBarShape />}
                  activeBar={{ fillOpacity: 1, filter: 'brightness(1.25)' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Health */}
        <div className="xl:col-span-2 bg-surface-container-lowest rounded-lg shadow-elev-low p-5">
          <h3 className="text-sm font-semibold text-gray-900 font-display">
            Platform Health
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 mb-5">
            System performance and uptime metrics
          </p>
          <div className="space-y-5">
            {platformMetrics.map((metric) => {
              const barColor =
                metric.pct >= 90
                  ? 'bg-feedback-success'
                  : metric.pct >= 70
                  ? 'bg-feedback-warning'
                  : 'bg-feedback-error';
              return (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {metric.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {metric.value}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${metric.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {lastSync
                ? `Updated ${fmtDate(lastSync.toISOString())}`
                : 'No data yet'}
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  healthStatus === 'operational'
                    ? 'bg-feedback-success'
                    : healthStatus === 'degraded'
                    ? 'bg-feedback-warning'
                    : healthStatus === 'issues'
                    ? 'bg-feedback-error'
                    : 'bg-gray-400'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  healthStatus === 'operational'
                    ? 'text-feedback-success'
                    : healthStatus === 'degraded'
                    ? 'text-feedback-warning'
                    : healthStatus === 'issues'
                    ? 'text-feedback-error'
                    : 'text-gray-400'
                }`}
              >
                {healthStatus === 'operational'
                  ? 'Operational'
                  : healthStatus === 'degraded'
                  ? 'Degraded'
                  : healthStatus === 'issues'
                  ? 'Issues'
                  : 'No Data'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
