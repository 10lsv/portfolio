import '../globals.css';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
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
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* JSON-LD Person inline. Stringify déterministe → pas de FOUC SEO,
            indexable au premier byte rendu. */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personSchema(locale)),
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          inter.variable,
          jetbrainsMono.variable,
          'bg-bg-0 text-text-0 font-sans antialiased',
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale as Locale} messages={messages}>
            <IntroProvider>
              {/* Skip link a11y (brief §10.2) */}
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-bg-1 focus:px-4 focus:py-2 focus:text-text-0"
              >
                Skip to content
              </a>
              <SmoothScroll />
              <IntroMount />
              <Header />
              <main id="main">{children}</main>
            </IntroProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        {/* Vercel Analytics + Speed Insights : no-op en local/dev, actifs
            une fois déployé sur Vercel. Privacy-friendly, zéro cookie. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
