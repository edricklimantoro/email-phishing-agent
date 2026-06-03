import { useState, useCallback } from 'react';
import { usePollApi } from './hooks/usePollApi';
import { useTheme } from './hooks/useTheme';
import { StatsResponse, EmailListResponse } from './types';
import { MetricsBar } from './components/MetricsBar';
import { ClassificationChart } from './components/ClassificationChart';
import { EmailTable } from './components/EmailTable';
import { ErrorBanner } from './components/ErrorBanner';

const POLL_INTERVAL = 60_000;

function buildEmailsUrl(page: number, pageSize: number, status: string | null) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (status) params.set('status', status);
  return `/api/emails?${params}`;
}

export default function App() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const stats = usePollApi<StatsResponse>('/api/stats', POLL_INTERVAL);
  const emailsUrl = buildEmailsUrl(page, 25, statusFilter);
  const emails = usePollApi<EmailListResponse>(emailsUrl, POLL_INTERVAL);

  const error = stats.error || emails.error;

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
  }, []);

  const handleStatusFilter = useCallback((s: string | null) => {
    setStatusFilter(s);
    setPage(1);
  }, []);

  const handleDismissError = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1 className="app-title">Email Security Dashboard</h1>
        <div className="header-right">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          <span className="live-badge">
            <span className="live-dot" />
            Live · 60s
          </span>
        </div>
      </header>

      {!bannerDismissed && <ErrorBanner error={error} onDismiss={handleDismissError} />}

      <main className="app-main">
        <aside className="chart-sidebar">
          <ClassificationChart stats={stats.data} />
        </aside>

        <section className="content-area">
          <MetricsBar stats={stats.data} />
          <EmailTable
            emails={emails.data}
            loading={emails.loading}
            onPageChange={handlePageChange}
            onStatusFilter={handleStatusFilter}
            currentStatus={statusFilter}
          />
        </section>
      </main>
    </div>
  );
}
