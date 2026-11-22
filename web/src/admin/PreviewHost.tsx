import { useEffect, useRef, useState } from 'react';
import type { SitePage } from '@faction/shared';
import { ContentProvider } from '../content/ContentContext';
import { Header } from '../site/Header';
import { Footer } from '../site/Footer';
import Home from '../site/pages/Home';
import About from '../site/pages/About';
import Media from '../site/pages/Media';
import Faq from '../site/pages/Faq';
import Contact from '../site/pages/Contact';
import { PREVIEW_MSG, type PreviewMessage } from './Preview';

const PAGES: Record<SitePage, () => React.ReactNode> = { home: Home, about: About, media: Media, faq: Faq, contact: Contact };

/** Runs inside the preview iframe; renders whatever draft content the editor posts. */
export default function PreviewHost() {
  const [msg, setMsg] = useState<PreviewMessage | null>(null);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin || (e.data as PreviewMessage)?.type !== PREVIEW_MSG) return;
      setMsg(e.data as PreviewMessage);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage('faction-preview-ready', location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const lastFocus = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!msg?.focus || msg.focus === lastFocus.current) return;
    lastFocus.current = msg.focus;
    requestAnimationFrame(() => document.querySelector(`[data-section="${msg.focus}"]`)?.scrollIntoView({ block: 'start' }));
  }, [msg]);
  useEffect(() => { if (msg) document.documentElement.style.setProperty('--accent', msg.content.sections.site.accentColor); }, [msg]);
  if (!msg) return <div className="grid min-h-screen place-items-center text-muted">Loading preview…</div>;
  const Page = PAGES[msg.page];
  return (
    <div onClickCapture={(e) => { if ((e.target as HTMLElement).closest('a')) e.preventDefault(); }}>
      <ContentProvider value={msg.content}>
        <Header />
        <main><Page /></main>
        <Footer />
      </ContentProvider>
    </div>
  );
}
