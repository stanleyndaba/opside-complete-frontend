import { useEffect } from 'react';

const NOINDEX_PREFIXES = [
  '/app',
  '/auth',
  '/payment',
  '/admin',
  '/login',
  '/connect-amazon',
  '/connect-amazon-account',
  '/stripe',
  '/integrations-hub',
  '/cases',
  '/recoveries',
  '/filing-pipeline',
  '/approved-reimbursements',
  '/dispute-cases',
  '/appeals',
  '/sync',
  '/settings',
  '/reconnect-amazon',
  '/billing',
  '/history',
  '/upcoming-payments',
  '/pricing-adjust',
  '/system-error-preview',
];

const NOINDEX_EXACT = new Set([
  '/designsimulate',
  '/platformsimulate',
  '/platformfly',
  '/accuracy-graph',
  '/timeline-simulation',
  '/readiness-simulate',
  '/memory-simulate',
  '/reconciliation-simulate',
  '/scatterdesign',
  '/countdown',
  '/plane',
  '/closingcta',
  '/claimsimulate',
  '/filesimulate',
  '/clocksimulate',
  '/rejectsimulate',
  '/staresimulate',
  '/discrepancysimulate',
  '/reframesimulate',
  '/discoverysimulate',
  '/statementsimulate',
  '/comparisonsimulate',
  '/finality',
  '/finalpayoffsimulate',
  '/evidence-chase',
  '/evidence-insight',
  '/launch-countdown',
  '/giving-up',
  '/results-scroll',
  '/supplier-chat',
  '/google-drive',
  '/intro-pain',
  '/action-simulate',
  '/rejection-screen',
  '/card-review',
  '/founding-500/status',
  '/AppealSimulate',
  '/appealsimulate',
]);

const setRobotsMeta = (content: string) => {
  let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'robots');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

export const usePrivateRouteRobots = (pathname: string) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const shouldNoindex =
      NOINDEX_EXACT.has(pathname) ||
      NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    if (shouldNoindex) {
      setRobotsMeta('noindex, nofollow');
    }
  }, [pathname]);
};
