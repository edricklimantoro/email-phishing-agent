import { useEffect, useRef } from 'react';
import { EmailRecord } from '../types';
import { sanitizeEmailBody } from '../utils/sanitize';
import { Card, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface EmailDetailProps {
  email: EmailRecord;
  onClose: () => void;
}

function statusVariant(status: string): 'safe' | 'destructive' | 'warning' | 'muted' | 'default' {
  switch (status) {
    case 'safe': return 'safe';
    case 'phishing': return 'destructive';
    case 'security_violation': return 'warning';
    case 'pending': return 'muted';
    default: return 'default';
  }
}

export function EmailDetail({ email, onClose }: EmailDetailProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const formatDate = (s: string | null) =>
    s ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s)) : '—';

  return (
    <div ref={containerRef} tabIndex={-1} className="outline-none">
    <Card
      className="mt-2 opacity-0 animate-fade-in"
      role="region"
      aria-label={`Email detail: ${email.subject}`}
    >
      <div className="flex items-start justify-between gap-4 p-6 pb-0">
        <CardTitle className="text-xl font-medium leading-snug">{email.subject}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close detail" className="shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M2 14L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </Button>
      </div>

      <div className="flex flex-col gap-2 p-6">
        <div className="flex items-center gap-4 text-sm">
          <span className="w-[100px] shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">From</span>
          <span className="text-[var(--text-primary)]">{email.sender}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="w-[100px] shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Received</span>
          <span className="text-[var(--text-primary)]">{formatDate(email.received_at)}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="w-[100px] shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Processed</span>
          <span className="text-[var(--text-primary)]">{formatDate(email.processed_at)}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="w-[100px] shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Status</span>
          <Badge variant={statusVariant(email.status)}>{email.status.replace('_', ' ')}</Badge>
        </div>
        {email.guardrail_safe !== null && (
          <div className="flex items-center gap-4 text-sm">
            <span className="w-[100px] shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Guardrail</span>
            <Badge variant={email.guardrail_safe ? 'safe' : 'warning'}>
              {email.guardrail_safe ? 'Safe' : 'Violation'}
            </Badge>
          </div>
        )}
        {email.guardrail_reason && (
          <div className="flex items-center gap-4 text-sm">
            <span className="w-[100px] shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Reason</span>
            <span className="italic text-[var(--text-secondary)]">{email.guardrail_reason}</span>
          </div>
        )}
        {email.classification && (
          <div className="flex items-center gap-4 text-sm">
            <span className="w-[100px] shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Classification</span>
            <Badge variant={statusVariant(email.classification)}>{email.classification}</Badge>
          </div>
        )}
        {email.confidence !== null && (
          <div className="flex items-center gap-4 text-sm">
            <span className="w-[100px] shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Confidence</span>
            <span className="font-[var(--font-mono)] tabular-nums text-[var(--text-primary)]">{(email.confidence * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] p-6 pt-4">
        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Email Body</span>
        <div
          className="max-h-[400px] overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-sm leading-relaxed text-[var(--text-primary)] break-words"
          dangerouslySetInnerHTML={{ __html: sanitizeEmailBody(email.body_text) }}
        />
      </div>
    </Card>
    </div>
  );
}
