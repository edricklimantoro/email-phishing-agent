import { StatsResponse } from '../types';

interface MetricsBarProps {
  stats: StatsResponse | null;
}

export function MetricsBar({ stats }: MetricsBarProps) {
  const total = stats?.total ?? 0;
  const safe = stats?.safe ?? 0;
  const phishing = stats?.phishing ?? 0;
  const violations = stats?.security_violation ?? 0;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-12" role="region" aria-label="Email metrics summary">
      {/* Hero metric: Total */}
      <div
        className="group relative overflow-hidden rounded-2xl bg-[var(--bg-secondary)] p-8 opacity-0 animate-scale-in md:col-span-5 md:row-span-2"
        aria-label={`Total emails: ${total}`}
      >
        <div className="relative z-10">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">Total Emails</p>
          <p className="mt-2 text-6xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums md:text-7xl">
            {stats ? new Intl.NumberFormat().format(total) : '—'}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">analyzed this session</p>
        </div>
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--color-grape-soda)]/20 transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-[var(--color-blush-rose)]/10" />
      </div>

      {/* Status cards */}
      <div
        className="group rounded-2xl border border-[var(--status-safe)]/20 bg-[var(--status-safe)]/5 p-6 transition-all duration-200 hover:border-[var(--status-safe)]/40 hover:bg-[var(--status-safe)]/10 opacity-0 animate-fade-in stagger-1 md:col-span-7"
        aria-label={`Safe emails: ${safe}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--status-safe)]">Safe</p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-[var(--text-primary)]">
              {stats ? new Intl.NumberFormat().format(safe) : '—'}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--status-safe)]/10">
            <svg className="h-5 w-5 text-[var(--status-safe)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      <div
        className="group rounded-2xl border border-[var(--status-phishing)]/20 bg-[var(--status-phishing)]/5 p-6 transition-all duration-200 hover:border-[var(--status-phishing)]/40 hover:bg-[var(--status-phishing)]/10 opacity-0 animate-fade-in stagger-2 md:col-span-3"
        aria-label={`Phishing emails: ${phishing}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--status-phishing)]">Phishing</p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-[var(--text-primary)]">
              {stats ? new Intl.NumberFormat().format(phishing) : '—'}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--status-phishing)]/10">
            <svg className="h-5 w-5 text-[var(--status-phishing)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
      </div>

      <div
        className="group rounded-2xl border border-[var(--status-violation)]/20 bg-[var(--status-violation)]/5 p-6 transition-all duration-200 hover:border-[var(--status-violation)]/40 hover:bg-[var(--status-violation)]/10 opacity-0 animate-fade-in stagger-3 md:col-span-4"
        aria-label={`Security violations: ${violations}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--status-violation)]">Violations</p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-[var(--text-primary)]">
              {stats ? new Intl.NumberFormat().format(violations) : '—'}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--status-violation)]/10">
            <svg className="h-5 w-5 text-[var(--status-violation)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
