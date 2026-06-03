import { cn } from '@/lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ children }: TabsProps) {
  return <div role="tablist" className="flex gap-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">{children}</div>;
}

interface TabProps {
  value: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function Tab({ active, onClick, children }: TabProps) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-sm px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
      )}
    >
      {children}
    </button>
  );
}
