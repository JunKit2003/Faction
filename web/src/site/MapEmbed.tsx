import { useSection } from '../content/ContentContext';

export function MapEmbed({ title }: { title: string }) {
  const { mapEmbedUrl } = useSection('site');
  return (
    <div className="card relative aspect-[4/3] overflow-hidden p-0 sm:aspect-[16/8]">
      <iframe
        title={title}
        src={mapEmbedUrl}
        className="map-frame absolute inset-0 h-full w-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
