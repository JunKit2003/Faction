import { useEffect, useRef, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react';
import type { Field, Issues } from './fields';
import { hasIssueUnder, joinPath } from './fields';
import { FieldControl, FormRenderer } from './FormRenderer';

type ListFieldDef = Extract<Field, { kind: 'list' }>;
let keySeq = 0;
const newKey = () => `k${++keySeq}`;

interface Props { field: ListFieldDef; value: unknown[]; onChange: (v: unknown[]) => void; issues: Issues; path: string; root: unknown }

export function ListField({ field, value, onChange, issues, path, root }: Props) {
  const [keys, setKeys] = useState<string[]>(() => value.map(newKey));
  const [open, setOpen] = useState<Set<string>>(new Set());
  const lastLen = useRef(value.length);
  // Value replaced from outside (reload/restore): re-key.
  useEffect(() => {
    if (value.length !== keys.length) setKeys(value.map(newKey));
    lastLen.current = value.length;
  }, [value, keys.length]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const isObject = !!field.fields;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    setKeys((k) => arrayMove(k, from, to));
    onChange(arrayMove(value, from, to));
  };
  const remove = (i: number) => {
    setKeys((k) => k.filter((_, j) => j !== i));
    onChange(value.filter((_, j) => j !== i));
  };
  const add = () => {
    const k = newKey();
    setKeys((ks) => [...ks, k]);
    setOpen((o) => new Set(o).add(k));
    onChange([...value, structuredClone(field.newItem)]);
  };
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    move(keys.indexOf(String(e.active.id)), keys.indexOf(String(e.over.id)));
  };

  const listError = issues[path];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-fg">{field.label}</h3>
        <span className="text-xs text-muted">{value.length} {value.length === 1 ? 'item' : 'items'}</span>
      </div>
      {field.hint && <p className="-mt-2 text-xs text-muted">{field.hint}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={keys} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {value.map((item, i) => {
              const k = keys[i] ?? `tmp${i}`;
              const itemPath = joinPath(path, i);
              const expanded = !isObject || open.has(k) || hasIssueUnder(issues, itemPath);
              const toggle = () => setOpen((o) => { const n = new Set(o); if (n.has(k)) n.delete(k); else n.add(k); return n; });
              return (
                <SortableItem key={k} id={k} label={`${field.itemLabel} ${i + 1}`} invalid={hasIssueUnder(issues, itemPath)}
                  summary={isObject ? summarize(item, field, i) : null} expanded={expanded} onToggle={isObject ? toggle : undefined}
                  onUp={i > 0 ? () => move(i, i - 1) : undefined} onDown={i < value.length - 1 ? () => move(i, i + 1) : undefined} onRemove={() => remove(i)}>
                  {isObject ? (
                    <FormRenderer fields={field.fields!} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} issues={issues} path={itemPath} root={root} />
                  ) : (
                    <FieldControl field={{ name: String(i), label: `${field.itemLabel} ${i + 1}`, kind: field.itemKind ?? 'text' }} value={item}
                      onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} issues={issues} path={itemPath} root={root} />
                  )}
                </SortableItem>
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
      {listError && <p role="alert" className="text-sm font-medium text-red-500">{listError}</p>}
      <button type="button" onClick={add} className="inline-flex items-center gap-2 self-start rounded-full border border-dashed border-line px-4 py-2 text-sm font-semibold text-fg hover:border-accent hover:text-accent-ink">
        <Plus className="h-4 w-4" /> Add {field.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

function summarize(item: unknown, field: ListFieldDef, i: number): string {
  const obj = (item ?? {}) as Record<string, unknown>;
  for (const f of field.fields ?? []) {
    const v = obj[f.name];
    if ((f.kind === 'text' || f.kind === 'select') && typeof v === 'string' && v.trim()) return v;
  }
  return `${field.itemLabel} ${i + 1}`;
}

interface ItemProps {
  id: string; label: string; summary: string | null; expanded: boolean; invalid: boolean;
  onToggle?: () => void; onUp?: () => void; onDown?: () => void; onRemove: () => void; children: React.ReactNode;
}

function SortableItem({ id, label, summary, expanded, invalid, onToggle, onUp, onDown, onRemove, children }: ItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const iconBtn = 'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-fg/5 hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <li ref={setNodeRef} aria-label={label} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border bg-surface ${invalid ? 'border-red-500/60' : 'border-line'} ${isDragging ? 'z-10 shadow-2xl ring-2 ring-accent' : ''}`}>
      <div className="flex items-center gap-1 p-1.5">
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Drag to reorder ${label}`} className={`${iconBtn} cursor-grab touch-none active:cursor-grabbing`}>
          <GripVertical className="h-4 w-4" />
        </button>
        {summary !== null ? (
          <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-fg hover:bg-fg/5">
            <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${expanded ? '' : '-rotate-90'}`} />
            <span className="truncate">{summary}</span>
          </button>
        ) : <span className="flex-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>}
        <button type="button" onClick={onUp} disabled={!onUp} aria-label="Move up" className={iconBtn}><ArrowUp className="h-4 w-4" /></button>
        <button type="button" onClick={onDown} disabled={!onDown} aria-label="Move down" className={iconBtn}><ArrowDown className="h-4 w-4" /></button>
        <button type="button" onClick={onRemove} aria-label="Remove" className={`${iconBtn} hover:!text-red-500`}><Trash2 className="h-4 w-4" /></button>
      </div>
      {expanded && <div className="border-t border-line p-4">{children}</div>}
    </li>
  );
}
