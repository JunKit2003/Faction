import { Hero } from '../home/Hero';
import { Ticker } from '../home/Ticker';
import { Services } from '../home/Services';
import { Stats } from '../home/Stats';
import { Process } from '../home/Process';
import { Reasons } from '../home/Reasons';
import { MapBlock } from '../home/MapBlock';
import { useAfterFirstPaint } from '../../content/useAfterFirstPaint';

export default function Home() {
  const rest = useAfterFirstPaint();
  return (
    <>
      <Hero />
      {rest ? (
        <>
          <Ticker />
          <Services />
          <Stats />
          <Process />
          <Reasons />
          <MapBlock />
        </>
      ) : <div className="min-h-screen" aria-hidden />}
    </>
  );
}
