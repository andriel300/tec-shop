'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { generateOtp, verifyOtp, verifyEmail, registerUser } from '../../lib/api/auth';

interface OtpFormProps {
  email?: string;
  name?: string;
  password?: string;
  flow: 'login' | 'signup';
}

export function OtpForm({ email: initialEmail, name, password, flow }: OtpFormProps) {
  const [email, setEmail] = useState(initialEmail || '');
  const [formStage, setFormStage] = useState(flow === 'login' ? 'generate' : 'verify');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const generateOtpMutation = useMutation({
    mutationFn: generateOtp,
    onSuccess: (data, variables) => {
      setEmail(variables.email);
      setFormStage('verify');
      toast.info(data?.message || 'An OTP has been sent to your email.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Login successful!');
      router.push('/');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast.info(data?.message || 'A new OTP has been sent to your email.');
      setTimer(60);
      setCanResend(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Account created successfully!');
      router.push('/');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const generateForm = useForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value }) => generateOtpMutation.mutate(value),
  });

  const verifyForm = useForm({
    defaultValues: { otp: '' },
    onSubmit: async ({ value }) => {
      if (flow === 'login') {
        verifyOtpMutation.mutate({ email, otp: value.otp });
      } else {
        verifyEmailMutation.mutate({ email, name: name || '', password: password || '', otp: value.otp });
      }
    },
  });

  useEffect(() => {
    if (formStage === 'verify') {
      inputRefs.current[0]?.focus();
      setTimer(60);
      setCanResend(false);
    }
  }, [formStage, email]);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleResend = () => {
    if (canResend) {
      if (flow === 'login') {
        generateOtpMutation.mutate({ email });
      } else {
        resendOtpMutation.mutate({ email, name: name || '', password: password || '' });
      }
    }
  };

  if (formStage === 'verify') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          verifyForm.handleSubmit();
        }}
        className="space-y-4"
      >
        <p className="text-sm text-center text-text-secondary">
          An OTP has been sent to <strong>{email}</strong>. Please enter it below.
        </p>
        <div className="flex justify-between items-center text-sm text-text-secondary">
          <span>
            Resend in: {Math.floor(timer / 60)}:{('0' + (timer % 60)).slice(-2)}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || generateOtpMutation.isPending || resendOtpMutation.isPending}
            className="font-medium text-brand-primary hover:underline disabled:text-text-muted disabled:no-underline"
          >
            Resend OTP
          </button>
        </div>
        <verifyForm.Field
          name="otp"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'OTP is required';
              if (value.length < 6) return 'OTP must be 6 digits';
              return undefined;
            },
          }}
        >
          {(field) => {
            const handleKeyDown = (
              e: React.KeyboardEvent<HTMLInputElement>,
              index: number
            ) => {
              if (e.key === 'Backspace' && !field.state.value[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
              }
            };

            const handleInputChange = (
              e: React.ChangeEvent<HTMLInputElement>,
              index: number
            ) => {
              const { value } = e.target;
              const otp = field.state.value.split('');
              otp[index] = value;
              field.handleChange(otp.join(''));

              if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
              }
            };

            const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
              const paste = e.clipboardData.getData('text');
              if (paste.length === 6 && /\d{6}/.test(paste)) {
                field.handleChange(paste);
                inputRefs.current.forEach((ref, i) => {
                  if (ref) {
                    ref.value = paste[i];
                  }
                });
                inputRefs.current[5]?.focus();
              }
            };

            return (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-text-secondary"
                >
                  One-Time Password
                </label>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {Array(6)
                    .fill(null)
                    .map((_, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        id={`${field.name}-${i}`}
                        name={`${field.name}-${i}`}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={field.state.value[i] || ''}
                        onChange={(e) => handleInputChange(e, i)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        onFocus={(e) => e.target.select()}
                        className="w-12 h-12 text-center border rounded-md border-ui-divider focus:ring-brand-primary focus:border-brand-primary"
                      />
                    ))}
                </div>
                {field.state.meta.errors.length > 0 ? (
                  <em className="text-sm text-feedback-error">
                    {field.state.meta.errors[0]}
                  </em>
                ) : null}
              </div>
            );
          }}
        </verifyForm.Field>
        {(verifyOtpMutation.error || verifyEmailMutation.error) && (
          <div className="p-3 text-sm text-center text-white bg-feedback-error rounded-md">
            {verifyOtpMutation.error?.message || verifyEmailMutation.error?.message}
          </div>
        )}
        <button
          type="submit"
          disabled={verifyOtpMutation.isPending || verifyEmailMutation.isPending}
          className="w-full py-2 text-white transition-colors rounded-md bg-brand-primary hover:bg-brand-primary-800 disabled:bg-gray-400 flex items-center justify-center"
        >
          {verifyOtpMutation.isPending || verifyEmailMutation.isPending ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Verifying...
            </>
          ) : (
            flow === 'login' ? 'Sign In with OTP' : 'Verify & Create Account'
          )}
        </button>
        {flow === 'login' && (
          <button
            type="button"
            onClick={() => setFormStage('generate')}
            className="w-full py-2 text-brand-primary hover:underline text-sm"
          >
            Change Email
          </button>
        )}
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        generateForm.handleSubmit();
      }}
      className="space-y-4"
    >
      <generateForm.Field
        name="email"
        validators={{
          onChange: ({ value }) =>
            !value ? 'An email is required' : undefined,
        }}
      >
        {(field) => (
          <div>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-text-secondary"
            >
              Email Address
            </label>
            <input
              id={field.name}
              name={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md border-ui-divider focus:ring-brand-primary focus:border-brand-primary"
              placeholder="you@example.com"
              autoFocus
            />
            {field.state.meta.errors.length > 0 ? (
              <em className="text-sm text-feedback-error">
                {field.state.meta.errors[0]}
              </em>
            ) : null}
          </div>
        )}
      </generateForm.Field>
      {generateOtpMutation.error && (
        <div className="p-3 text-sm text-center text-white bg-feedback-error rounded-md">
          {generateOtpMutation.error.message}
        </div>
      )}
      <button
        type="submit"
        disabled={generateOtpMutation.isPending}
        className="w-full py-2 text-white transition-colors rounded-md bg-brand-primary hover:bg-brand-primary-800 disabled:bg-gray-400 flex items-center justify-center"
      >
        {generateOtpMutation.isPending ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            Sending OTP...
          </>
        ) : (
          'Send OTP'
        )}
      </button>
    </form>
  );
}
