import { useRef, useState } from 'react';
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, ImagePlus, Loader2, Plus, Upload, X } from 'lucide-react';
import type { LibraryItem } from '../api';
import { ApiError } from '../api';
import { useLibrary, useUpload } from '../media';
import { Modal } from '../Modal';

/** Logos and small or very wide images are shown whole rather than cropped. */
export const fitContain = (m: Pick<LibraryItem, 'mime' | 'width' | 'height'>) => m.mime === 'image/svg+xml' || m.width < 300 || m.width / Math.max(1, m.height) > 2.2;

function Thumb({ item, className = '' }: { item?: LibraryItem; className?: string }) {
  if (!item) return <div className={`grid place-items-center bg-fg/5 text-xs text-muted ${className}`}>Missing</div>;
  return <img src={item.url} srcSet={item.srcset || undefined} sizes="200px" alt={item.alt} className={`${fitContain(item) ? 'bg-[repeating-conic-gradient(#8882_0_25%,transparent_0_50%)] bg-[length:16px_16px] object-contain p-2' : 'object-cover'} ${className}`} loading="lazy" />;
}

export function MediaField({ label, hint, error, value, onChange, purpose }: { label: string; hint?: string; error?: string; value: string; onChange: (v: string) => void; purpose?: 'logo' }) {
  const lib = useLibrary();
  const [picking, setPicking] = useState(false);
  const item = lib.data?.find((m) => m.id === value);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-fg">{label}</span>
      <div className={`flex items-center gap-4 rounded-2xl border p-3 ${error ? 'border-red-500' : 'border-line'}`}>
        {value ? <Thumb item={item} className="h-20 w-28 shrink-0 rounded-xl" /> : <div className="grid h-20 w-28 shrink-0 place-items-center rounded-xl bg-fg/5"><ImagePlus className="h-6 w-6 text-muted" /></div>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg">{item?.originalName ?? (value ? 'Image' : 'No image chosen')}</p>
          {item?.alt && <p className="truncate text-xs text-muted">{item.alt}</p>}
        </div>
        <button type="button" onClick={() => setPicking(true)} className="btn btn-ghost btn-sm">{value ? 'Change' : 'Choose image'}</button>
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="text-sm font-medium text-red-500">{error}</p>}
      {picking && <PickerDialog title={`Choose ${label.toLowerCase()}`} purpose={purpose} onClose={() => setPicking(false)} onPick={(ids) => { onChange(ids[0]!); setPicking(false); }} />}
    </div>
  );
}

export function MediaListField({ label, hint, error, value, onChange }: { label: string; hint?: string; error?: string; value: string[]; onChange: (v: string[]) => void }) {
  const lib = useLibrary();
  const [picking, setPicking] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const keys = value.map((id, i) => `${id}::${i}`);
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    onChange(arrayMove(value, keys.indexOf(String(e.active.id)), keys.indexOf(String(e.over.id))));
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between"><span className="text-sm font-semibold text-fg">{label}</span><span className="text-xs text-muted">{value.length} images · drag to reorder</span></div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={keys} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {value.map((id, i) => (
              <SortableThumb key={keys[i]} sortId={keys[i]!} item={lib.data?.find((m) => m.id === id)} index={i} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
            ))}
            <li>
              <button type="button" onClick={() => setPicking(true)} className="grid aspect-square w-full place-items-center rounded-xl border-2 border-dashed border-line text-muted hover:border-accent hover:text-accent-ink">
                <span className="flex flex-col items-center gap-1 text-xs font-semibold"><Plus className="h-5 w-5" />Add images</span>
              </button>
            </li>
          </ul>
        </SortableContext>
      </DndContext>
      {error && <p role="alert" className="text-sm font-medium text-red-500">{error}</p>}
      {picking && <PickerDialog multiple title={`Add to ${label.toLowerCase()}`} onClose={() => setPicking(false)} onPick={(ids) => { onChange([...value, ...ids]); setPicking(false); }} />}
    </div>
  );
}

function SortableThumb({ sortId, item, index, onRemove }: { sortId: string; item?: LibraryItem; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortId });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`group relative ${isDragging ? 'z-10' : ''}`}>
      <button type="button" {...attributes} {...listeners} aria-label={`Image ${index + 1}${item?.alt ? `: ${item.alt}` : ''}. Drag to reorder`}
        className={`block w-full cursor-grab touch-none overflow-hidden rounded-xl border border-line active:cursor-grabbing ${isDragging ? 'ring-2 ring-accent' : ''}`}>
        <Thumb item={item} className="aspect-square w-full" />
      </button>
      <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 text-[11px] font-semibold text-white">{index + 1}</span>
      <button type="button" onClick={onRemove} aria-label={`Remove image ${index + 1}`} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

export function PickerDialog({ title, onClose, onPick, multiple, purpose }: { title: string; onClose: () => void; onPick: (ids: string[]) => void; multiple?: boolean; purpose?: 'logo' }) {
  const lib = useLibrary();
  const upload = useUpload();
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const items = (lib.data ?? []).filter((m) => !q || (m.originalName + ' ' + m.alt).toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) => {
    if (!multiple) { onPick([id]); return; }
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const onFiles = async (files: FileList | null) => {
    setErr('');
    for (const file of Array.from(files ?? [])) {
      try {
        const item = await upload.mutateAsync({ file, purpose });
        if (!multiple) { onPick([item.id]); return; }
        setSelected((s) => [...s, item.id]);
      } catch (e) { setErr(e instanceof ApiError ? e.message : 'Upload failed.'); }
    }
  };
  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search images…" aria-label="Search images"
          className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[15px] outline-none focus:border-accent" />
        <input ref={fileRef} type="file" multiple={multiple} accept={purpose === 'logo' ? 'image/jpeg,image/png,image/webp,image/svg+xml' : 'image/jpeg,image/png,image/webp'} className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} aria-label="Upload images" />
        <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost btn-sm" disabled={upload.isPending}>
          {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
        </button>
      </div>
      {err && <p role="alert" className="mb-3 text-sm font-medium text-red-500">{err}</p>}
      {lib.isLoading ? <p className="text-muted">Loading…</p> : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => {
            const on = selected.includes(m.id);
            return (
              <li key={m.id}>
                <button type="button" onClick={() => toggle(m.id)} aria-pressed={multiple ? on : undefined} aria-label={m.alt || m.originalName}
                  className={`relative block w-full overflow-hidden rounded-xl border-2 ${on ? 'border-accent' : 'border-transparent'} hover:border-accent/60`}>
                  <Thumb item={m} className="aspect-square w-full" />
                  {on && <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-accent text-black"><Check className="h-4 w-4" /></span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!lib.isLoading && !items.length && <p className="py-8 text-center text-muted">No images yet. Upload one above.</p>}
      {multiple && (
        <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 flex items-center justify-end gap-3 border-t border-line bg-surface px-5 py-4">
          <span className="mr-auto text-sm text-muted">{selected.length} selected</span>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button type="button" disabled={!selected.length} onClick={() => onPick(selected)} className="btn btn-primary btn-sm disabled:opacity-40">Add {selected.length || ''}</button>
        </div>
      )}
    </Modal>
  );
}
