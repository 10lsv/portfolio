import { getTranslations, setRequestLocale } from 'next-intl/server';

import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/sections/Footer';
import { Hero } from '@/components/sections/Hero';
import { TechStack } from '@/components/sections/TechStack';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('projectsStub');

  return (
    <>
      <Hero />
      <About />
      <TechStack />

      {/* Stub Projects — ancre #projects pour le burger menu, contenu Sprint 3 */}
      <section
        id="projects"
        className="flex min-h-[60vh] items-center justify-center px-6"
        aria-label="Projects (stub)"
      >
        <p className="font-mono text-text-2 text-xs uppercase tracking-[0.2em]">
          {t('label')}
        </p>
      </section>

      <Contact />
      <Footer />
    </>
  );
}
