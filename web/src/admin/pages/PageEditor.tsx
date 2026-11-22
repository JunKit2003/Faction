import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Eye, EyeOff, Loader2, RotateCcw } from 'lucide-react';
import { SECTION_LABELS, type PublicContent, type SectionKey } from '@faction/shared';
import { sectionSchemas } from '@faction/shared/schemas';
import { fetchContent } from '../../api';
import { api, ApiError } from '../api';
import { useLibrary } from '../media';
import { FormRenderer } from '../form/FormRenderer';
import type { Issues } from '../form/fields';
import { ADMIN_PAGES, fieldsForCard, sectionsInPage, type TabDef } from '../structure';
import { Preview, SeoPreview } from '../Preview';
import { useUnsaved } from '../useUnsaved';
import { useToast } from '../Toast';
import { PageHeader, Panel } from '../ui';

interface Loaded { key: SectionKey; data: unknown; version: number }
type Base = Record<string, { json: string; version: number }>;

const tabHasIssues = (tab: TabDef, issues: Partial<Record<SectionKey, Issues>>) =>
  tab.cards.some((c) => Object.keys(issues[c.section] ?? {}).some((p) => c.fields.some((f) => p === f || p.startsWith(f + '.'))));

/** One admin page (e.g. "Homepage"): tabs of cards, one Save for everything on the page. */
export function PageEditor({ pageId }: { pageId: string }) {
  const page = ADMIN_PAGES.find((p) => p.id === pageId)!;
  const params = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const tab = page.tabs.find((t) => t.id === params.tab) ?? page.tabs[0]!;
  const keys = useMemo(() => sectionsInPage(page), [page]);

  const results = useQueries({ queries: keys.map((k) => ({ queryKey: ['section', k], queryFn: () => api<Loaded>('GET', `/api/admin/sections/${k}`), refetchOnWindowFocus: false })) });
  const content = useQuery({ queryKey: ['content'], queryFn: fetchContent });
  const library = useLibrary();

  const [drafts, setDrafts] = useState<Partial<Record<SectionKey, unknown>>>({});
  const [base, setBase] = useState<Base>({});
  const [issues, setIssues] = useState<Partial<Record<SectionKey, Issues>>>({});
  const [conflicts, setConflicts] = useState<Partial<Record<SectionKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Adopt freshly loaded sections (first load, or after "reload their version").
  const loadedSig = results.map((r) => (r.data ? `${r.data.key}@${r.data.version}` : '')).join('|');
  useEffect(() => {
    for (const r of results) {
      const d = r.data;
      if (!d) continue;
      setBase((b) => (b[d.key]?.version === d.version ? b : { ...b, [d.key]: { json: JSON.stringify(d.data), version: d.version } }));
      setDrafts((dr) => (dr[d.key] !== undefined && base[d.key]?.version === d.version ? dr : { ...dr, [d.key]: d.data }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedSig]);

  const ready = keys.every((k) => drafts[k] !== undefined && base[k]);
  const dirtyKeys = ready ? keys.filter((k) => JSON.stringify(drafts[k]) !== base[k]!.json) : [];
  const dirty = dirtyKeys.length > 0;
  useUnsaved(dirty);

  const previewContent = useMemo<PublicContent | undefined>(() => {
    if (!content.data || !ready) return undefined;
    const media = { ...content.data.media };
    for (const m of library.data ?? []) media[m.id] = m;
    return { ...content.data, media, sections: { ...content.data.sections, ...drafts } } as PublicContent;
  }, [content.data, library.data, drafts, ready]);

  const save = async () => {
    const nextIssues: Partial<Record<SectionKey, Issues>> = {};
    const parsed: Partial<Record<SectionKey, unknown>> = {};
    for (const k of dirtyKeys) {
      const r = sectionSchemas[k].safeParse(drafts[k]);
      if (r.success) parsed[k] = r.data;
      else nextIssues[k] = Object.fromEntries(r.error.issues.map((i) => [i.path.map(String).join('.'), i.message]));
    }
    setIssues(nextIssues);
    if (Object.keys(nextIssues).length) {
      toast({ tone: 'error', text: 'Please fix the highlighted fields.' });
      const bad = page.tabs.find((t) => tabHasIssues(t, nextIssues));
      if (bad && bad.id !== tab.id) navigate(`/admin/${page.id}/${bad.id}`, { replace: true });
      return;
    }
    setSaving(true);
    let ok = 0;
    const nextConflicts: Partial<Record<SectionKey, string>> = {};
    for (const k of dirtyKeys) {
      try {
        const res = await api<{ version: number }>('PUT', `/api/admin/sections/${k}`, { data: parsed[k], version: base[k]!.version });
        setBase((b) => ({ ...b, [k]: { json: JSON.stringify(drafts[k]), version: res.version } }));
        qc.setQueryData(['section', k], { key: k, data: drafts[k], version: res.version });
        ok++;
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) nextConflicts[k] = e.message;
        else if (e instanceof ApiError && e.status === 422) nextIssues[k] = Object.fromEntries((e.body.issues ?? []).map((i) => [i.path, i.message]));
        else nextConflicts[k] = e instanceof Error ? e.message : 'Save failed.';
      }
    }
    setSaving(false);
    setIssues(nextIssues);
    setConflicts(nextConflicts);
    if (ok) {
      void qc.invalidateQueries({ queryKey: ['content'] });
      void qc.invalidateQueries({ queryKey: ['audit'] });
    }
    if (Object.keys(nextConflicts).length || Object.keys(nextIssues).length) toast({ tone: 'error', text: ok ? 'Some changes could not be saved.' : 'Nothing was saved.' });
    else toast({ tone: 'ok', text: 'Changes saved' });
  };

  const discard = () => {
    const reset: Partial<Record<SectionKey, unknown>> = {};
    for (const k of keys) if (base[k]) reset[k] = JSON.parse(base[k].json);
    setDrafts(reset);
    setIssues({});
    setConflicts({});
  };

  const reloadTheirs = async (k: SectionKey) => {
    const fresh = await api<Loaded>('GET', `/api/admin/sections/${k}`);
    setBase((b) => ({ ...b, [k]: { json: JSON.stringify(fresh.data), version: fresh.version } }));
    setDrafts((d) => ({ ...d, [k]: fresh.data }));
    qc.setQueryData(['section', k], fresh);
    setConflicts((c) => { const n = { ...c }; delete n[k]; return n; });
  };

  const error = results.find((r) => r.error)?.error as Error | undefined;
  if (error) return <p role="alert" className="text-red-500">{error.message}</p>;

  return (
    <div className="flex flex-col">
      <PageHeader title={page.label} description={page.description}
        actions={(
          <>
            <span className={`mono text-[11px] uppercase tracking-[0.14em] ${dirty ? 'text-accent-ink' : 'text-muted'}`}>{dirty ? 'Unsaved changes' : ready ? 'All saved' : ''}</span>
            <button type="button" onClick={discard} disabled={!dirty || saving} className="btn btn-ghost btn-sm disabled:opacity-40"><RotateCcw className="h-4 w-4" />Discard</button>
            <button type="button" onClick={() => void save()} disabled={!dirty || saving} className="btn btn-primary btn-sm min-w-32 disabled:opacity-40">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </button>
          </>
        )} />

      <div role="tablist" aria-label={`${page.label} sections`} className="-mx-1 mb-6 flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 [scrollbar-width:none]">
        {page.tabs.map((t) => {
          const active = t.id === tab.id;
          const invalid = tabHasIssues(t, issues);
          const tabDirty = ready && t.cards.some((c) => dirtyKeys.includes(c.section) && c.fields.some((f) => {
            const d = (drafts[c.section] ?? {}) as Record<string, unknown>;
            const b = JSON.parse(base[c.section]!.json) as Record<string, unknown>;
            return JSON.stringify(d[f]) !== JSON.stringify(b[f]);
          }));
          return (
            <button key={t.id} type="button" role="tab" aria-selected={active} data-invalid={invalid ? 'true' : 'false'}
              onClick={() => navigate(`/admin/${page.id}/${t.id}`)}
              className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${active ? 'bg-accent text-on-accent' : 'text-fg/70 hover:bg-fg/5 hover:text-fg'}`}>
              {t.label}
              {invalid ? <span className="h-2 w-2 rounded-full bg-red-500" aria-label="has problems" /> : tabDirty ? <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-on-accent' : 'bg-accent'}`} aria-label="edited" /> : null}
            </button>
          );
        })}
      </div>

      {Object.entries(conflicts).map(([k, msg]) => (
        <div key={k} role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <span className="flex-1"><strong>{SECTION_LABELS[k as SectionKey]}:</strong> {msg}</span>
          <button type="button" onClick={() => void reloadTheirs(k as SectionKey)} className="btn btn-ghost btn-sm"><RotateCcw className="h-4 w-4" />Reload their version</button>
        </div>
      ))}

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line bg-surface/95 p-3 backdrop-blur lg:hidden">
          <span className="mono flex-1 text-[11px] uppercase tracking-[0.14em] text-accent-ink">Unsaved</span>
          <button type="button" onClick={discard} disabled={saving} className="btn btn-ghost btn-sm">Discard changes</button>
          <button type="button" onClick={() => void save()} disabled={saving} className="btn btn-primary btn-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</button>
        </div>
      )}

      {!ready ? <p className="text-muted">Loading…</p> : (
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <div className={`flex min-w-0 flex-col gap-5 ${showPreview ? 'hidden 2xl:flex' : ''}`}>
            {tab.preview && (
              <button type="button" onClick={() => setShowPreview(true)} className="btn btn-ghost btn-sm self-start 2xl:hidden"><Eye className="h-4 w-4" />Show preview</button>
            )}
            {tab.cards.map((c, i) => (
              <Panel key={i} title={c.title} description={c.description}>
                <FormRenderer fields={fieldsForCard(c)} value={drafts[c.section]} issues={issues[c.section] ?? {}}
                  onChange={(v) => setDrafts((d) => ({ ...d, [c.section]: v }))} />
              </Panel>
            ))}
          </div>
          {tab.preview && (
            <div className={`${showPreview ? 'flex' : 'hidden 2xl:flex'} min-w-0 flex-col gap-3 2xl:sticky 2xl:top-24 2xl:h-[calc(100vh-8rem)]`}>
              <div className="flex items-center justify-between">
                <p className="mono text-[11px] uppercase tracking-[0.16em] text-muted">Live preview · updates as you type</p>
                <button type="button" onClick={() => setShowPreview(false)} className="btn btn-ghost btn-sm 2xl:hidden"><EyeOff className="h-4 w-4" />Back to editing</button>
              </div>
              <div className="min-h-[70vh] flex-1">
                {tab.preview === 'seo' ? <SeoPreview content={previewContent} /> : <Preview page={tab.preview} content={previewContent} focus={tab.focus} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
