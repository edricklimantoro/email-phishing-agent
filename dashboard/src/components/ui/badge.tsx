import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'safe' | 'destructive' | 'warning' | 'muted';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
    safe: 'bg-[var(--status-safe)]/10 text-[var(--status-safe)]',
    destructive: 'bg-[var(--status-phishing)]/10 text-[var(--status-phishing)]',
    warning: 'bg-[var(--status-violation)]/10 text-[var(--status-violation)]',
    muted: 'bg-[var(--status-pending)]/10 text-[var(--status-pending)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
