import { SITE_META } from './site';

export type RouteMeta = {
  path: string;
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  image: string;
  robots?: string;
};

const siteUrl = SITE_META.url.replace(/\/$/, '');

const routeUrl = (path: string) => `${siteUrl}${path === '/' ? '/' : path}`;

export const PUBLIC_ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    path: '/',
    title: SITE_META.title,
    description: SITE_META.description,
    canonical: routeUrl('/'),
    ogTitle: SITE_META.title,
    ogDescription:
      'For Amazon FBA sellers with an unresolved recovery or recurring recovery work: see what is supported, approve the work that moves forward, and understand the payout outcome.',
    ogUrl: routeUrl('/'),
    image: SITE_META.image,
  },
  '/pricing': {
    path: '/pricing',
    title: 'Margin Pricing | Evidence-Ready Amazon Reimbursement Workflows',
    description:
      'Keep your approved recoveries. Pay for the system, not a percentage of every reimbursement. Choose the tier that fits your operational scale.',
    canonical: routeUrl('/pricing'),
    ogTitle: 'Margin Pricing | Evidence-Ready Amazon Reimbursement Workflows',
    ogDescription:
      'Keep your approved recoveries with Margin pricing built around recovery management, evidence workflow, and seller-controlled filing.',
    ogUrl: routeUrl('/pricing'),
    image: SITE_META.image,
  },
  '/amazon-fba-reimbursement': {
    path: '/amazon-fba-reimbursement',
    title: 'Amazon FBA Reimbursement Service | Margin',
    description:
      'Recover money Amazon owes your business. Margin identifies reimbursement opportunities, organizes evidence, manages claim filing, handles disputes, and tracks payouts through resolution.',
    canonical: routeUrl('/amazon-fba-reimbursement'),
    ogTitle: 'Amazon FBA Reimbursement Service | Margin',
    ogDescription:
      'Margin helps Amazon sellers recover money by identifying FBA reimbursement issues, organizing evidence, managing filing, handling disputes, and reconciling payouts.',
    ogUrl: routeUrl('/amazon-fba-reimbursement'),
    image: SITE_META.image,
  },
  '/amazon-lost-inventory-reimbursement': {
    path: '/amazon-lost-inventory-reimbursement',
    title: 'Amazon Lost Inventory Reimbursement | Margin',
    description:
      'Recover money tied to lost Amazon inventory. Margin identifies inventory discrepancies, organizes supporting evidence, manages claim preparation, and tracks reimbursement outcomes through resolution.',
    canonical: routeUrl('/amazon-lost-inventory-reimbursement'),
    ogTitle: 'Amazon Lost Inventory Reimbursement | Margin',
    ogDescription:
      'Margin helps Amazon sellers identify lost inventory discrepancies, organize evidence, prepare claims, and track reimbursement outcomes through resolution.',
    ogUrl: routeUrl('/amazon-lost-inventory-reimbursement'),
    image: SITE_META.image,
  },
  '/amazon-reimbursement-audit': {
    path: '/amazon-reimbursement-audit',
    title: 'Amazon Reimbursement Audit | Margin',
    description:
      'Identify reimbursement opportunities across inventory losses, shipment discrepancies, fee errors, and payout mismatches. Margin helps organize audit findings into actionable recovery workflows.',
    canonical: routeUrl('/amazon-reimbursement-audit'),
    ogTitle: 'Amazon Reimbursement Audit | Margin',
    ogDescription:
      'Margin turns Amazon reimbursement audit findings across inventory, shipment, fee, and payout discrepancies into actionable recovery workflows.',
    ogUrl: routeUrl('/amazon-reimbursement-audit'),
    image: SITE_META.image,
  },
  '/amazon-inbound-shipment-shortage': {
    path: '/amazon-inbound-shipment-shortage',
    title: 'Amazon Inbound Shipment Shortage Reimbursement | Margin',
    description:
      'Track inbound shipment shortages, organize shipment evidence, and monitor reimbursement eligibility before claim windows expire.',
    canonical: routeUrl('/amazon-inbound-shipment-shortage'),
    ogTitle: 'Amazon Inbound Shipment Shortage Reimbursement | Margin',
    ogDescription:
      'Margin helps Amazon sellers track inbound shipment shortages, organize shipment evidence, and monitor reimbursement eligibility before claim windows expire.',
    ogUrl: routeUrl('/amazon-inbound-shipment-shortage'),
    image: SITE_META.image,
  },
  '/amazon-fee-overcharge-reimbursement': {
    path: '/amazon-fee-overcharge-reimbursement',
    title: 'Amazon Fee Overcharge Reimbursement | Margin',
    description:
      'Identify fee discrepancies, measurement errors, and overcharges. Margin helps structure evidence and recovery workflows around fee-related reimbursement opportunities.',
    canonical: routeUrl('/amazon-fee-overcharge-reimbursement'),
    ogTitle: 'Amazon Fee Overcharge Reimbursement | Margin',
    ogDescription:
      'Margin helps Amazon sellers identify fee discrepancies, measurement errors, and overcharge signals, then structure evidence and recovery workflows around them.',
    ogUrl: routeUrl('/amazon-fee-overcharge-reimbursement'),
    image: SITE_META.image,
  },
  '/getida-alternative': {
    path: '/getida-alternative',
    title: 'GETIDA Alternative | Margin',
    description:
      'Compare GETIDA and Margin. Learn how Amazon reimbursement workflows differ, from discrepancy detection through evidence collection, filing, disputes, and payout reconciliation.',
    canonical: routeUrl('/getida-alternative'),
    ogTitle: 'GETIDA Alternative | Margin',
    ogDescription:
      'Compare GETIDA and Margin workflow differences across discrepancy detection, evidence collection, filing, disputes, and payout reconciliation.',
    ogUrl: routeUrl('/getida-alternative'),
    image: SITE_META.image,
  },
  '/sellerboard-alternative': {
    path: '/sellerboard-alternative',
    title: 'Sellerboard Alternative | Margin',
    description:
      'Compare Sellerboard and Margin. Learn how reimbursement workflows differ from discrepancy detection through evidence collection, filing, dispute handling, and payout reconciliation.',
    canonical: routeUrl('/sellerboard-alternative'),
    ogTitle: 'Sellerboard Alternative | Margin',
    ogDescription:
      'Compare Sellerboard and Margin workflow differences across discrepancy detection, evidence collection, filing support, dispute handling, and payout reconciliation.',
    ogUrl: routeUrl('/sellerboard-alternative'),
    image: SITE_META.image,
  },
  '/research': {
    path: '/research',
    title: 'FBA Reimbursement Research | Margin',
    description:
      'How Amazon sellers evaluate FBA reimbursement software, audit services, documentation, filing workflow, eligibility, deadlines, and payout tracking.',
    canonical: routeUrl('/research'),
    ogTitle: 'FBA Reimbursement Research | Margin',
    ogDescription:
      'A research hub for comparing FBA reimbursement tools, audit services, evidence workflows, filing control, and payout tracking.',
    ogUrl: routeUrl('/research'),
    image: SITE_META.image,
  },
  '/fba-reimbursement-research': {
    path: '/fba-reimbursement-research',
    title: 'Amazon FBA Reimbursement Research | Margin',
    description:
      'Research for Amazon sellers comparing FBA reimbursement software, audit workflows, claim eligibility, evidence documentation, and recovery tracking.',
    canonical: routeUrl('/fba-reimbursement-research'),
    ogTitle: 'Amazon FBA Reimbursement Research | Margin',
    ogDescription:
      'Compare Amazon FBA reimbursement workflows by detection depth, evidence quality, filing control, deadlines, and payout visibility.',
    ogUrl: routeUrl('/fba-reimbursement-research'),
    image: SITE_META.image,
  },
  '/about-margin': {
    path: '/about-margin',
    title: 'About Margin | Operating System for FBA Recovery',
    description:
      'Margin is building an operating system for Amazon FBA recovery: detection, evidence collection, filing readiness, and payout tracking in one continuous workflow.',
    canonical: routeUrl('/about-margin'),
    ogTitle: 'About Margin | Operating System for FBA Recovery',
    ogDescription:
      'Learn how Margin connects Amazon FBA recovery detection, evidence collection, filing readiness, and payout tracking in one workflow.',
    ogUrl: routeUrl('/about-margin'),
    image: SITE_META.image,
  },
  '/early-access': {
    path: '/early-access',
    title: 'Free Amazon FBA Evidence Scan | Margin',
    description:
      'Margin is the only FBA recovery agent that retrieves the Bill of Lading and Invoices to prove your case. Start a free evidence scan - no payment required.',
    canonical: routeUrl('/early-access'),
    ogTitle: 'Free Amazon FBA Evidence Scan | Margin',
    ogDescription:
      'Start a Margin evidence scan for Amazon FBA recovery cases, with read-only setup and seller approval before filing.',
    ogUrl: routeUrl('/early-access'),
    image: SITE_META.image,
  },
  '/contact': {
    path: '/contact',
    title: 'Contact Support | Margin',
    description:
      'Contact Margin for support, onboarding, billing, API access, or recovery workflow questions.',
    canonical: routeUrl('/contact'),
    ogTitle: 'Contact Support | Margin',
    ogDescription:
      'Reach the Margin team for onboarding, support, billing, API access, and Amazon recovery workflow questions.',
    ogUrl: routeUrl('/contact'),
    image: SITE_META.image,
  },
  '/sales': {
    path: '/sales',
    title: 'Institutional Inquiry | Margin',
    description:
      'Connect with the Margin team for high-velocity seller solutions and strategic inventory arbitrage.',
    canonical: routeUrl('/sales'),
    ogTitle: 'Institutional Inquiry | Margin',
    ogDescription:
      'Talk with Margin about high-velocity seller recovery workflows, multi-marketplace operations, and strategic inventory recovery infrastructure.',
    ogUrl: routeUrl('/sales'),
    image: SITE_META.image,
  },
  '/privacy': {
    path: '/privacy',
    title: 'Privacy Policy | Margin',
    description: "Privacy Policy for Margin's automated FBA auditing platform.",
    canonical: routeUrl('/privacy'),
    ogTitle: 'Privacy Policy | Margin',
    ogDescription:
      'Read the Margin privacy policy for Amazon FBA recovery workflows, connected data, and platform operations.',
    ogUrl: routeUrl('/privacy'),
    image: SITE_META.image,
  },
  '/terms': {
    path: '/terms',
    title: 'Terms of Service | Margin',
    description: "Terms of Service governing use of Margin's automated FBA auditing platform.",
    canonical: routeUrl('/terms'),
    ogTitle: 'Terms of Service | Margin',
    ogDescription:
      'Review the Margin terms of service for use of the Amazon FBA recovery and auditing platform.',
    ogUrl: routeUrl('/terms'),
    image: SITE_META.image,
  },
  '/refund-policy': {
    path: '/refund-policy',
    title: 'Refund Policy | Margin',
    description:
      'Review our refund and cancellation policy for the Margin FBA reimbursement platform.',
    canonical: routeUrl('/refund-policy'),
    ogTitle: 'Refund Policy | Margin',
    ogDescription:
      'Review Margin refund and cancellation terms for FBA reimbursement workflows and platform access.',
    ogUrl: routeUrl('/refund-policy'),
    image: SITE_META.image,
  },
};

export const PUBLIC_PRERENDER_ROUTES = Object.keys(PUBLIC_ROUTE_META);

export const getPublicRouteMeta = (path: string) =>
  PUBLIC_ROUTE_META[path.replace(/\/$/, '') || '/'];
