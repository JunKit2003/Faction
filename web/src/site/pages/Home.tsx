import { Hero } from '../home/Hero';
import { Marquee } from '../home/Marquee';
import { Services } from '../home/Services';
import { Stats } from '../home/Stats';
import { Process } from '../home/Process';
import { MapBlock } from '../home/MapBlock';

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Services />
      <Stats />
      <Process />
      <MapBlock />
    </>
  );
}
