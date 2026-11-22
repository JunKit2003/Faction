import { Hero } from '../home/Hero';
import { Marquee } from '../home/Marquee';
import { Services } from '../home/Services';
import { Stats } from '../home/Stats';
import { Process } from '../home/Process';
import { MapBlock } from '../home/MapBlock';
import { useAfterFirstPaint } from '../../content/useAfterFirstPaint';

export default function Home() {
  const rest = useAfterFirstPaint();
  return (
    <>
      <Hero />
      <Marquee />
      {rest ? (
        <>
          <Services />
          <Stats />
          <Process />
          <MapBlock />
        </>
      ) : <div className="min-h-screen" aria-hidden />}
    </>
  );
}
