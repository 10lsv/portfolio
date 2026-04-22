import type { Config } from 'tailwindcss';

// Note: Tailwind v4 utilise avant tout le `@theme` défini dans `app/globals.css`
// pour les tokens. Ce fichier reste pour l'autodiscovery de contenu et de
// préciser le mode sombre en `class` (piloté par next-themes).
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
};

export default config;
