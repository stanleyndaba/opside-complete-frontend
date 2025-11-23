export type LanguageOption = {
  code: string;
  country: string;
  language: string;
  flag: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', country: 'Global', language: 'English', flag: '🇺🇸' },
  { code: 'es', country: 'Global', language: 'Spanish', flag: '🇪🇸' },
  { code: 'zh', country: 'Global', language: 'Chinese (Mandarin)', flag: '🇨🇳' },
  { code: 'fr', country: 'Global', language: 'French', flag: '🇫🇷' },
  { code: 'de', country: 'Global', language: 'German', flag: '🇩🇪' },
  { code: 'ja', country: 'Global', language: 'Japanese', flag: '🇯🇵' },
  { code: 'ar', country: 'Global', language: 'Arabic', flag: '🇸🇦' },
];

export const HERO_METRICS = [
  { label: 'accuracy', target: 99.2, suffix: '%', decimals: 1 },
  { label: 'monitoring', target: 24, suffix: '/7', decimals: 0 },
  { label: 'reduced manual work', target: 80, suffix: '%', decimals: 0 }
];

export const AGENT_HIGHLIGHTS = [
  {
    title: 'Discovery (Agent 3)',
    description: 'Audits ledgers in milliseconds to find hidden claims humans miss.',
    accentClass: 'bg-gray-900'
  },
  {
    title: 'Auto-Evidence (Agent 5)',
    description: 'Securely hunts your email & drive for invoices. Zero manual uploads.',
    accentClass: 'bg-gray-800'
  },
  {
    title: '24/7 Recoveries (Agent 8)',
    description: 'Monitors every claim around the clock. If Amazon stalls, we flag it.',
    accentClass: 'bg-gray-700'
  },
  {
    title: 'Finance (Agent 9)',
    description: 'Confirms the actual deposit hit your bank before we count it.',
    accentClass: 'bg-gray-600'
  }
];

export const SITE_META = {
  title: 'Clario | Autonomous Amazon FBA Reimbursements',
  description: 'Clario’s 11-agent system finds, files, and tracks Amazon FBA reimbursements automatically with 99.2% accuracy.',
  url: 'https://clario.app',
  image: '/og-image.png',
  preloadImages: ['/gmailicon.png', '/outlookicon.webp', '/gd.png']
};

