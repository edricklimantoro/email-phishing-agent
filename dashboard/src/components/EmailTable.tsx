import { useState } from 'react';
import { EmailListResponse } from '../types';
import { EmailDetail } from './EmailDetail';
import { Badge } from './ui/badge';
import { Tabs, Tab } from './ui/tabs';
import { Button } from './ui/button';

interface EmailTableProps {
  emails: EmailListResponse | null;
  loading: boolean;
  onPageChange: (page: number) => void;
  onStatusFilter: (status: string | null) => void;
  currentStatus: string | null;
}

type SortDir = 'asc' | 'desc';

const STATUS_FILTERS = [
  { value: null, label: 'All' },
  { value: 'safe', label: 'Safe' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'security_violation', label: 'Violations' },
  { value: 'pending', label: 'Pending' },
];

function statusVariant(status: string): 'safe' | 'destructive' | 'warning' | 'muted' | 'default' {
  switch (status) {
    case 'safe': return 'safe';
    case 'phishing': return 'destructive';
    case 'security_violation': return 'warning';
    case 'pending': return 'muted';
    default: return 'default';
  }
}

export function EmailTable({ emails, loading, onPageChange, onStatusFilter, currentStatus }: EmailTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleRowClick = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSort = () => {
    setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
  };

  const formatDate = (s: string | null) =>
    s ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s)) : '—';

  const formatConfidence = (c: number | null) =>
    c !== null ? `${(c * 100).toFixed(0)}%` : '—';

  if (loading && !emails) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3" aria-label="Loading emails">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[110px_200px_1fr_120px_160px] gap-4 rounded-xl bg-[var(--bg-secondary)] p-5">
              <div className="h-4 animate-pulse rounded-lg bg-[var(--text-primary)]/5" />
              <div className="h-4 animate-pulse rounded-lg bg-[var(--text-primary)]/5" />
              <div className="h-4 animate-pulse rounded-lg bg-[var(--text-primary)]/5" />
              <div className="h-4 animate-pulse rounded-lg bg-[var(--text-primary)]/5" />
              <div className="h-4 animate-pulse rounded-lg bg-[var(--text-primary)]/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 opacity-0 animate-fade-in stagger-4">
      <div className="flex items-center justify-between py-3">
        <Tabs value={currentStatus ?? 'all'} onValueChange={(v) => onStatusFilter(v === 'all' ? null : v)}>
          {STATUS_FILTERS.map((f) => (
            <Tab
              key={f.value ?? 'all'}
              value={f.value ?? 'all'}
              active={currentStatus === f.value}
              onClick={() => onStatusFilter(f.value)}
            >
              {f.label}
            </Tab>
          ))}
        </Tabs>
      </div>

      {emails && emails.emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-[var(--accent-primary)]/10 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--bg-secondary)]">
              <svg className="h-10 w-10 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No emails analyzed yet</h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">Emails will appear here as they are processed by the detection pipeline.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
            <table className="w-full border-collapse text-sm" role="grid" aria-label="Email analysis results">
              <thead>
                <tr>
                  <th className="w-[110px] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                  <th className="w-[200px] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Sender</th>
                  <th className="min-w-[200px] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Subject</th>
                  <th className="w-[120px] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Confidence</th>
                  <th
                    className="w-[160px] cursor-pointer select-none px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    onClick={handleSort}
                    role="columnheader"
                    aria-sort={sortDir === 'desc' ? 'descending' : 'ascending'}
                  >
                    Processed
                    <span className="ml-1 text-[10px]">{sortDir === 'desc' ? ' ↓' : ' ↑'}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {emails?.emails.map((email) => (
                  <tr
                    key={email.message_id}
                    className={`cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-secondary)] ${expandedId === email.message_id ? 'bg-[var(--bg-secondary)]' : ''}`}
                    onClick={() => handleRowClick(email.message_id)}
                  >
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant(email.status)}>
                        {email.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-3.5 font-medium text-[var(--text-primary)]" title={email.sender}>
                      {email.sender.length > 30 ? email.sender.slice(0, 30) + '…' : email.sender}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-3.5 text-[var(--text-primary)]" title={email.subject}>
                      {email.subject.length > 50 ? email.subject.slice(0, 50) + '…' : email.subject}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-[72px] overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                          <div
                            className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500 ease-out"
                            style={{ width: email.confidence !== null ? `${email.confidence * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="w-10 text-right font-[var(--font-mono)] text-sm tabular-nums text-[var(--text-secondary)]">{formatConfidence(email.confidence)}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-[var(--font-mono)] text-sm tabular-nums text-[var(--text-secondary)]">
                      {formatDate(email.processed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {expandedId && emails?.emails.find((e) => e.message_id === expandedId) && (
            <EmailDetail
              email={emails.emails.find((e) => e.message_id === expandedId)!}
              onClose={() => setExpandedId(null)}
            />
          )}

          {emails && emails.total > emails.page_size && (
            <div className="flex items-center justify-center gap-4 py-6">
              <Button
                variant="outline"
                size="sm"
                disabled={emails.page <= 1}
                onClick={() => onPageChange(emails.page - 1)}
              >
                Previous
              </Button>
              <span className="font-[var(--font-mono)] text-sm tabular-nums text-[var(--text-secondary)]">
                Page {emails.page} of {Math.ceil(emails.total / emails.page_size)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={emails.page >= Math.ceil(emails.total / emails.page_size)}
                onClick={() => onPageChange(emails.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
