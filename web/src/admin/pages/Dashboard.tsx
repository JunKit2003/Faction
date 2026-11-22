import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Clock, FileText, Image, ImageOff, MessageCircle, Store, Home } from 'lucide-react';
import { DAYS, formatHours, isOpenAt, shopClock } from '@faction/shared';
import { fetchContent } from '../../api';
import { api, type AuditItem, type Me } from '../api';
import { useLibrary } from '../media';
import { ACTION_LABELS, describeTarget } from './Audit';
import { PageHeader, Panel } from '../ui';

const QUICK = [
  { to: '/admin/shop/hours', label: 'Change opening hours', icon: Clock },
  { to: '/admin/homepage/hero', label: 'Edit the top banner', icon: Home },
  { to: '/admin/photos', label: 'Upload photos', icon: Image },
  { to: '/admin/pages/faq', label: 'Edit the FAQ', icon: FileText },
  { to: '/admin/shop/basics', label: 'Shop details', icon: Store },
  { to: '/admin/pages/contact', label: 'Contact page', icon: MessageCircle },
];

const ago = (iso: string) => {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export function Dashboard({ me }: { me: Me }) {
  const content = useQuery({ queryKey: ['content'], queryFn: fetchContent });
  const audit = useQuery({ queryKey: ['audit', 'recent'], queryFn: () => api<{ items: AuditItem[]; total: number }>('GET', '/api/admin/audit?pageSize=7') });
  const lib = useLibrary();
  const site = content.data?.sections.site;
  const now = new Date();
  const open = site ? isOpenAt(site.hours, now) : false;
  const today = site ? site.hours[shopClock(now).day] : undefined;
  const missingAlt = (lib.data ?? []).filter((m) => m.usedIn.length && !m.alt.trim()).length;
  const hour = Number(shopClock(now).time.slice(0, 2));
  const greet = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={`${greet}, ${me.name.split(' ')[0]}`} title="Dashboard" description="Your website at a glance. Every change goes live as soon as you save it." />
      <div className="grid gap-5 lg:grid-cols-3">
        <section className={`relative overflow-hidden rounded-[22px] p-6 ${open ? 'bg-accent text-on-accent' : 'border border-line bg-surface'}`}>
          <p className="mono text-[11px] uppercase tracking-[0.18em] opacity-75">Right now (KL time)</p>
          <p className="display mt-3 text-4xl">{site ? (open ? site.labels.open : site.labels.closed) : '…'}</p>
          <p className="mt-3 text-sm opacity-80">
            {today ? (today.closed ? 'Closed all day today.' : `Today ${today.open}–${today.close}.`) : ''}
          </p>
          <Link to="/admin/shop/hours" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">Edit hours <ArrowUpRight className="h-4 w-4" /></Link>
        </section>
        <Panel title="This week" description="As shown on the website">
          <ul className="flex flex-col gap-1.5 text-sm">{site ? formatHours(site.hours).map((l) => <li key={l}>{l}</li>) : null}</ul>
          <p className="mt-3 text-xs text-muted">{site ? `${DAYS.filter((d) => !site.hours[d].closed).length} days open` : ''}</p>
        </Panel>
        <Panel title="Photos" description={`${lib.data?.length ?? '…'} in the library`}>
          {missingAlt ? (
            <Link to="/admin/photos" className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-3 text-sm hover:bg-amber-500/15">
              <ImageOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span><strong>{missingAlt}</strong> photo{missingAlt === 1 ? '' : 's'} on the site {missingAlt === 1 ? 'has' : 'have'} no description. Descriptions help Google and screen readers.</span>
            </Link>
          ) : <p className="text-sm text-muted">Every photo on the site has a description. Nice.</p>}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Panel title="Quick actions">
          <ul className="grid gap-2 sm:grid-cols-2">
            {QUICK.map((q) => (
              <li key={q.to}>
                <Link to={q.to} className="group flex items-center gap-3 rounded-2xl border border-line p-3 text-sm font-medium transition hover:border-accent">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-fg/5 transition group-hover:bg-accent group-hover:text-on-accent"><q.icon className="h-4 w-4" /></span>
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent activity" actions={<Link to="/admin/activity" className="text-xs font-semibold text-accent-ink hover:underline">See all</Link>}>
          <ul className="flex flex-col divide-y divide-line">
            {(audit.data?.items ?? []).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-fg/5 text-xs font-bold">{a.userEmail.slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 flex-1 truncate"><span className="font-medium">{a.userEmail.split('@')[0]}</span> <span className="text-muted">{(ACTION_LABELS[a.action] ?? a.action).toLowerCase()}</span> {describeTarget(a, [])}</span>
                <span className="mono shrink-0 text-[11px] text-muted">{ago(a.at)}</span>
              </li>
            ))}
            {audit.data && !audit.data.items.length && <li className="py-3 text-sm text-muted">Nothing yet.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
