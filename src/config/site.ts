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
  { label: 'Accuracy', target: 99.2, suffix: '%', decimals: 1 },
  { label: 'Monitoring', target: 24, suffix: '/7', decimals: 0 },
  { label: 'Reduced manual work', target: 80, suffix: '%', decimals: 0 }
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
  title: 'Margin | Amazon FBA Reimbursement Workflow Automation',
  description: 'Margin manages Amazon FBA reimbursement workflows after discrepancies are identified: evidence collection, filing, disputes, and payout reconciliation.',
  url: 'https://margin-finance.com',
  image: 'https://margin-finance.com/margin-logo-reveal.gif',
  preloadImages: []
};

