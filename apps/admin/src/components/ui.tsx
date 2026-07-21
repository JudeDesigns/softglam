import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn('p-5', accent && 'bg-indigo-600 border-indigo-700 text-white')}>
      <p className={cn('text-xs font-medium uppercase tracking-wide', accent ? 'text-indigo-200' : 'text-gray-400')}>
        {label}
      </p>
      <p className={cn('mt-1 text-2xl font-bold tracking-tight', accent ? 'text-white' : 'text-gray-900')}>
        {value}
      </p>
      {sub && (
        <p className={cn('mt-1 text-xs', accent ? 'text-indigo-200' : 'text-gray-400')}>
          {sub}
        </p>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
const BADGE_VARIANTS: Record<string, string> = {
  booked:     'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  confirmed:  'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  completed:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  cancelled:  'bg-red-50 text-red-600 ring-1 ring-red-100',
  no_show:    'bg-gray-100 text-gray-500',
  pending:    'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  viewed:     'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
  quoted:     'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  declined:   'bg-red-50 text-red-600 ring-1 ring-red-100',
  sent:       'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  accepted:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  expired:    'bg-gray-100 text-gray-400',
  client:     'bg-pink-50 text-pink-700 ring-1 ring-pink-100',
  artist:     'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  admin:      'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
};

export function Badge({ label }: { label: string }) {
  const cls = BADGE_VARIANTS[label.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize', cls)}>
      {label.replace(/_/g, ' ')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const letter = name.charAt(0).toUpperCase();
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  return (
    <div
      className={cn(
        'rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center flex-shrink-0',
        sizes[size],
      )}
    >
      {letter}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------
export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={cn('hover:bg-gray-50 transition-colors', onClick && 'cursor-pointer')}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 text-gray-700', className)}>{children}</td>;
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------
export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {sub && <p className="text-sm text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading / Error / Empty states
// ---------------------------------------------------------------------------
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-gray-300">
        <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-gray-300">
        <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4" strokeLinecap="round" />
      </svg>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { label, className, ...rest } = props;
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
      <input
        className={cn(
          'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors',
          className,
        )}
        {...rest}
      />
    </div>
  );
}
