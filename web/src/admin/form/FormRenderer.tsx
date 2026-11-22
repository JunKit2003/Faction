import type { Field, Issues } from './fields';
import { RICH_HINT, joinPath } from './fields';
import { FieldShell, inputCls } from './inputs';
import { ListField } from './ListField';
import { HoursField } from './HoursField';
import { MediaField, MediaListField } from './MediaPicker';

type Obj = Record<string, unknown>;

interface Props {
  fields: Field[];
  value: unknown;
  onChange: (next: unknown) => void;
  issues: Issues;
  path?: string;
  root?: unknown;
}

/** Renders a form from field descriptors over a nested value; every change produces a new value. */
export function FormRenderer({ fields, value, onChange, issues, path = '', root }: Props) {
  const obj = (value ?? {}) as Obj;
  const top = root ?? value;
  const set = (name: string, v: unknown) => onChange({ ...obj, [name]: v });
  return (
    <div className="flex flex-col gap-6">
      {fields.map((f) => (
        <FieldControl key={f.name} field={f} value={obj[f.name]} onChange={(v) => set(f.name, v)} issues={issues} path={joinPath(path, f.name)} root={top} />
      ))}
    </div>
  );
}

export function FieldControl({ field: f, value, onChange, issues, path, root }: { field: Field; value: unknown; onChange: (v: unknown) => void; issues: Issues; path: string; root: unknown }) {
  const error = issues[path];
  switch (f.kind) {
    case 'text':
    case 'url':
    case 'color':
      return (
        <FieldShell label={f.label} hint={f.hint} error={error}>
          {(id, d) => (
            <div className="flex items-center gap-2">
              {f.kind === 'color' && (
                <input type="color" aria-label={`${f.label} picker`} value={/^#[0-9a-f]{6}$/i.test(String(value ?? '')) ? String(value) : '#000000'}
                  onChange={(e) => onChange(e.target.value)} className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-line bg-bg p-1" />
              )}
              <input id={id} type={f.kind === 'url' ? 'url' : 'text'} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}
                placeholder={'placeholder' in f ? f.placeholder : undefined} aria-invalid={error ? 'true' : 'false'} aria-describedby={d} className={inputCls} />
            </div>
          )}
        </FieldShell>
      );
    case 'textarea':
    case 'rich':
      return (
        <FieldShell label={f.label} hint={f.hint ?? (f.kind === 'rich' ? RICH_HINT : undefined)} error={error}>
          {(id, d) => (
            <textarea id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} rows={f.kind === 'rich' ? 4 : 3}
              aria-invalid={error ? 'true' : 'false'} aria-describedby={d} className={`${inputCls} resize-y leading-relaxed`} />
          )}
        </FieldShell>
      );
    case 'number':
      return (
        <FieldShell label={f.label} hint={f.hint} error={error}>
          {(id, d) => (
            <input id={id} type="number" inputMode="numeric" min={f.min} max={f.max} value={value === undefined || value === null ? '' : String(value)}
              onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} aria-invalid={error ? 'true' : 'false'} aria-describedby={d} className={`${inputCls} max-w-40`} />
          )}
        </FieldShell>
      );
    case 'select': {
      const options = typeof f.options === 'function' ? f.options(root) : f.options;
      return (
        <FieldShell label={f.label} hint={f.hint} error={error}>
          {(id, d) => (
            <select id={id} value={String(value ?? '')} onChange={(e) => onChange(f.numeric ? Number(e.target.value) : e.target.value)}
              aria-invalid={error ? 'true' : 'false'} aria-describedby={d} className={inputCls}>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
        </FieldShell>
      );
    }
    case 'media':
      return <MediaField label={f.label} hint={f.hint} error={error} value={String(value ?? '')} onChange={onChange} purpose={f.purpose} />;
    case 'mediaList':
      return <MediaListField label={f.label} hint={f.hint} error={error ?? firstIssueUnder(issues, path)} value={(value as string[]) ?? []} onChange={onChange} />;
    case 'hours':
      return <HoursField label={f.label} value={value as never} onChange={onChange} issues={issues} path={path} />;
    case 'group':
      return (
        <fieldset className="flex flex-col gap-5 rounded-2xl border border-line p-4 sm:p-5">
          <legend className="px-1 text-sm font-semibold text-fg">{f.label}</legend>
          {f.hint && <p className="-mt-2 text-xs text-muted">{f.hint}</p>}
          <FormRenderer fields={f.fields} value={value} onChange={onChange} issues={issues} path={path} root={root} />
        </fieldset>
      );
    case 'list':
      return <ListField field={f} value={(value as unknown[]) ?? []} onChange={onChange} issues={issues} path={path} root={root} />;
  }
}

function firstIssueUnder(issues: Issues, path: string): string | undefined {
  const k = Object.keys(issues).find((x) => x.startsWith(path + '.'));
  return k ? issues[k] : undefined;
}
