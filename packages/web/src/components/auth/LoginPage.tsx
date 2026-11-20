import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api, RateLimitError } from '../../api/client';
import type { InstanceInfoResponse } from '@backspace/shared';
import { SourceCodeLink } from '../ui/SourceCodeLink';
import { describeError } from '../../i18n/errors';

export function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  // AGPL § 13: anonymous users must be able to reach the source of the running
  // version. Fetched from the unauthenticated public info endpoint.
  const [instanceInfo, setInstanceInfo] = useState<InstanceInfoResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.instance.info()
      .then((info) => { if (!cancelled) setInstanceInfo(info); })
      .catch(() => { /* Non-critical — link is simply omitted if unreachable. */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => {
      setRetryAfter((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError(t('auth:validation.usernameRequired'));
      return;
    }
    if (!password) {
      setError(t('auth:validation.passwordRequired'));
      return;
    }

    try {
      await login(username.trim(), password);
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        navigate(redirect);
      } else {
        navigate('/channels/@me');
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRetryAfter(err.retryAfter);
        setError('');
      } else {
        setError(err instanceof Error ? describeError(err) : t('auth:login.failed'));
      }
    }
  };

  const isDisabled = isLoading || retryAfter > 0;

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center bg-surface-base relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(var(--accent-primary)/0.06)_0%,transparent_50%)]" />
      <div className="my-auto flex-shrink-0 w-full max-w-[480px] bg-surface-elevated rounded-md p-8 shadow-elevation-high relative z-10">
        <div className="text-center mb-6">
          <svg
            viewBox="0 0 111.36 63.03"
className="mx-auto mb-4 h-9 w-auto text-txt-primary"
            role="img"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M36.64 51.69c-1.87,0.56 -3.86,0.86 -5.92,0.86 -11.33,0 -20.51,-9.18 -20.51,-20.52 0,-11.33 9.18,-20.52 20.51,-20.52 11.34,0 20.52,9.19 20.52,20.52 0,6.47 0.01,9.07 3.45,15.23 14.61,26.22 61.19,16.69 56.31,-21.13l-30.34 -0.18 0.04 10.83 19.4 0c-4.28,15.45 -23.66,19.49 -33.94,9.46 -7.63,-7.44 -3.02,-11.17 -4.92,-20.45 -2.42,-11.83 -11.67,-24.97 -31.28,-24.61 -18.57,0.35 -33.88,17.71 -29.06,37.8 2.14,8.93 8.05,15.65 14.38,19.1 10.47,5.71 16.19,4.65 27.43,1.71l2.41 3.21 14.61 0.03 -26.65 -34.01 -8.44 6.66 12 16.01z"
            />
            <path
              fill="rgb(var(--accent-primary))"
              d="M80.45 0.01c19.06,-0.38 25.89,13.88 25.89,13.88l-8.83 5.48c0,0 -5.71,-9.45 -17.06,-8.83 -8.37,0.45 -12.76,3.26 -16.5,8.3l-5.57 -9.63c5.63,-5.68 13.44,-9.03 22.07,-9.2z"
            />
            <path
              fill="rgb(var(--accent-primary))"
              d="M30.95 15.46l-4.73 6.84 -5.06 -3.03c-0.11,-0.05 -1.55,0.37 -1.67,0.43l2.66 9.56 1.63 -0.46 2.86 -4.09c1.44,0.88 2.86,1.79 4.31,2.66 1.45,-0.87 2.87,-1.78 4.31,-2.66l2.86 4.09 1.63 0.46 2.66 -9.56c-0.12,-0.06 -1.57,-0.48 -1.67,-0.43l-5.06 3.03 -4.73 -6.84 0 0zm0 9.83l-0.1 0.07c-1.09,-0.67 -2.17,-1.33 -3.24,-2.03l3.34 -4.85 3.34 4.85c-1.07,0.7 -2.15,1.36 -3.24,2.03l-0.1 -0.07zm5.82 -1.53l1.91 2.86c0.16,-0.11 1.21,-4.37 1.36,-4.92l-3.27 2.06zm-11.64 0l-1.91 2.86c-0.17,-0.11 -1.21,-4.37 -1.36,-4.92l3.27 2.06z"
            />
            <polygon
              fill="rgb(var(--accent-primary))"
              points="42.71,59.79 57.19,59.79 59.73,63.03 45.12,63.03"
            />
          </svg>
          <h1 className="text-2xl font-bold text-txt-primary">{t('auth:login.title')}</h1>
          <p className="text-txt-tertiary mt-1">{t('auth:login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {retryAfter > 0 && (
            <div className="mb-4 p-3 bg-accent-amber/10 border border-accent-amber/30 rounded text-sm">
              <p className="font-medium text-accent-amber">{t('auth:login.rateLimited.title')}</p>
              <p className="text-txt-secondary mt-0.5">{t('auth:login.rateLimited.retryIn', { seconds: retryAfter })}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-accent-rose/10 border border-accent-rose/30 rounded text-txt-danger text-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-xs font-bold text-txt-secondary uppercase mb-2">
              {t('common:labels.username')} <span className="text-txt-danger">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-standard w-full py-2.5"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-txt-secondary uppercase mb-2">
              {t('common:labels.password')} <span className="text-txt-danger">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-standard w-full py-2.5"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="w-full py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retryAfter > 0
              ? t('auth:login.rateLimited.retryIn', { seconds: retryAfter })
              : isLoading
                ? t('auth:login.submitting')
                : t('common:actions.logIn')}
          </button>

          <p className="mt-3 text-sm text-txt-tertiary">
            <Trans
              t={t}
              i18nKey="auth:login.registerPrompt"
              components={{
                actionLink: <Link to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-accent-primary hover:underline" />,
              }}
            />
          </p>
        </form>

        {instanceInfo && (
          <div className="mt-6 pt-4 border-t border-white/[0.04] flex justify-center">
            <SourceCodeLink sourceCodeUrl={instanceInfo.sourceCodeUrl} version={instanceInfo.version} commit={instanceInfo.commit} />
          </div>
        )}
      </div>
    </div>
  );
}
