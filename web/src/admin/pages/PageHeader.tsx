import type { ReactNode } from 'react';
export function PageHeader({ title, intro, actions }: { title: string; intro?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-4 pt-6 sm:px-8">
      <div><h1 className="text-2xl font-bold text-fg">{title}</h1>{intro && <p className="mt-1 max-w-2xl text-sm text-muted">{intro}</p>}</div>
      {actions}
    </div>
  );
}
