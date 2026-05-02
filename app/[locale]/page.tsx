import { setRequestLocale } from 'next-intl/server';

import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/sections/Footer';
import { Hero } from '@/components/sections/Hero';
import { Projects } from '@/components/sections/Projects';

// V6 sprint chirurgical : section About retirée — composant supprimé,
// item burger retiré, i18n nettoyée. Le portfolio est désormais Hero
// → Projects → Contact → Footer.
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Projects />
      <Contact />
      <Footer />
    </>
  );
}
