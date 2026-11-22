import { useId, useState, type FormEvent } from 'react';
import { formatHours } from '@faction/shared';
import { useSection } from '../../content/ContentContext';
import { PageHero } from '../PageHero';
import { Reveal } from '../Reveal';
import { SocialLinks } from '../SocialLinks';
import { MapEmbed } from '../MapEmbed';
import { OpenBadge } from '../OpenBadge';

export function ContactForm() {
  const c = useSection('contact');
  const { whatsappNumber } = useSection('site');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; message?: string }>({});
  const [status, setStatus] = useState('');
  const id = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Please enter your name.';
    if (!message.trim()) next.message = 'Please include a message.';
    setErrors(next);
    if (next.name || next.message) {
      setStatus('');
      document.getElementById(next.name ? `${id}-name` : `${id}-message`)?.focus();
      return;
    }
    const text = [c.whatsappHeader, `Name: ${name.trim()}`, `Message: ${message.trim()}`].join('\n');
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    // Not passing 'noopener' (it makes open() return null); cut the opener link by hand instead.
    const win = window.open(url, '_blank');
    if (win) win.opener = null;
    else window.location.href = url; // popup blocked
    setStatus('Opening WhatsApp…');
    setName('');
    setMessage('');
  };

  const field = 'peer w-full rounded-2xl border border-line bg-bg/60 px-4 pb-3 pt-7 text-base text-fg outline-none transition placeholder:text-transparent focus:border-accent focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-red-500';
  const label = 'pointer-events-none absolute left-4 top-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-2.5 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-accent-ink';

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="relative">
        <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder={c.namePlaceholder || c.nameLabel} autoComplete="name"
          aria-invalid={errors.name ? 'true' : 'false'} aria-describedby={errors.name ? `${id}-name-err` : undefined} className={field} />
        <label htmlFor={`${id}-name`} className={label}>{c.nameLabel}</label>
        {errors.name && <p id={`${id}-name-err`} className="mt-1.5 text-sm text-red-500">{errors.name}</p>}
      </div>
      <div className="relative">
        <textarea id={`${id}-message`} value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder={c.messagePlaceholder || c.messageLabel}
          aria-invalid={errors.message ? 'true' : 'false'} aria-describedby={errors.message ? `${id}-message-err` : undefined} className={`${field} resize-y`} />
        <label htmlFor={`${id}-message`} className={label}>{c.messageLabel}</label>
        {errors.message && <p id={`${id}-message-err`} className="mt-1.5 text-sm text-red-500">{errors.message}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary">{c.submitLabel}</button>
        <p role="status" aria-live="polite" className="text-sm text-muted">{status}</p>
      </div>
    </form>
  );
}

export default function Contact() {
  const c = useSection('contact');
  const site = useSection('site');
  return (
    <>
      <PageHero title={c.title} intro={c.intro} />
      <section id="booking" className="container-x grid scroll-mt-28 gap-10 pb-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal className="flex flex-col gap-8">
          <h2 className="h2">{c.getInTouchTitle}</h2>
          <dl className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <dt className="eyebrow flex items-center gap-3">{site.labels.hours} <OpenBadge /></dt>
              <dd className="flex flex-col text-lg text-fg">{formatHours(site.hours).map((l) => <span key={l}>{l}</span>)}</dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="eyebrow">{site.labels.address}</dt>
              <dd className="max-w-md text-lg text-fg">{site.address}</dd>
            </div>
          </dl>
          <SocialLinks size="lg" />
        </Reveal>
        <Reveal delay={0.1} className="card p-6 sm:p-10">
          <h2 className="h2 mb-8">{c.formTitle}</h2>
          <ContactForm />
        </Reveal>
      </section>
      <section className="container-x pb-24">
        <Reveal><MapEmbed title={`${site.name} - Google Map`} /></Reveal>
      </section>
    </>
  );
}
