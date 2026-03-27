'use client';

import { useMemo, useState, useCallback, useTransition } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Play,
  Pause,
  Wifi,
  WifiOff,
  FileText,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  XCircle,
  Trash2,
  Filter,
  X,
} from 'lucide-react';
import { useLoggerSocket } from '../../../../../hooks/useLoggerSocket';
import {
  useLogs,
  useLogStats,
  useLogServices,
} from '../../../../../hooks/useLogs';
import { downloadLogsAsFile } from '../../../../../lib/api/logs';
import type {
  LogEntry,
  LogLevel,
  LogCategory,
  LogQueryParams,
} from '../../../../../lib/api/logs';
import { toast } from 'sonner';

const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
const LOG_CATEGORIES: LogCategory[] = [
  'auth',
  'user',
  'seller',
  'product',
  'order',
  'system',
  'security',
  'payment',
];

const LEVEL_CONFIG: Record<
  LogLevel,
  {
    badge: string;
    dot: string;
    rowAccent: string;
    icon: React.ComponentType<{ size?: number }>;
  }
> = {
  debug: {
    badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    dot: 'bg-gray-400',
    rowAccent: '',
    icon: Bug,
  },
  info: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
    rowAccent: '',
    icon: Info,
  },
  warn: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
    rowAccent: 'border-l-2 border-l-amber-500/40',
    icon: AlertTriangle,
  },
  error: {
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-400',
    rowAccent: 'border-l-2 border-l-red-500/50',
    icon: AlertCircle,
  },
  fatal: {
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    dot: 'bg-purple-400',
    rowAccent: 'border-l-2 border-l-purple-500/60',
    icon: XCircle,
  },
};

const CATEGORY_COLORS: Record<LogCategory, string> = {
  auth:     'text-cyan-400',
  user:     'text-emerald-400',
  seller:   'text-orange-400',
  product:  'text-pink-400',
  order:    'text-purple-400',
  system:   'text-gray-400',
  security: 'text-red-400',
  payment:  'text-amber-400',
};

