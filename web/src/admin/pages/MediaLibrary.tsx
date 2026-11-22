import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { SECTION_LABELS, isSectionKey } from '@faction/shared';
import { api, ApiError, type LibraryItem } from '../api';
import { useLibrary, useUpload } from '../media';
import { inputCls } from '../form/inputs';
import { PageHeader } from './PageHeader';

import { fitContain } from '../form/MediaPicker';

const sectionName = (k: string) => (isSectionKey(k) ? SECTION_LABELS[k] : k);

function MediaCard({ item }: { item: LibraryItem }) {
  const qc = useQueryClient();
  const [alt, setAlt] = useState(item.alt);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const saveAlt = async () => {
    if (alt === item.alt) return;
    setBusy(true);
    try { await api('PATCH', `/api/admin/media/${item.id}`, { alt }); setMsg('Saved'); void qc.invalidateQueries({ queryKey: ['media'] }); void qc.invalidateQueries({ queryKey: ['content'] }); }
    catch (e) { setMsg(e instanceof ApiError ? e.message : 'Failed'); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Delete “${item.originalName}”? It will disappear from the library.`)) return;
    try { await api('DELETE', `/api/admin/media/${item.id}`); void qc.invalidateQueries({ queryKey: ['media'] }); }
    catch (e) {
      if (e instanceof ApiError && e.status === 409) setMsg(`In use on: ${(e.body.usedIn ?? []).map(sectionName).join(', ')}. Remove it there first.`);
      else setMsg(e instanceof ApiError ? e.message : 'Delete failed');
    }
  };
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className={`aspect-[4/3] overflow-hidden ${fitContain(item) ? 'bg-[repeating-conic-gradient(#8882_0_25%,transparent_0_50%)] bg-[length:16px_16px] p-3' : 'bg-fg/5'}`}>
        <img src={item.url} srcSet={item.srcset || undefined} sizes="300px" alt={item.alt} loading="lazy" className={`h-full w-full ${fitContain(item) ? 'object-contain' : 'object-cover'}`} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-xs text-muted" title={item.originalName}>{item.originalName} · {item.width}×{item.height}</p>
        <label className="sr-only" htmlFor={`alt-${item.id}`}>Alt text for {item.originalName}</label>
        <input id={`alt-${item.id}`} value={alt} onChange={(e) => { setAlt(e.target.value); setMsg(''); }} onBlur={() => void saveAlt()} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void saveAlt(); } }}
          placeholder="Describe the image (alt text)" className={`${inputCls} py-2 text-sm`} />
        <div className="flex flex-wrap gap-1">
          {item.usedIn.length ? item.usedIn.map((k) => <span key={k} className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent-ink">{sectionName(k)}</span>) : <span className="text-[11px] text-muted">Not used</span>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span role="status" className="text-xs text-muted">{busy ? 'Saving…' : msg}</span>
          <button type="button" onClick={() => void remove()} aria-label={`Delete ${item.originalName}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </li>
  );
}

export function MediaLibrary() {
  const lib = useLibrary();
  const upload = useUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const onFiles = async (files: FileList | File[]) => {
    const errs: string[] = [];
    for (const file of Array.from(files)) {
      try { await upload.mutateAsync({ file, purpose: logo ? 'logo' : undefined }); }
      catch (e) { errs.push(`${file.name}: ${e instanceof ApiError ? e.message : 'Upload failed.'}`); }
    }
    setErrors(errs);
  };
  return (
    <div>
      <PageHeader title="Media library" intro="Upload photos once, then pick them in any section. Alt text describes the image for screen readers and is the gallery caption." />
      <div className="px-5 sm:px-8">
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void onFiles(e.dataTransfer.files); }}
          className={`flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed p-8 text-center transition ${drag ? 'border-accent bg-accent/5' : 'border-line'}`}>
          <Upload className="h-7 w-7 text-muted" />
          <p className="text-sm text-fg">Drag photos here, or</p>
          <input ref={fileRef} type="file" multiple accept={logo ? 'image/jpeg,image/png,image/webp,image/svg+xml' : 'image/jpeg,image/png,image/webp'} className="sr-only" aria-label="Choose files to upload" onChange={(e) => { if (e.target.files) void onFiles(e.target.files); e.target.value = ''; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={upload.isPending} className="btn btn-primary btn-sm">
            {upload.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</> : 'Choose files'}
          </button>
          <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={logo} onChange={(e) => setLogo(e.target.checked)} className="accent-[var(--accent)]" />These are logos (allows SVG)</label>
          <p className="text-xs text-muted">JPG, PNG or WebP up to 15 MB. Photos are resized automatically and location data is removed.</p>
        </div>
        {errors.length > 0 && <ul role="alert" className="mt-3 flex flex-col gap-1 text-sm text-red-500">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      </div>
      {lib.isLoading ? <p className="p-8 text-muted">Loading…</p> : (
        <ul className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 sm:p-8 xl:grid-cols-4 2xl:grid-cols-5">
          {(lib.data ?? []).map((m) => <MediaCard key={m.id} item={m} />)}
        </ul>
      )}
    </div>
  );
}
