import { useEffect, useRef, useState } from 'react';
import type { PublicContent, SitePage } from '@faction/shared';

export const PREVIEW_MSG = 'faction-preview';
export interface PreviewMessage { type: typeof PREVIEW_MSG; page: SitePage; content: PublicContent; focus?: string }

/** Live preview: the real page components rendered in an iframe at desktop width, scaled to fit. */
export function Preview({ page, content, focus }: { page: SitePage; content: PublicContent | undefined; focus?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(0.5);
  const WIDTH = 1280;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / WIDTH)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.origin === location.origin && e.data === 'faction-preview-ready') setReady(true); };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    if (!ready || !content) return;
    const t = setTimeout(() => {
      const msg: PreviewMessage = { type: PREVIEW_MSG, page, content, focus };
      frame.current?.contentWindow?.postMessage(msg, location.origin);
    }, 120);
    return () => clearTimeout(t);
  }, [ready, content, page, focus]);

  return (
    <div ref={box} className="relative h-full min-h-[60vh] overflow-hidden rounded-2xl border border-line bg-bg">
      <iframe ref={frame} title="Live preview" src="/admin/__preview"
        style={{ width: WIDTH, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: '0 0' }}
        className="absolute left-0 top-0 border-0" />
    </div>
  );
}

export function SeoPreview({ content }: { content: PublicContent | undefined }) {
  if (!content) return null;
  const { seo } = content.sections;
  const og = content.media[seo.ogImageId];
  const host = location.host;
  const paths = { home: '', about: '/about', media: '/media', faq: '/faq', contact: '/contact' } as const;
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-5 text-[#202124]">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#5f6368]">Google results</p>
      {(Object.keys(paths) as (keyof typeof paths)[]).map((p) => (
        <div key={p} className="flex flex-col gap-0.5">
          <span className="text-xs text-[#4d5156]">{host}{paths[p] ? ` › ${paths[p].slice(1)}` : ''}</span>
          <span className="text-lg leading-snug text-[#1a0dab]">{seo.pages[p].title}</span>
          <span className="line-clamp-2 text-sm text-[#4d5156]">{seo.pages[p].description}</span>
        </div>
      ))}
      {og && (
        <div className="overflow-hidden rounded-xl border border-[#dadce0]">
          <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wider text-[#5f6368]">Share preview</p>
          <img src={og.url} alt="" className="mt-2 aspect-[1.91/1] w-full object-cover" />
          <div className="p-3"><p className="text-xs uppercase text-[#5f6368]">{host}</p><p className="font-semibold">{seo.pages.home.title}</p></div>
        </div>
      )}
    </div>
  );
}