const LoggersPage = () => {
  const [, startTransition] = useTransition();
  const [mode, setMode] = useState<'realtime' | 'historical'>('realtime');
  const [filters, setFilters] = useState<LogQueryParams>({
    page: 1,
    limit: 50,
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [excludePatterns, setExcludePatterns] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState('');
  const [showExcludePanel, setShowExcludePanel] = useState(false);

  const {
    isConnected,
    logs: realtimeLogs,
    clearLogs,
    isPaused,
    togglePause,
    updateFilters: updateSocketFilters,
  } = useLoggerSocket({
    enabled: mode === 'realtime',
    onConnect: () => toast.success('Connected to log stream'),
    onDisconnect: () => toast.info('Disconnected from log stream'),
    onError: (error) => toast.error(`WebSocket error: ${error}`),
  });

  const {
    data: historicalData,
    isLoading: isLoadingHistorical,
    refetch,
  } = useLogs(mode === 'historical' ? filters : undefined);

  const { data: statsData } = useLogStats();
  const { data: servicesData } = useLogServices();

  const logs = useMemo(() => {
    const raw = mode === 'realtime' ? realtimeLogs : historicalData?.logs ?? [];
    if (excludePatterns.length === 0) return raw;
    return raw.filter(
      (log) =>
        !excludePatterns.some((pattern) =>
          log.message.toLowerCase().includes(pattern.toLowerCase())
        )
    );
  }, [mode, realtimeLogs, historicalData, excludePatterns]);

  const handleFilterChange = useCallback(
    (key: keyof LogQueryParams, value: string | undefined) => {
      const newFilters = { ...filters, [key]: value || undefined, page: 1 };
      setFilters(newFilters);

      if (mode === 'realtime') {
        updateSocketFilters({
          services: newFilters.service ? [newFilters.service] : undefined,
          levels: newFilters.level ? [newFilters.level] : undefined,
          categories: newFilters.category ? [newFilters.category] : undefined,
        });
      }
    },
    [filters, mode, updateSocketFilters]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setGlobalFilter(value);
      if (mode === 'historical') {
        setFilters((prev) => ({
          ...prev,
          search: value || undefined,
          page: 1,
        }));
      }
    },
    [mode]
  );

  const addExcludePattern = useCallback(() => {
    const trimmed = excludeInput.trim();
    if (trimmed && !excludePatterns.includes(trimmed)) {
      setExcludePatterns((prev) => [...prev, trimmed]);
    }
    setExcludeInput('');
  }, [excludeInput, excludePatterns]);

  const removeExcludePattern = useCallback((pattern: string) => {
    setExcludePatterns((prev) => prev.filter((p) => p !== pattern));
  }, []);

  const handleHistoricalPageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleDownload = useCallback(async () => {
    try {
      await downloadLogsAsFile({
        service: filters.service,
        level: filters.level,
        category: filters.category,
        search: filters.search,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: 1000,
      });
      toast.success('Logs downloaded successfully');
    } catch {
      toast.error('Failed to download logs');
    }
  }, [filters]);

  const columns = useMemo<ColumnDef<LogEntry>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Time',
        size: 160,
        cell: ({ row }) => {
          const date = new Date(row.original.timestamp);
          return (
            <span className="text-gray-400 text-xs font-mono tabular-nums">
              {date.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: 'level',
        header: 'Level',
        size: 90,
        cell: ({ row }) => {
          const level = row.original.level;
          const cfg = LEVEL_CONFIG[level];
          const Icon = cfg.icon;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md
                          text-xs font-semibold border ${cfg.badge}`}
            >
              <Icon size={11} />
              {level.toUpperCase()}
            </span>
          );
        },
      },
      {
        accessorKey: 'service',
        header: 'Service',
        size: 130,
        cell: ({ row }) => (
          <span className="text-white text-sm font-medium font-mono">
            {row.original.service}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        size: 100,
        cell: ({ row }) => {
          const cat = row.original.category;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  LEVEL_CONFIG[row.original.level]?.dot ?? 'bg-gray-400'
                }`}
              />
              <span
                className={`text-xs font-semibold ${
                  CATEGORY_COLORS[cat] ?? 'text-gray-400'
                }`}
              >
                {cat}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'message',
        header: 'Message',
        cell: ({ row }) => (
          <span className="text-gray-200 text-sm truncate max-w-lg block">
            {row.original.message}
          </span>
        ),
      },
      {
        accessorKey: 'userId',
        header: 'User ID',
        size: 100,
        cell: ({ row }) =>
          row.original.userId ? (
            <span className="text-gray-500 text-xs font-mono">
              {row.original.userId.slice(-8)}
            </span>
          ) : (
            <span className="text-gray-700 text-xs">—</span>
          ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  const currentTablePage = table.getState().pagination.pageIndex;
  const tablePageCount = table.getPageCount();
  const filteredTotal = table.getFilteredRowModel().rows.length;
  const pageStart = currentTablePage * table.getState().pagination.pageSize + 1;
  const pageEnd = Math.min(
    (currentTablePage + 1) * table.getState().pagination.pageSize,
    filteredTotal
  );

  const totalPages =
    historicalData
      ? Math.ceil(historicalData.total / (filters.limit || 50))
      : 0;
  const currentHistoricalPage = filters.page || 1;

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-gray-300 font-medium">System Logs</span>
        </div>
        <h1 className="text-4xl font-bold text-white">System Logs</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Logs */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-brand-primary-600/10 p-2.5 rounded-lg">
                <FileText size={18} className="text-brand-primary-400" />
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-800 px-2.5 py-0.5 rounded-full">
                All Time
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Logs</p>
            <p className="text-3xl font-bold text-white">
              {(statsData?.totalLogs ?? 0).toLocaleString()}
            </p>
          </div>
          <FileText
            size={110}
            className="absolute -bottom-5 -right-5 text-brand-primary-400 opacity-[0.04]"
            strokeWidth={1}
          />
        </div>

        {/* Errors */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-500/10 p-2.5 rounded-lg">
                <AlertCircle size={18} className="text-red-400" />
              </div>
              {(statsData?.byLevel?.error ?? 0) > 0 ? (
                <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full">
                  Needs Attention
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  All Clear
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-1">Errors</p>
            <p className="text-3xl font-bold text-white">
              {(statsData?.byLevel?.error ?? 0).toLocaleString()}
            </p>
          </div>
          <AlertCircle
            size={110}
            className="absolute -bottom-5 -right-5 text-red-400 opacity-[0.04]"
            strokeWidth={1}
          />
        </div>

        {/* Warnings */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-lg">
                <AlertTriangle size={18} className="text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-800 px-2.5 py-0.5 rounded-full">
                Warnings
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Warnings</p>
            <p className="text-3xl font-bold text-white">
              {(statsData?.byLevel?.warn ?? 0).toLocaleString()}
            </p>
          </div>
          <AlertTriangle
            size={110}
            className="absolute -bottom-5 -right-5 text-amber-400 opacity-[0.04]"
            strokeWidth={1}
          />
        </div>

        {/* Connection */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-2.5 rounded-lg ${
                  isConnected ? 'bg-emerald-500/10' : 'bg-gray-500/10'
                }`}
              >
                {isConnected ? (
                  <Wifi size={18} className="text-emerald-400" />
                ) : (
                  <WifiOff size={18} className="text-gray-500" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-gray-500'
                  }`}
                />
                <span
                  className={`text-xs font-semibold ${
                    isConnected ? 'text-emerald-400' : 'text-gray-500'
                  }`}
                >
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Stream Status</p>
            <p
              className={`text-3xl font-bold ${
                isConnected ? 'text-white' : 'text-gray-500'
              }`}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          {isConnected ? (
            <Wifi
              size={110}
              className="absolute -bottom-5 -right-5 text-emerald-400 opacity-[0.04]"
              strokeWidth={1}
            />
          ) : (
            <WifiOff
              size={110}
              className="absolute -bottom-5 -right-5 text-gray-500 opacity-[0.04]"
              strokeWidth={1}
            />
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 space-y-3 border-b border-gray-800">
          {/* Row 1: Mode + Search + Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Segment Control */}
            <div className="flex bg-gray-800 rounded-lg p-1 gap-1 shrink-0">
              <button
                onClick={() => startTransition(() => setMode('realtime'))}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'realtime'
                    ? 'bg-brand-primary-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Real-time
              </button>
              <button
                onClick={() => startTransition(() => setMode('historical'))}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'historical'
                    ? 'bg-brand-primary-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Historical
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-48 flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2.5">
              <Search size={15} className="text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Search logs..."
                className="w-full bg-transparent text-white outline-none placeholder:text-gray-500 text-sm"
                value={globalFilter}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {globalFilter && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowExcludePanel(!showExcludePanel)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  excludePatterns.length > 0
                    ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
                    : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                <Filter size={14} />
                Exclude
                {excludePatterns.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {excludePatterns.length}
                  </span>
                )}
              </button>

              {mode === 'realtime' && (
                <>
                  <button
                    onClick={togglePause}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isPaused
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={clearLogs}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700
                               hover:border-gray-600 text-gray-400 hover:text-white rounded-lg
                               text-sm font-medium transition-colors"
                  >
                    <Trash2 size={14} />
                    Clear
                  </button>
                </>
              )}

              {mode === 'historical' && (
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700
                             hover:border-gray-600 text-gray-400 hover:text-white rounded-lg
                             text-sm font-medium transition-colors"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              )}

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary-600
                           hover:bg-brand-primary-700 text-white rounded-lg
                           text-sm font-medium transition-colors"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          </div>

          {/* Row 2: Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-lg
                         outline-none cursor-pointer border border-gray-700 hover:border-gray-600 transition-colors"
              value={filters.service || ''}
              onChange={(e) => handleFilterChange('service', e.target.value)}
            >
              <option value="">All Services</option>
              {servicesData?.services?.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>

            <select
              className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-lg
                         outline-none cursor-pointer border border-gray-700 hover:border-gray-600 transition-colors"
              value={filters.level || ''}
              onChange={(e) =>
                handleFilterChange('level', e.target.value as LogLevel)
              }
            >
              <option value="">All Levels</option>
              {LOG_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              className="bg-gray-800 text-gray-300 text-sm px-3 py-2 rounded-lg
                         outline-none cursor-pointer border border-gray-700 hover:border-gray-600 transition-colors"
              value={filters.category || ''}
              onChange={(e) =>
                handleFilterChange('category', e.target.value as LogCategory)
              }
            >
              <option value="">All Categories</option>
              {LOG_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {(filters.service || filters.level || filters.category) && (
              <button
                onClick={() => {
                  handleFilterChange('service', '');
                  handleFilterChange('level', '');
                  handleFilterChange('category', '');
                }}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Exclude Panel */}
        {showExcludePanel && (
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-orange-400" />
              <span className="text-white text-sm font-medium">
                Exclude logs containing:
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              <div className="flex-1 flex items-center gap-2 bg-gray-800 border border-gray-700
                              rounded-lg px-3 py-2 focus-within:border-gray-600 transition-colors">
                <input
                  type="text"
                  placeholder="e.g. health-check, token-refresh..."
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500 text-sm"
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addExcludePattern();
                  }}
                />
              </div>
              <button
                onClick={addExcludePattern}
                disabled={!excludeInput.trim()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800
                           disabled:text-gray-600 disabled:cursor-not-allowed text-white
                           rounded-lg transition-colors text-sm font-medium"
              >
                Add
              </button>
            </div>

            {excludePatterns.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {excludePatterns.map((pattern) => (
                  <span
                    key={pattern}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10
                               text-orange-300 border border-orange-500/20 rounded-full text-xs font-medium"
                  >
                    {pattern}
                    <button
                      onClick={() => removeExcludePattern(pattern)}
                      className="hover:text-white transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setExcludePatterns([])}
                  className="text-gray-500 hover:text-white text-xs transition-colors"
                >
                  Clear all
                </button>
              </div>
            ) : (
              <p className="text-gray-600 text-xs">
                No patterns active. Add patterns to hide matching log messages.
              </p>
            )}
          </div>
        )}

        {/* Table */}
        {isLoadingHistorical && mode === 'historical' ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="bg-gray-800/60">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-5 py-3.5 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-widest"
                          style={{ width: header.getSize() }}
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

                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-16 text-center"
                      >
                        <div className="flex flex-col items-center text-gray-500">
                          <FileText size={40} className="mb-3 opacity-30" />
                          <p className="font-medium text-gray-300">
                            No logs found
                          </p>
                          <p className="text-sm mt-1 text-gray-500">
                            {mode === 'realtime'
                              ? 'Waiting for incoming log entries...'
                              : 'Try adjusting your search or filters'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row, i) => {
                      const level = row.original.level;
                      const accent = LEVEL_CONFIG[level]?.rowAccent ?? '';
                      return (
                        <tr
                          key={row.id}
                          className={`border-b border-gray-800 hover:bg-gray-800/50
                            transition-colors ${accent}
                            ${i % 2 === 1 ? 'bg-gray-800/20' : ''}`}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-5 py-3">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {table.getRowModel().rows.length > 0 && (
              <div
                className="px-6 py-4 flex items-center justify-between
                           bg-gray-800/40 border-t border-gray-800"
              >
                {/* Left: count + live indicator */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {mode === 'historical' && historicalData ? (
                    <span>
                      Page{' '}
                      <span className="font-medium text-gray-300">
                        {currentHistoricalPage}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium text-gray-300">
                        {totalPages}
                      </span>{' '}
                      &mdash;{' '}
                      <span className="font-medium text-gray-300">
                        {historicalData.total.toLocaleString()}
                      </span>{' '}
                      total
                    </span>
                  ) : (
                    <span>
                      Showing{' '}
                      <span className="font-medium text-gray-300">
                        {pageStart} – {pageEnd}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium text-gray-300">
                        {filteredTotal.toLocaleString()}
                      </span>{' '}
                      logs
                    </span>
                  )}

                  {mode === 'realtime' && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPaused
                            ? 'bg-amber-400'
                            : 'bg-emerald-400 animate-pulse'
                        }`}
                      />
                      <span className="text-xs">
                        {isPaused ? 'Paused' : 'Live'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Pagination controls */}
                <div className="flex items-center gap-1">
                  {mode === 'historical' && historicalData ? (
                    <>
                      <button
                        onClick={() =>
                          handleHistoricalPageChange(currentHistoricalPage - 1)
                        }
                        disabled={currentHistoricalPage <= 1}
                        className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-700
                                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {(() => {
                        const maxButtons = 5;
                        let start = Math.max(
                          1,
                          currentHistoricalPage - Math.floor(maxButtons / 2)
                        );
                        const end = Math.min(totalPages, start + maxButtons - 1);
                        start = Math.max(1, end - maxButtons + 1);
                        return Array.from(
                          { length: end - start + 1 },
                          (_, idx) => start + idx
                        ).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => handleHistoricalPageChange(pageNum)}
                            className={`w-8 h-8 rounded-md text-sm transition-colors ${
                              currentHistoricalPage === pageNum
                                ? 'bg-brand-primary-600 text-white font-semibold'
                                : 'text-gray-500 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ));
                      })()}

                      <button
                        onClick={() =>
                          handleHistoricalPageChange(currentHistoricalPage + 1)
                        }
                        disabled={currentHistoricalPage >= totalPages}
                        className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-700
                                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-700
                                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {Array.from(
                        { length: Math.min(tablePageCount, 5) },
                        (_, i) => i
                      ).map((pageIndex) => (
                        <button
                          key={pageIndex}
                          onClick={() => table.setPageIndex(pageIndex)}
                          className={`w-8 h-8 rounded-md text-sm transition-colors ${
                            currentTablePage === pageIndex
                              ? 'bg-brand-primary-600 text-white font-semibold'
                              : 'text-gray-500 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          {pageIndex + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-700
                                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoggersPage;
