'use client';

import React, { useState } from 'react';
import QRCode from 'qrcode';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import apiClient from '../../../../../lib/api/client';

// ─── API helpers ──────────────────────────────────────────────────────────────

interface TotpStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

interface TotpSetupData {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

async function fetchTotpStatus(): Promise<TotpStatus> {
  const res = await apiClient.get('/auth/admin/totp/status');
  return res.data;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const QrCode = ({ url }: { url: string }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  React.useEffect(() => {
    QRCode.toDataURL(url, { width: 180, margin: 1 })
      .then(setImgSrc)
      .catch(() => setImgSrc(null));
  }, [url]);

  if (!imgSrc) return <div className="w-[180px] h-[180px] bg-slate-800 rounded-xl animate-pulse" />;

  return (
    <img
      src={imgSrc}
      alt="TOTP QR Code"
      width={180}
      height={180}
      className="rounded-xl border border-slate-700/50"
    />
  );
};

// ─── Setup flow ───────────────────────────────────────────────────────────────

const SetupFlow = ({ onDone }: { onDone: () => void }) => {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<'init' | 'scan' | 'confirm' | 'backup'>('init');
  const [setupData, setSetupData] = useState<TotpSetupData | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/auth/admin/totp/setup');
      return res.data as TotpSetupData;
    },
    onSuccess: (data) => {
      setSetupData(data);
      setPhase('scan');
    },
    onError: (error: AxiosError) => {
      toast.error((error.response?.data as { message: string })?.message ?? 'Failed to initiate TOTP setup');
    },
  });

  const enableMutation = useMutation({
    mutationFn: async (token: string) => {
      await apiClient.post('/auth/admin/totp/enable', { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['totp-status'] });
      setPhase('backup');
    },
    onError: (error: AxiosError) => {
      setConfirmError((error.response?.data as { message: string })?.message ?? 'Invalid code');
      setConfirmCode('');
    },
  });

  const handleConfirmChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setConfirmCode(digits);
    setConfirmError('');
    if (digits.length === 6) {
      enableMutation.mutate(digits);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    const text = [
      'TecShop Admin — TOTP Backup Codes',
      'Generated: ' + new Date().toISOString(),
      '',
      'Keep these codes safe. Each can only be used once.',
      '',
      ...setupData.backupCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tecshop-admin-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (phase === 'init') {
    return (
      <div className="text-center">
        <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
          TOTP adds a second factor to your admin login. You will need an authenticator app
          such as Google Authenticator, Authy, or 1Password.
        </p>
        <button
          onClick={() => setupMutation.mutate()}
          disabled={setupMutation.isPending}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          {setupMutation.isPending ? 'Setting up...' : 'Begin setup'}
        </button>
      </div>
    );
  }

  if (phase === 'scan' && setupData) {
    return (
      <div>
        <p className="text-slate-400 text-sm mb-6">
          Scan the QR code with your authenticator app, then enter the 6-digit code below to confirm.
        </p>

        <div className="flex flex-col items-center gap-6 mb-6">
          <QrCode url={setupData.qrCodeUrl} />

          <div className="w-full p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1.5">Manual entry key</p>
            <p className="text-slate-200 text-sm font-mono tracking-wider break-all">{setupData.secret}</p>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="confirm-totp" className="block text-sm font-medium text-slate-300 mb-1.5">
            Confirm with your first code
          </label>
          <input
            id="confirm-totp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={confirmCode}
            onChange={(e) => handleConfirmChange(e.target.value)}
            disabled={enableMutation.isPending}
            maxLength={6}
            autoFocus
            className="w-full bg-slate-800/60 border border-slate-700/70 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all disabled:opacity-60"
          />
          {confirmError && (
            <p className="text-red-400 text-xs mt-1.5">{confirmError}</p>
          )}
          {enableMutation.isPending && (
            <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1.5">
              <span className="w-3 h-3 border border-slate-500 border-t-slate-300 rounded-full animate-spin inline-block" />
              Verifying...
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setPhase('init')}
          className="text-slate-600 hover:text-slate-400 text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (phase === 'backup' && setupData) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3 text-green-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-green-400 text-sm font-medium">TOTP enabled successfully</p>
        </div>

        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-5">
          <p className="text-amber-400 text-xs font-medium mb-1">Save your backup codes now</p>
          <p className="text-slate-400 text-xs">
            These 10 codes let you access your account if you lose your authenticator.
            Each code can only be used once. Store them somewhere safe.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-5">
          {setupData.backupCodes.map((code) => (
            <div key={code} className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/40 rounded-lg font-mono text-xs text-slate-300 text-center">
              {code}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={downloadBackupCodes}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download
          </button>
          <button
            onClick={onDone}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// ─── Disable flow ─────────────────────────────────────────────────────────────

const DisableFlow = ({ onDone }: { onDone: () => void }) => {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const disableMutation = useMutation({
    mutationFn: async (token: string) => {
      await apiClient.delete('/auth/admin/totp', { data: { token } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['totp-status'] });
      toast.success('Two-factor authentication disabled');
      onDone();
    },
    onError: (err: AxiosError) => {
      setError((err.response?.data as { message: string })?.message ?? 'Invalid code');
      setCode('');
    },
  });

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError('');
    if (digits.length === 6) {
      disableMutation.mutate(digits);
    }
  };

  return (
    <div>
      <div className="p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl mb-5">
        <p className="text-red-400 text-xs font-medium mb-0.5">Disabling two-factor authentication</p>
        <p className="text-slate-400 text-xs">Enter your current authenticator code to confirm. Your account will be less secure without 2FA.</p>
      </div>

      <div className="mb-4">
        <label htmlFor="disable-totp" className="block text-sm font-medium text-slate-300 mb-1.5">
          Current authenticator code
        </label>
        <input
          id="disable-totp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disableMutation.isPending}
          maxLength={6}
          autoFocus
          className="w-full bg-slate-800/60 border border-slate-700/70 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/40 transition-all disabled:opacity-60"
        />
        {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
        {disableMutation.isPending && (
          <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1.5">
            <span className="w-3 h-3 border border-slate-500 border-t-slate-300 rounded-full animate-spin inline-block" />
            Verifying...
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onDone}
        className="text-slate-600 hover:text-slate-400 text-xs transition-colors cursor-pointer"
      >
        Cancel
      </button>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const [view, setView] = useState<'idle' | 'setup' | 'disable'>('idle');

  const { data: totpStatus, isLoading } = useQuery({
    queryKey: ['totp-status'],
    queryFn: fetchTotpStatus,
  });

  return (
    <div className="flex-1 p-6 bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Security Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage authentication and account security</p>
      </div>

      {/* TOTP Card */}
      <div className="max-w-lg">
        <div className="bg-gray-800/60 border border-gray-700/60 rounded-2xl overflow-hidden">
          {/* Card header */}
          <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5 text-blue-400 w-[18px] h-[18px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3M10.5 16.5h3" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Two-factor authentication</p>
                <p className="text-slate-500 text-xs mt-0.5">Authenticator app (TOTP)</p>
              </div>
            </div>

            {!isLoading && totpStatus && view === 'idle' && (
              <div className="flex items-center gap-2.5">
                {totpStatus.enabled ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Enabled
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 border border-slate-600/40 rounded-full text-slate-400 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Disabled
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Card body */}
          <div className="px-5 py-5">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-3 bg-slate-700/60 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-700/60 rounded animate-pulse w-1/2" />
              </div>
            ) : view === 'setup' ? (
              <SetupFlow onDone={() => setView('idle')} />
            ) : view === 'disable' ? (
              <DisableFlow onDone={() => setView('idle')} />
            ) : (
              <>
                {totpStatus?.enabled ? (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-slate-300 text-sm">Backup codes remaining</p>
                        <p className="text-2xl font-bold text-white mt-0.5">
                          {totpStatus.backupCodesRemaining}
                          <span className="text-slate-500 text-sm font-normal"> / 10</span>
                        </p>
                        {totpStatus.backupCodesRemaining <= 2 && (
                          <p className="text-amber-400 text-xs mt-1">
                            Running low — consider re-enrolling to regenerate codes.
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setView('disable')}
                      className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                    >
                      Disable two-factor authentication
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-slate-400 text-sm mb-5">
                      Protect your admin account with a second factor. After setup, every login
                      will require a code from your authenticator app.
                    </p>
                    <button
                      onClick={() => setView('setup')}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Enable two-factor authentication
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
