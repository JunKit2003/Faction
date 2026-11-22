import type { CSSProperties } from 'react';
import { useMedia } from './ContentContext';

interface Props {
  id: string | undefined;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  alt?: string;
  priority?: boolean;
}

/** Responsive image from the media library (webp srcset, intrinsic size to avoid layout shift). */
export function Img({ id, sizes = '100vw', className, style, alt, priority }: Props) {
  const m = useMedia(id);
  if (!m) return null;
  return (
    <img
      src={m.url}
      srcSet={m.srcset || undefined}
      sizes={m.srcset ? sizes : undefined}
      width={m.width || undefined}
      height={m.height || undefined}
      alt={alt ?? m.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={className}
      style={style}
      draggable={false}
    />
  );
}
