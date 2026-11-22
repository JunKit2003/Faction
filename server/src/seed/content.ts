import type { AllSections } from '@faction/shared';

/** Images shipped in server/seed/assets, keyed by a stable seed name. */
export const SEED_IMAGES = {
  hero1: { file: 'hero1.jpeg', alt: 'Mountain biking backdrop' },
  hero3: { file: 'hero3.jpg', alt: '' },
  hero4: { file: 'hero4.jpg', alt: '' },
  image1: { file: 'image1.jpg', alt: 'Mechanic tuning a mountain bike drivetrain' },
  image2: { file: 'image2.jpg', alt: 'Custom mountain bike builds' },
  image3: { file: 'image3.jpg', alt: 'Professional mountain bike servicing' },
  image4: { file: 'image4.jpg', alt: 'Trailside convenience near Bukit Kiara' },
  image5: { file: 'image5.jpg', alt: '' },
  image6: { file: 'image6.jpg', alt: '' },
  logoOnLight: { file: 'faction_logo_dark.png', alt: 'Faction Bikeworks' },
  logoOnDark: { file: 'faction_logo_light.png', alt: 'Faction Bikeworks' },
  favicon: { file: 'faction_logo_tab.png', alt: 'Faction Bikeworks' },
} as const;
export type SeedImage = keyof typeof SEED_IMAGES;

const open = (o: string, c: string) => ({ closed: false, open: o, close: c });

