import { useEffect, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { plainDisplay } from '@faction/shared';
import type { Field, Issues } from './fields';
import { hasIssueUnder, joinPath } from './fields';
import { FieldControl, FormRenderer } from './FormRenderer';
import { Modal } from '../Modal';

type ListFieldDef = Extract<Field, { kind: 'list' }>;
let keySeq = 0;
const newKey = () => `k${++keySeq}`;
const clean = (s: string) => plainDisplay(s).replace(/\*\*|\[([^\]]+)\]\([^)]*\)/g, '$1').trim();

interface Props { field: ListFieldDef; value: unknown[]; onChange: (v: unknown[]) => void; issues: Issues; path: string; root: unknown }

/** Lists: object items are tidy rows edited in a dialog; plain text items are edited inline. */
export function ListField({ field, value, onChange, issues, path, root }: Props) {
  const [keys, setKeys] = useState<string[]>(() => value.map(newKey));
  const [editing, setEditing] = useState<number | null>(null);
  useEffect(() => { if (value.length !== keys.length) setKeys(value.map(newKey)); }, [value, keys.length]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const isObject = !!field.fields;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    setKeys((k) => arrayMove(k, from, to));
    onChange(arrayMove(value, from, to));
  };
  const remove = (i: number) => {
    const item = value[i];
    const empty = item === '' || (item && typeof item === 'object' && Object.values(item).every((v) => v === '' || (Array.isArray(v) && !v.length)));
    if (!empty && !window.confirm(`Remove ${field.itemLabel.toLowerCase()} ${i + 1}? You can still discard all changes before saving.`)) return;
    setKeys((k) => k.filter((_, j) => j !== i));
    onChange(value.filter((_, j) => j !== i));
  };
  const add = () => {
    setKeys((ks) => [...ks, newKey()]);
    onChange([...value, structuredClone(field.newItem)]);
    if (isObject) setEditing(value.length);
  };
  const setItem = (i: number, v: unknown) => onChange(value.map((x, j) => (j === i ? v : x)));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    move(keys.indexOf(String(e.active.id)), keys.indexOf(String(e.over.id)));
  };

  const summary = (item: unknown, i: number): [string, string] => {
    const obj = (item ?? {}) as Record<string, unknown>;
    const texts = (field.fields ?? []).map((f) => obj[f.name]).filter((v): v is string => typeof v === 'string' && !!v.trim()).map(clean);
    return [texts[0] ?? `${field.itemLabel} ${i + 1}`, texts[1] ?? ''];
  };

  const listError = issues[path];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-fg">{field.label}</h3>
        <span className="mono text-[11px] uppercase tracking-wider text-muted">{value.length} {value.length === 1 ? 'item' : 'items'}</span>
      </div>
      {field.hint && <p className="-mt-2 text-xs text-muted">{field.hint}</p>}
      {value.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={keys} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {value.map((item, i) => {
                const k = keys[i] ?? `tmp${i}`;
                const itemPath = joinPath(path, i);
                const invalid = hasIssueUnder(issues, itemPath);
                const [title, sub] = isObject ? summary(item, i) : ['', ''];
                return (
                  <Row key={k} id={k} label={`${field.itemLabel} ${i + 1}`} invalid={invalid}
                    onUp={i > 0 ? () => move(i, i - 1) : undefined} onDown={i < value.length - 1 ? () => move(i, i + 1) : undefined}
                    onRemove={() => remove(i)} onEdit={isObject ? () => setEditing(i) : undefined}>
                    {isObject ? (
                      <button type="button" onClick={() => setEditing(i)} className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left">
                        <span className="block truncate text-sm font-medium text-fg">{title}</span>
                        {sub && <span className="block truncate text-xs text-muted">{sub}</span>}
                        {invalid && <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3.5 w-3.5" />Needs attention</span>}
                      </button>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <FieldControl field={{ name: String(i), label: `${field.itemLabel} ${i + 1}`, kind: field.itemKind ?? 'text' }} value={item}
                          onChange={(v) => setItem(i, v)} issues={issues} path={itemPath} root={root} />
                      </div>
                    )}
                  </Row>
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {listError && <p role="alert" className="text-sm font-medium text-red-500">{listError}</p>}
      <button type="button" onClick={add} className="inline-flex items-center gap-2 self-start rounded-full border border-dashed border-line-strong px-4 py-2 text-sm font-semibold text-fg transition hover:border-accent hover:text-accent-ink">
        <Plus className="h-4 w-4" /> Add {field.itemLabel.toLowerCase()}
      </button>
      {editing !== null && isObject && value[editing] !== undefined && (
        <Modal title={`${field.itemLabel} ${editing + 1}`} onClose={() => setEditing(null)}>
          <div className="flex flex-col gap-6">
            <FormRenderer fields={field.fields!} value={value[editing]} onChange={(v) => setItem(editing, v)} issues={issues} path={joinPath(path, editing)} root={root} />
            <div className="flex justify-end border-t border-line pt-4">
              <button type="button" onClick={() => setEditing(null)} className="btn btn-primary btn-sm">Done</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface RowProps {
  id: string; label: string; invalid: boolean; children: React.ReactNode;
  onUp?: () => void; onDown?: () => void; onRemove: () => void; onEdit?: () => void;
}

function Row({ id, label, invalid, children, onUp, onDown, onRemove, onEdit }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const icon = 'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-fg/5 hover:text-fg disabled:opacity-25 disabled:hover:bg-transparent';
  return (
    <li ref={setNodeRef} aria-label={label} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1.5 bg-surface px-2 py-2 ${invalid ? 'bg-red-500/5' : ''} ${isDragging ? 'relative z-10 shadow-2xl ring-2 ring-accent' : ''}`}>
      <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Drag to reorder ${label}`} className={`${icon} cursor-grab touch-none active:cursor-grabbing`}>
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
      <div className="flex shrink-0 items-center">
        {onEdit && <button type="button" onClick={onEdit} aria-label="Edit" className={icon}><Pencil className="h-4 w-4" /></button>}
        <button type="button" onClick={onUp} disabled={!onUp} aria-label="Move up" className={`${icon} hidden sm:grid`}><ArrowUp className="h-4 w-4" /></button>
        <button type="button" onClick={onDown} disabled={!onDown} aria-label="Move down" className={`${icon} hidden sm:grid`}><ArrowDown className="h-4 w-4" /></button>
        <button type="button" onClick={onRemove} aria-label="Remove" className={`${icon} hover:!bg-red-500/10 hover:!text-red-500`}><Trash2 className="h-4 w-4" /></button>
      </div>
    </li>
  );
}
