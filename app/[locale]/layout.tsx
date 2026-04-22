import '../globals.css';

import { Inter, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Header } from '@/components/layout/Header';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { locales, type Locale } from '@/i18n';
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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL('https://leosauvey.fr'),
  title: {
    default: 'Léo Sauvey — Développeur Freelance',
    template: '%s · Léo Sauvey',
  },
  description:
    'Développeur freelance. Je conçois et livre des sites, apps et outils sur mesure.',
};

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
            {/* Skip link a11y (brief §10.2) */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-bg-1 focus:px-4 focus:py-2 focus:text-text-0"
            >
              Skip to content
            </a>
            <SmoothScroll />
            <Header />
            <main id="main">{children}</main>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
