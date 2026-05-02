import '../globals.css';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Anton, Archivo_Black, Inter, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Header } from '@/components/layout/Header';
import { IntroMount } from '@/components/layout/IntroMount';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { locales, defaultLocale, type Locale } from '@/i18n';
import { IntroProvider } from '@/lib/IntroContext';
import { cn } from '@/lib/cn';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jbmono',
  display: 'swap',
});

// Anton — Google Fonts, OFL license, weight 400 unique. Condensed sans-serif
// angulaire, vibe éditorial magazine de mode (Vogue / AnOther / Numéro).
// Utilisée UNIQUEMENT pour le H1 du hero via la classe `.font-anton` (cf.
// globals.css) — le reste du site garde Clash Display Bold pour les autres
// titres (cohérence DA globale).
const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
});

// Archivo Black — Google Fonts, OFL, weight 400 unique. Large geometric
// heavy sans-serif. Hero V3 : statement bold outline rouge bordeaux qui
// matche directement la bannière LinkedIn de Léo (LSV outline rouge sur
// noir). Scopée au H1 hero via `.font-archivo-black` (cf. globals.css).
const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-archivo-black',
  display: 'swap',
});

const SITE_URL = 'https://leosauvey.fr';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// generateMetadata async : on lit les strings traduites via getTranslations
// pour aligner title/description sur la locale du segment. metadataBase est
// requis pour que les URLs OG relatives (ex. `/api/og?locale=fr`) soient
// expandées en absolu côté SSR (Next compose `og.image` avec metadataBase).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = (locales as readonly string[]).includes(locale)
    ? locale
    : defaultLocale;

  const t = await getTranslations({ locale: safeLocale, namespace: 'meta' });
  const title = t('title');
  const description = t('description');

  // hreflang : on liste toutes les variantes pour Google + x-default sur la
  // locale par défaut (FR). `canonical` pointe sur la locale courante pour
  // dédupliquer les pages quasi-identiques entre /fr et /en.
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((l) => [l, `${SITE_URL}/${l}`]),
  );
  languages['x-default'] = `${SITE_URL}/${defaultLocale}`;

  const ogImage = `/api/og?locale=${safeLocale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: '%s · Léo Sauvey',
    },
    description,
    alternates: {
      canonical: `/${safeLocale}`,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${safeLocale}`,
      siteName: 'Léo Sauvey',
      type: 'website',
      locale: safeLocale === 'fr' ? 'fr_FR' : 'en_US',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'Léo Sauvey — Portfolio',
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// JSON-LD Person schema (brief §6.10). Inline `<script type="application/
// ld+json">` plutôt que next/script : SSR direct dans le HTML initial,
// indexable immédiatement par les crawlers, pas de dépendance au runtime
// d'hydratation. Pattern recommandé Google + Vercel docs.
function personSchema(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Léo Sauvey',
    jobTitle:
      locale === 'fr' ? 'Développeur Freelance' : 'Freelance Developer',
    url: SITE_URL,
    sameAs: [
      'https://github.com/10lsv',
      'https://www.linkedin.com/in/léo-sauvey/',
    ],
    alumniOf: {
      '@type': 'EducationalOrganization',
      name: 'Supinfo',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Caen',
      addressCountry: 'FR',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    // suppressHydrationWarning sur <html> (en plus de <body> + <script> JSON-LD).
    // Sprint mobile : l'erreur d'hydration persistait sur Safari iOS / Chrome
    // mobile, déclenchée par des extensions navigateur (Bitdefender, Honey,
    // Grammarly, 1Password, anti-tracker) qui injectent des attributs sur le
    // <html> avant l'hydration React (className, data-*, style theme color).
    // Le warning n'occulte PAS les vraies erreurs d'hydration (mismatch React
    // structure/contenu) — il filtre uniquement le bruit DOM externe.
    // NE PAS RETIRER : si on l'enlève, l'erreur revient en console mobile et
    // pollue le DevTools (mauvaise expérience review).
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* JSON-LD Person inline. Stringify déterministe → pas de FOUC SEO,
            indexable au premier byte rendu. suppressHydrationWarning
            indispensable : extensions navigateur (Honey, Grammarly, LastPass)
            mutent souvent les <script> avant l'hydration React, faux positif
            d'hydration mismatch sinon. Le JSON-LD reste fonctionnel pour
            Google qui le lit du HTML serveur, pas du DOM client. */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personSchema(locale)),
          }}
        />
      </head>
      <body
        // suppressHydrationWarning ré-ajouté : extensions navigateur
        // (Bitdefender Internet Security ajoute `bis_register`, Norton,
        // 1Password, Grammarly, Honey) injectent des attributs sur le
        // <body> avant l'hydration React → faux positif d'hydration
        // mismatch dans la console. Le warning n'occulte PAS les
        // vraies erreurs d'hydration (déclenchées par contenu/structure
        // mismatch côté React, pas par attributs HTML externes).
        suppressHydrationWarning
        className={cn(
          inter.variable,
          jetbrainsMono.variable,
          anton.variable,
          archivoBlack.variable,
          // V6 light-only : bg-bg-0 = blanc pur, text-text-1 = noir pur.
          'bg-bg-0 text-text-1 font-sans antialiased',
        )}
      >
        <NextIntlClientProvider locale={locale as Locale} messages={messages}>
          <IntroProvider>
            {/* Skip link a11y (brief §10.2) */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-bg-1 focus:px-4 focus:py-2 focus:text-text-1"
            >
              Skip to content
            </a>
            <SmoothScroll />
            <IntroMount />
            <Header />
            <main id="main">{children}</main>
          </IntroProvider>
        </NextIntlClientProvider>
        {/* Vercel Analytics + Speed Insights : no-op en local/dev, actifs
            une fois déployé sur Vercel. Privacy-friendly, zéro cookie. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