/** Content copied verbatim from the original static site (except hours wording, see design doc). */
export function seedSections(id: (k: SeedImage) => string): AllSections {
  return {
    site: {
      name: 'Faction Bikeworks',
      accentColor: '#c6ff3d',
      logoOnLightId: id('logoOnLight'),
      logoOnDarkId: id('logoOnDark'),
      faviconId: id('favicon'),
      openedYear: 2022,
      whatsappNumber: '601133321767',
      address: 'G-8, Wisma WIM, Jln Abang Haji Openg, Taman Tun Dr Ismail, 60000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur',
      hours: {
        mon: open('11:00', '19:30'), tue: open('11:00', '19:30'), wed: open('11:00', '19:30'), thu: open('11:00', '19:30'), fri: open('11:00', '19:30'),
        sat: open('11:00', '16:00'), sun: { closed: true, open: '', close: '' },
      },
      mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.8152425930216!2d101.63243349999999!3d3.1434208000000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc495f03e40a99%3A0x50f6e08edd4ee8b8!2sFaction%20Bikeworks!5e0!3m2!1sen!2smy!4v1756885931094!5m2!1sen!2smy',
      socials: [
        { platform: 'instagram', url: 'https://www.instagram.com/faction.my' },
        { platform: 'facebook', url: 'https://www.facebook.com/faction.my/' },
        { platform: 'whatsapp', url: 'https://wa.me/601133321767' },
      ],
      labels: { hours: 'Hours', address: 'Address', contact: 'Contact', open: 'Open now', closed: 'Closed, gone riding' },
      coordinates: '3.1434° N, 101.6324° E',
    },
    nav: {
      items: [
        { label: 'Home', path: '/' },
        { label: 'About', path: '/about' },
        { label: 'Media', path: '/media' },
        { label: 'FAQ', path: '/faq' },
        { label: 'Contact', path: '/contact' },
      ],
      ctaIndex: 4,
    },
    'home.hero': {
      eyebrow: 'Bukit Kiara · Kuala Lumpur',
      title: 'Ride _hard._ We’ll keep you *rolling.*',
      badgeTitle: 'Same-day fixes',
      badgeText: 'Minor tuning and repairs while you ride.',
      badgeImageIds: [id('image3'), id('image4')],
      text: 'Your dedicated mountain bike service shop beside the Bukit Kiara trails. From precision suspension tuning to full rebuilds — drop in before you drop in.',
      primary: { label: 'Book a Service', href: '/contact#booking' },
      secondary: { label: 'About the Shop', href: '/about' },
      slideIds: [id('hero1'), id('hero3'), id('hero4')],
    },
    'home.ticker': {
      items: ['Suspension service', 'Wheel building', 'Brake bleeds', 'Custom builds', 'Full tune & diagnostics', 'e-MTB friendly'],
    },
    'home.services': {
      eyebrow: 'What we do',
      title: 'Pro MTB *Services*',
      subtitle: 'Race-grade work. Rider-first advice. Same-day fixes when you need them.',
      items: [
        { title: 'Full Tune & Diagnostics', mediaId: id('image3'), text: 'We perform a complete drivetrain, brakes, wheels, and bolt check with precision indexing, typically providing a diagnosis and informing the customer of necessary repairs or services unless a full service or special request is made.' },
        { title: 'Suspension Service', mediaId: id('image4'), text: 'We provide fork lowers, air can, and damper rebuilds with OEM seals and fluids for lower leg service only; full suspension service is sent to an Authorized Suspension Service center.' },
        { title: 'Custom Builds', mediaId: id('image2'), text: 'From enduro to XC race bikes, we build and fit your dream bike using parts you source or choose from our in-stock selection—tailored for your terrain and riding goals.' },
      ],
    },
    'home.stats': {
      items: [
        { value: '1,800+', label: 'Bikes Serviced', kind: 'text' },
        { value: '500+', label: 'Suspension Overhauls', kind: 'text' },
        { value: '5.0★', label: '21 Google Reviews', kind: 'text' },
        { value: '{years}+', label: 'Years in Business', kind: 'years' },
      ],
    },
    'home.process': {
      eyebrow: 'The drill',
      title: 'How it _works._',
      steps: [
        { title: 'Check In', text: 'Drop by before or after your ride for a professional inspection and expert advice—perfect if something feels off or it’s been a while since your last service.' },
        { title: 'Service', text: 'We service with race-level attention and confirm timelines.' },
        { title: 'Test & Tune', text: 'Pick up dialed. We’ll set sag, shifting, and brake feel for you.' },
      ],
    },
    'home.reasons': {
      eyebrow: 'Why riders choose us',
      title: 'Wrenched by _riders,_ for *riders.*',
      items: [
        { icon: 'wrench', title: 'Rider-run workshop', text: 'Our mechanics ride, test, and race the gear we recommend.' },
        { icon: 'clock', title: 'Same-day fixes', text: 'Minor tuning and repairs are turned around the same day.' },
        { icon: 'map', title: 'Trailside at Kiara', text: 'Right beside the Bukit Kiara trails. Drop in before you drop in.' },
        { icon: 'shield', title: 'No surprise bills', text: 'We tell you what it needs, and ask before fitting any extra parts.' },
      ],
    },
    'home.map': { eyebrow: 'Come say hi', title: 'Riders trust *Faction*', subtitle: 'See real reviews and location on Google.' },
    'home.closer': { title: 'Get *dialled.*', text: 'Book a service, ask a question, or just roll in after your loop.', buttonLabel: 'Book a service', href: '/contact#booking' },
    about: {
      eyebrow: 'Our story',
      title: 'About Faction *Bikeworks*',
      intro: 'Born from the Bukit Kiara riding community, dedicated to precision bike service.',
      storyTitle: 'Our Story',
      story: [
        'Faction Bikeworks started as one person fixing friends’ bikes at home, and today it’s a full‑service workshop that treats every bike like it’s lining up for race day—because often, it is.',
        'We specialize in mountain bikes: suspension service, wheel building, brake bleeds, and full custom builds. Whether you ride enduro, trail, or XC, our mechanics ride, test, and race the gear we recommend.',
      ],
      imageId: id('image1'),
      secondImageId: id('image5'),
      quote: 'We treat every bike like it’s lining up for race day, because often, it is.',
      badge: 'Est. 2022 · Bukit Kiara ·',
      findTitle: 'Where to Find Us',
      findText: 'We’re located beside **Bukit Kiara** in Kuala Lumpur—Malaysia’s iconic mountain biking hotspot. Stop by for a pre-ride check or post-ride service.',
      contactLabel: 'See contact options',
    },
    media: {
      eyebrow: 'From the shop floor',
      title: 'Media *Gallery*',
      imageIds: [id('hero1'), id('hero3'), id('hero4'), id('image1'), id('image2'), id('image3'), id('image4'), id('image5'), id('image6')],
    },
    faq: {
      eyebrow: 'Good questions',
      title: 'FAQ',
      intro: 'Answers to common questions about service, bookings, pricing, and more.',
      askTitle: 'Still *stuck?*',
      askText: 'Ask the mechanic on WhatsApp. Real answers from people who ride.',
      askButton: 'Ask the mechanic',
      items: [
        { q: 'Do I need to book in advance or can I walk in?', a: 'Give us a call or just drop by! While walk-ins are cool, booking ahead speeds things up.' },
        { q: 'What are your operating hours?', a: 'We’re open {hours}.' },
        { q: 'How long does a typical service take?', a: 'Same-day service is available for minor tuning and repairs; for major services, completion times depend on availability and parts, and the mechanic will inform the customer accordingly.' },
        { q: 'Do you service e-MTBs?', a: 'Yes. We handle drivetrain, brakes, suspension, and wheels for e-MTBs. For motor or battery issues, we’ll coordinate with the brand’s authorized service center.' },
        { q: 'Can you source specific parts for custom builds?', a: 'Absolutely. Share your goals and budget, and we’ll recommend and source compatible components—from frames and forks to drivetrains and wheels.' },
        { q: 'Do you offer suspension tuning and rebuilds?', a: 'We perform air can and lowers service for forks and shocks using OEM seals and fluids, and can also tune sag, rebound, and compression for your weight and terrain; for full rebuilds, we send the components to the respective authorized service centers.' },
        { q: 'How much do common services cost?', a: 'Pricing varies depending on the bike and parts, with the mechanic informing the customer and notifying them in advance if extra parts are needed.' },
        { q: 'Where exactly are you located?', a: 'We’re beside the Bukit Kiara trail network in Kuala Lumpur. See the embedded map on the [Contact](/contact) page for directions.' },
        { q: 'Do you support emergency trailside fixes?', a: 'Yes—drop in during operating hours and we’ll do our best to get you rolling quickly with safety-first checks.' },
      ],
    },
    contact: {
      eyebrow: 'Come say hi',
      title: 'Contact & *Hours*',
      intro: 'Have a question or need a quick fix? We’re here to help.',
      getInTouchTitle: 'Get in Touch',
      formTitle: 'Quick Message',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      messageLabel: 'Message',
      messagePlaceholder: 'How can we help?',
      submitLabel: 'Send',
      whatsappHeader: 'New website enquiry',
    },
    footer: {
      tagline: 'Keep Riding, We Fixing.',
      columns: [
        { title: 'Services', links: [{ label: 'Custom Builds', href: '/contact#booking' }, { label: 'Bike Repairs', href: '/contact#booking' }] },
        { title: 'Company', links: [{ label: 'About Us', href: '/about' }, { label: 'FAQ', href: '/faq' }, { label: 'Contact', href: '/contact' }] },
      ],
      connectTitle: 'Connect',
      copyright: 'Faction Bikeworks. All rights reserved.',
    },
    seo: {
      pages: {
        home: { title: 'Faction Bikeworks | Mountain Bike Specialists in Bukit Kiara', description: 'Faction Bikeworks is a high-end mountain bike shop beside Bukit Kiara, Kuala Lumpur. Expert repairs, builds, and rider-first service.' },
        about: { title: 'About | Faction Bikeworks', description: 'About Faction Bikeworks in Bukit Kiara, Kuala Lumpur. Our story, values, and rider-first service philosophy.' },
        media: { title: 'Media Gallery | Faction Bikeworks', description: 'Photos from the shop, riders, and Bukit Kiara events.' },
        faq: { title: 'FAQ | Faction Bikeworks', description: 'Frequently asked questions about Faction Bikeworks services, bookings, pricing, and location.' },
        contact: { title: 'Contact | Faction Bikeworks', description: 'Contact Faction Bikeworks for service bookings, questions, and shop info.' },
      },
      ogImageId: id('hero1'),
    },
  };
}
