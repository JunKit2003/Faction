import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { MediaView } from '@faction/shared';
import type { MediaTable } from '../db/types.js';
import { HttpError } from '../http.js';

export const UPLOAD_COPY = 'Only JPG, PNG or WebP images up to 15 MB.';
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const WIDTHS = [480, 960, 1600, 2400] as const;
const MAX_W = 2400;

export interface ProcessedImage { filename: string; mime: string; width: number; height: number }

const UNSAFE_SVG = /<script|<foreignObject|<iframe|<embed|<object|\son[a-z]+\s*=|javascript:|data:text\/html|<!ENTITY/i;

/** Final widths generated for an image of this (already capped) width. */
export const variantWidths = (width: number) => [...WIDTHS.filter((w) => w < width), width];

/** Validates by content (not filename), resizes to webp variants and strips metadata. */
export async function processImage(buf: Buffer, id: string, opts: { allowSvg: boolean; uploadDir: string }): Promise<ProcessedImage> {
  await fs.mkdir(opts.uploadDir, { recursive: true });
  const head = buf.subarray(0, 1024).toString('utf8').trimStart();
  const looksSvg = /^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head);

  if (looksSvg) {
    const text = buf.toString('utf8');
    if (!opts.allowSvg || UNSAFE_SVG.test(text)) throw new HttpError(415, UPLOAD_COPY);
    let meta: sharp.Metadata;
    try { meta = await sharp(buf).metadata(); } catch { throw new HttpError(415, UPLOAD_COPY); }
    if (meta.format !== 'svg') throw new HttpError(415, UPLOAD_COPY);
    const filename = `${id}.svg`;
    await fs.writeFile(path.join(opts.uploadDir, filename), buf);
    return { filename, mime: 'image/svg+xml', width: meta.width ?? 0, height: meta.height ?? 0 };
  }

  let meta: sharp.Metadata;
  try { meta = await sharp(buf).metadata(); } catch { throw new HttpError(415, UPLOAD_COPY); }
  if (!['jpeg', 'png', 'webp'].includes(meta.format ?? '')) throw new HttpError(415, UPLOAD_COPY);

  // Respect EXIF orientation, then drop all metadata (sharp strips it unless asked to keep it).
  const oriented = sharp(buf).rotate();
  const { info } = await oriented.clone().toBuffer({ resolveWithObject: true });
  const width = Math.min(info.width, MAX_W);
  const height = Math.round((info.height * width) / info.width);
  const widths = variantWidths(width);
  try {
    await Promise.all(widths.map((w) =>
      oriented.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(opts.uploadDir, `${id}-${w}.webp`))));
  } catch {
    throw new HttpError(415, UPLOAD_COPY);
  }
  return { filename: `${id}-${width}.webp`, mime: 'image/webp', width, height };
}

export function mediaView(row: Pick<MediaTable, 'id' | 'filename' | 'mime' | 'width' | 'height' | 'alt'>): MediaView {
  const url = `/uploads/${row.filename}`;
  const srcset = row.mime === 'image/webp'
    ? variantWidths(row.width).map((w) => `/uploads/${row.id}-${w}.webp ${w}w`).join(', ')
    : '';
  return { id: row.id, url, srcset, width: row.width, height: row.height, alt: row.alt, mime: row.mime };
}
