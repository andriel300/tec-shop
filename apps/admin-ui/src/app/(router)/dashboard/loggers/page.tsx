'use client';

import { useMemo, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { useLoggerSocket } from '../../../../hooks/useLoggerSocket';
import { useLogs, useLogStats, useLogServices } from '../../../../hooks/useLogs';
import { downloadLogsAsFile } from '../../../../lib/api/logs';
import type {
  LogEntry,
  LogLevel,
  LogCategory,
  LogQueryParams,
} from '../../../../lib/api/logs';
import { Breadcrumb } from '../../../../shared/components/navigation/Breadcrumb';
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

const levelColors: Record<LogLevel, string> = {
  debug: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  warn: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  fatal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const levelIcons: Record<LogLevel, React.ComponentType<{ size?: number }>> = {
  debug: Bug,
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  fatal: XCircle,
};

const categoryColors: Record<LogCategory, string> = {
  auth: 'text-cyan-400',
  user: 'text-green-400',
  seller: 'text-orange-400',
  product: 'text-pink-400',
  order: 'text-purple-400',
  system: 'text-gray-400',
  security: 'text-red-400',
  payment: 'text-yellow-400',
};

const LoggersPage = () => {
  const [mode, setMode] = useState<'realtime' | 'historical'>('realtime');
  const [filters, setFilters] = useState<LogQueryParams>({
    page: 1,
    limit: 50,
  });
  const [globalFilter, setGlobalFilter] = useState('');

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

  const { data: historicalData, isLoading: isLoadingHistorical, refetch } = useLogs(
    mode === 'historical' ? filters : undefined
  );

  const { data: statsData } = useLogStats();
  const { data: servicesData } = useLogServices();

  const logs = mode === 'realtime' ? realtimeLogs : (historicalData?.logs || []);

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
    } catch (error) {
      toast.error('Failed to download logs');
    }
  }, [filters]);

  const columns = useMemo<ColumnDef<LogEntry>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Time',
        size: 180,
        cell: ({ row }) => {
          const date = new Date(row.original.timestamp);
          return (
            <span className="text-gray-300 text-xs font-mono">
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
        size: 100,
        cell: ({ row }) => {
          const level = row.original.level;
          const Icon = levelIcons[level];
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${levelColors[level]}`}
            >
              <Icon size={12} />
              {level.toUpperCase()}
            </span>
          );
        },
      },
      {
        accessorKey: 'service',
        header: 'Service',
        size: 120,
        cell: ({ row }) => (
          <span className="text-white text-sm font-medium">
            {row.original.service}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        size: 100,
        cell: ({ row }) => (
          <span
            className={`text-sm font-medium ${categoryColors[row.original.category]}`}
          >
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: 'message',
        header: 'Message',
        cell: ({ row }) => (
          <span className="text-gray-200 text-sm truncate max-w-md block">
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
            <span className="text-gray-400 text-xs font-mono">
              {row.original.userId.slice(-8)}
            </span>
          ) : (
            <span className="text-gray-600 text-xs">-</span>
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

  return (
    <div className="w-full min-h-screen p-8">
      <div className="mb-6">
        <h2 className="text-3xl text-white font-bold mb-2">System Logs</h2>
        <Breadcrumb title="Loggers" items={[]} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Logs</p>
              <p className="text-2xl font-bold text-white">
                {statsData?.totalLogs?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FileText size={20} className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Errors</p>
              <p className="text-2xl font-bold text-red-400">
                {(statsData?.byLevel?.error || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <AlertCircle size={20} className="text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Warnings</p>
              <p className="text-2xl font-bold text-yellow-400">
                {(statsData?.byLevel?.warn || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <AlertTriangle size={20} className="text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Connection</p>
              <p className="text-lg font-bold flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi size={18} className="text-green-400" />
                    <span className="text-green-400">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={18} className="text-gray-400" />
                    <span className="text-gray-400">Offline</span>
                  </>
                )}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${isConnected ? 'bg-green-500/20' : 'bg-gray-500/20'}`}
            >
              {isConnected ? (
                <Wifi size={20} className="text-green-400" />
              ) : (
                <WifiOff size={20} className="text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col lg:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('realtime')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'realtime'
                ? 'bg-brand-primary text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Real-time
          </button>
          <button
            onClick={() => setMode('historical')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'historical'
                ? 'bg-brand-primary text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Historical
          </button>
        </div>

        <div className="flex-1 flex items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search logs..."
            className="w-full bg-transparent text-white outline-none placeholder-gray-500"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <select
          className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700 outline-none"
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
          className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700 outline-none"
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
          className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700 outline-none"
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

        <div className="flex gap-2">
          {mode === 'realtime' && (
            <>
              <button
                onClick={togglePause}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isPaused
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                }`}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Clear
              </button>
            </>
          )}
          {mode === 'historical' && (
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          )}
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-brand-primary hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        {isLoadingHistorical && mode === 'historical' ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="bg-gray-800 border-b border-gray-700"
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
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
                <tbody className="divide-y divide-gray-800">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-12 text-center"
                      >
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FileText size={48} className="mb-4 opacity-50" />
                          <p className="text-lg font-medium">No logs found</p>
                          <p className="text-sm mt-1">
                            {mode === 'realtime'
                              ? 'Waiting for new log entries...'
                              : 'Try adjusting your filters'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
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

            {table.getRowModel().rows.length > 0 && (
              <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>
                    Showing{' '}
                    <span className="font-medium text-white">
                      {table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-white">
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                      )}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-white">
                      {mode === 'historical' && historicalData
                        ? historicalData.total
                        : table.getFilteredRowModel().rows.length}
                    </span>{' '}
                    logs
                  </span>
                  {mode === 'realtime' && (
                    <span className="ml-4 flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`}
                      />
                      {isPaused ? 'Paused' : 'Live'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(table.getPageCount(), 5) },
                      (_, i) => i
                    ).map((pageIndex) => (
                      <button
                        key={pageIndex}
                        onClick={() => table.setPageIndex(pageIndex)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          table.getState().pagination.pageIndex === pageIndex
                            ? 'bg-brand-primary text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {pageIndex + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
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
