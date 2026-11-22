import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="display text-3xl sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-line bg-surface">
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
