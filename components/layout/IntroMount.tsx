'use client';

import { Loader } from '@/components/sections/Loader';
import { useIntro } from '@/lib/IntroContext';

// Mount conditionnel du Loader. Le layout racine est un Server Component donc
// ne peut pas lire le Context — ce petit wrapper client fait le pont. Démonté
// dès que introDone passe à true (après animation ou skip), ou jamais monté
// si déjà-joué / reduced-motion.
export function IntroMount() {
  const { introDone } = useIntro();
  if (introDone) return null;
  return <Loader />;
}
