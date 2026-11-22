import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Eye, EyeOff, Loader2, RotateCcw } from 'lucide-react';
import { SECTION_LABELS, type PublicContent, type SectionKey } from '@faction/shared';
import { sectionSchemas } from '@faction/shared/schemas';
import { fetchContent } from '../../api';
import { api, ApiError } from '../api';
import { useLibrary } from '../media';
import { FormRenderer } from '../form/FormRenderer';
import type { Issues } from '../form/fields';
import { SECTION_DEFS } from '../sections/defs';
import { Preview, SeoPreview } from '../Preview';
import { useUnsaved } from '../useUnsaved';

interface Loaded { key: SectionKey; data: unknown; version: number }
type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string } | { kind: 'conflict'; message: string };

export function SectionEditor({ sectionKey }: { sectionKey: SectionKey }) {
  const qc = useQueryClient();
  const def = SECTION_DEFS[sectionKey];
  const section = useQuery({ queryKey: ['section', sectionKey], queryFn: () => api<Loaded>('GET', `/api/admin/sections/${sectionKey}`), refetchOnWindowFocus: false });
  const content = useQuery({ queryKey: ['content'], queryFn: fetchContent });
  const library = useLibrary();
  const [draft, setDraft] = useState<unknown>(undefined);
  const [base, setBase] = useState<{ json: string; version: number } | null>(null);
  const [issues, setIssues] = useState<Issues>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!section.data) return;
    setDraft(section.data.data);
    setBase({ json: JSON.stringify(section.data.data), version: section.data.version });
    setIssues({});
  }, [section.data]);

  const dirty = !!base && draft !== undefined && JSON.stringify(draft) !== base.json;
  useUnsaved(dirty);

  const previewContent = useMemo<PublicContent | undefined>(() => {
    if (!content.data || draft === undefined) return undefined;
    const media = { ...content.data.media };
    for (const m of library.data ?? []) media[m.id] = m;
    return { ...content.data, media, sections: { ...content.data.sections, [sectionKey]: draft } } as PublicContent;
  }, [content.data, library.data, draft, sectionKey]);

  const save = async () => {
    if (!base) return;
    const parsed = sectionSchemas[sectionKey].safeParse(draft);
    if (!parsed.success) {
      setIssues(Object.fromEntries(parsed.error.issues.map((i) => [i.path.map(String).join('.'), i.message])));
      setStatus({ kind: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }
    setIssues({});
    setStatus({ kind: 'saving' });
    try {
      const res = await api<{ version: number }>('PUT', `/api/admin/sections/${sectionKey}`, { data: parsed.data, version: base.version });
      setBase({ json: JSON.stringify(draft), version: res.version });
      setStatus({ kind: 'saved' });
      qc.setQueryData(['section', sectionKey], { key: sectionKey, data: draft, version: res.version });
      void qc.invalidateQueries({ queryKey: ['content'] });
      void qc.invalidateQueries({ queryKey: ['audit'] });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setStatus({ kind: 'conflict', message: e.message });
      else if (e instanceof ApiError && e.status === 422) {
        setIssues(Object.fromEntries((e.body.issues ?? []).map((i) => [i.path, i.message])));
        setStatus({ kind: 'error', message: e.message });
      } else setStatus({ kind: 'error', message: e instanceof Error ? e.message : 'Save failed.' });
    }
  };

  const reload = async () => {
    setStatus({ kind: 'idle' });
    await qc.invalidateQueries({ queryKey: ['section', sectionKey] });
    await section.refetch();
  };

  useEffect(() => { if (status.kind === 'saved') { const t = setTimeout(() => setStatus({ kind: 'idle' }), 2500); return () => clearTimeout(t); } }, [status]);

  if (section.isLoading || draft === undefined) return <p className="p-8 text-muted">Loading…</p>;
  if (section.error) return <p role="alert" className="p-8 text-red-500">{(section.error as Error).message}</p>;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-2 pt-6 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold text-fg">{SECTION_LABELS[sectionKey]}</h1>
          {def.help && <p className="mt-1 text-sm text-muted">{def.help}</p>}
        </div>
        {def.preview && (
          <button type="button" onClick={() => setShowPreview((s) => !s)} className="btn btn-ghost btn-sm xl:hidden">
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {showPreview ? 'Hide preview' : 'Preview'}
          </button>
        )}
      </div>

      {status.kind === 'conflict' && (
        <div role="alert" className="mx-5 mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-fg sm:mx-8">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <span className="flex-1">{status.message}</span>
          <button type="button" onClick={() => void reload()} className="btn btn-ghost btn-sm"><RotateCcw className="h-4 w-4" />Reload their version</button>
        </div>
      )}

      <div className="grid flex-1 gap-6 px-5 py-4 sm:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <form className={`${showPreview ? 'hidden xl:block' : ''}`} onSubmit={(e) => { e.preventDefault(); void save(); }} noValidate>
          <FormRenderer fields={def.fields} value={draft} onChange={(v) => { setDraft(v); if (status.kind === 'saved' || status.kind === 'error') setStatus({ kind: 'idle' }); }} issues={issues} />
        </form>
        {def.preview && (
          <div className={`${showPreview ? '' : 'hidden xl:block'} xl:sticky xl:top-4 xl:h-[calc(100vh-10rem)]`}>
            {def.preview === 'seo' ? <SeoPreview content={previewContent} /> : <Preview page={def.preview} content={previewContent} focus={sectionKey} />}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 mt-auto flex items-center justify-end gap-3 border-t border-line bg-surface/90 px-5 py-3 backdrop-blur sm:px-8">
        <p role="status" aria-live="polite" className="mr-auto text-sm">
          {status.kind === 'saved' && <span className="inline-flex items-center gap-1.5 font-medium text-emerald-500"><Check className="h-4 w-4" />Saved</span>}
          {status.kind === 'error' && <span className="font-medium text-red-500">{status.message}</span>}
          {status.kind === 'idle' && dirty && <span className="text-muted">Unsaved changes</span>}
        </p>
        <button type="button" disabled={!dirty || status.kind === 'saving'} onClick={() => { setDraft(JSON.parse(base!.json)); setIssues({}); setStatus({ kind: 'idle' }); }} className="btn btn-ghost btn-sm disabled:opacity-40">Discard</button>
        <button type="button" disabled={status.kind === 'saving'} onClick={() => void save()} className="btn btn-primary btn-sm min-w-24">
          {status.kind === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
        </button>
      </div>
    </div>
  );
}
