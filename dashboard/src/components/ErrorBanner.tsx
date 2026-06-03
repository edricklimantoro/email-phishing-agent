import { Button } from './ui/button';

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div
      className="flex items-center justify-between border-b border-[var(--color-status-phishing)]/20 bg-[var(--color-status-phishing)]/8 px-6 py-3 text-sm text-[var(--color-status-phishing)]"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-3">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span className="font-medium">Unable to fetch data.</span>
        <span className="text-[var(--color-status-phishing)]/70">{error}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss error" className="h-7 w-7 shrink-0 text-[var(--color-status-phishing)]/60 hover:text-[var(--color-status-phishing)] hover:bg-[var(--color-status-phishing)]/10">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </Button>
    </div>
  );
}
