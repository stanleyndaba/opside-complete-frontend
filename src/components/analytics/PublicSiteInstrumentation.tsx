import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import {
  EARLY_ACCESS_CURRENCY,
  EARLY_ACCESS_OFFER,
  EARLY_ACCESS_VALUE_ZAR,
  PAYSTACK_EARLY_ACCESS_URL,
  PAYSTACK_PAYMENT_PROVIDER,
  trackEvent,
} from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';

const CHECKOUT_PENDING_STORAGE_KEY = 'margin_checkout_pending';
const CHECKOUT_ABANDON_AFTER_MS = 15_000;

const SEO_ROUTES = new Set([
  '/amazon-fba-reimbursement',
  '/amazon-lost-inventory-reimbursement',
  '/amazon-reimbursement-audit',
  '/amazon-inbound-shipment-shortage',
  '/amazon-fee-overcharge-reimbursement',
  '/getida-alternative',
  '/sellerboard-alternative',
  '/research',
  '/fba-reimbursement-research',
]);

const POLICY_ROUTES = new Set(['/privacy', '/terms', '/refund-policy', '/docs']);
const PAYMENT_ROUTES = new Set(['/pricing', '/currency-margin', '/payment/success', '/founding-500/status', '/pricing/standard-agreement']);
const WAITLIST_ROUTES = new Set(['/waitlist']);
const MARKETING_ROUTES = new Set(['/', '/about', '/about-margin', '/sales', '/contact', '/careers']);

const HIDDEN_DEMO_ROUTES = new Set([
  '/designsimulate',
  '/platformsimulate',
  '/documentsimulate',
  '/timeline-simulation',
  '/readiness-simulate',
  '/readiness-simulate-two',
  '/memory-simulate',
  '/reconciliation-simulate',
  '/platformfly',
  '/accuracy-graph',
  '/scatterdesign',
  '/countdown',
  '/plane',
  '/closingcta',
  '/claimsimulate',
  '/filesimulate',
  '/api-connection',
  '/evidence-analysis',
  '/evidence-match',
  '/rejection-loop',
  '/report-generation',
  '/accuracy-scaling',
  '/feedback-learning',
  '/auditable-workspace',
  '/auditable-outputs',
  '/every-case',
  '/openstatement',
  '/margin-takes-over',
  '/margin-reads',
  '/evidence-before-asked',
  '/recovery-lifecycle',
  '/learning-recovery',
  '/audit-ready-history',
  '/amazon-asks',
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
  '/AppealSimulate',
  '/appealsimulate',
  '/discrepancy-stack',
]);

const REDIRECT_ROUTES: Record<string, string> = {
  '/pricing': '/early-access',
  '/history': '/billing',
  '/upcoming-payments': '/billing',
  '/connect-amazon-account': '/connect-amazon',
};

const TENANT_REDIRECT_ROUTES = new Set([
  '/integrations-hub',
  '/recoveries',
  '/filing-pipeline',
  '/approved-reimbursements',
  '/dispute-cases',
  '/appeals',
  '/sync',
  '/settings',
  '/reconnect-amazon',
  '/billing',
  '/admin/queue',
  '/admin/users-integrations',
  '/pricing-adjust',
]);

const CTA_TEXT_PATTERNS = [
  'watch demo',
  'claim early access',
  'claim access',
  'get early access',
  'get started',
  'join waitlist',
  'start recovery',
  'connect store',
  'checkout',
  'reserve',
  'login',
  'log in',
  'enterprise',
  'request a founder-led demo',
];

type PendingCheckout = {
  startedAt: number;
  destination: string;
  sourcePath: string;
  provider: string;
};

function getRouteType(pathname: string) {
  if (pathname.startsWith('/app')) return 'application';
  if (pathname.startsWith('/auth') || pathname.includes('callback')) return 'auth';
  if (SEO_ROUTES.has(pathname)) return 'seo';
  if (PAYMENT_ROUTES.has(pathname)) return 'payment';
  if (WAITLIST_ROUTES.has(pathname)) return 'waitlist';
  if (POLICY_ROUTES.has(pathname)) return 'policy';
  if (HIDDEN_DEMO_ROUTES.has(pathname)) return 'hidden_demo';
  if (MARKETING_ROUTES.has(pathname)) return 'marketing';
  return 'other_public';
}

function getRedirectDestination(pathname: string) {
  if (REDIRECT_ROUTES[pathname]) return REDIRECT_ROUTES[pathname];
  if (TENANT_REDIRECT_ROUTES.has(pathname)) return 'tenant_scoped_workspace';

  const tenantRedirect = pathname.match(/^\/app\/[^/]+\/(reports|history|upcoming-payments)$/);
  if (!tenantRedirect) return null;

  return tenantRedirect[1] === 'reports' ? '../dashboard' : '../billing';
}

function getNormalizedText(element: Element) {
  return (element.getAttribute('aria-label') || element.textContent || element.getAttribute('title') || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getElementHref(element: Element) {
  const anchor = element.closest('a') as HTMLAnchorElement | null;
  return anchor?.href || anchor?.getAttribute('href') || '';
}

function getSafeDestination(rawHref: string) {
  if (!rawHref) return undefined;

  try {
    const parsed = new URL(rawHref, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}`;
    }
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return rawHref.startsWith('/') ? rawHref : undefined;
  }
}

function isOutboundHref(rawHref: string) {
  if (!rawHref || rawHref.startsWith('/') || rawHref.startsWith('#')) return false;
  if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return true;

  try {
    return new URL(rawHref, window.location.origin).origin !== window.location.origin;
  } catch {
    return false;
  }
}

function isPaystackDestination(destination?: string) {
  return Boolean(destination && destination.includes('paystack.shop/pay/margin-early-access'));
}

function classifyCta(text: string, destination?: string) {
  const normalized = text.toLowerCase();
  if (isPaystackDestination(destination)) return 'payment';
  if (normalized.includes('demo')) return 'demo';
  if (normalized.includes('waitlist')) return 'waitlist';
  if (normalized.includes('login') || normalized.includes('log in')) return 'login';
  if (normalized.includes('early access') || normalized.includes('claim') || normalized.includes('get started') || normalized.includes('reserve')) return 'early_access';
  if (normalized.includes('connect store')) return 'connect_store';
  if (normalized.includes('enterprise')) return 'enterprise';
  return 'general';
}

function shouldTrackCta(text: string, destination?: string) {
  const normalized = text.toLowerCase();
  return isPaystackDestination(destination) || CTA_TEXT_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function getSectionName(element: Element, index: number) {
  const explicit = element.getAttribute('data-analytics-section');
  if (explicit) return explicit;

  const heading = element.querySelector('h1,h2,h3,[data-section-label]');
  const headingText = heading?.textContent?.replace(/\s+/g, ' ').trim();
  if (headingText) return headingText.slice(0, 90);

  return `section_${index + 1}`;
}

function getSpecificSectionEvent(pathname: string, sectionName: string, index: number) {
  if (pathname !== '/') return null;

  const name = sectionName.toLowerCase();
  if (index === 0 || name.includes('amazon owes') || name.includes('recovery position')) {
    return ANALYTICS_EVENTS.landingHeroViewed;
  }
  if (name.includes('claim window') || name.includes('scattered') || name.includes('before and after')) {
    return ANALYTICS_EVENTS.landingProblemViewed;
  }
  if (name.includes('evidence trail') || name.includes('trust') || name.includes('margin maps') || name.includes('seller stays in control')) {
    return ANALYTICS_EVENTS.landingSolutionViewed;
  }
  if (name.includes('demo') || name.includes('walkthrough')) {
    return ANALYTICS_EVENTS.landingDemoViewed;
  }
  if (name.includes('frequently asked questions')) {
    return ANALYTICS_EVENTS.landingFaqViewed;
  }

  return null;
}

function readPendingCheckout(): PendingCheckout | null {
  try {
    const raw = window.localStorage.getItem(CHECKOUT_PENDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingCheckout;
    return typeof parsed?.startedAt === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

function writePendingCheckout(destination: string, sourcePath: string) {
  try {
    window.localStorage.setItem(CHECKOUT_PENDING_STORAGE_KEY, JSON.stringify({
      startedAt: Date.now(),
      destination,
      sourcePath,
      provider: PAYSTACK_PAYMENT_PROVIDER,
    } satisfies PendingCheckout));
  } catch {
    // Analytics must never interrupt navigation.
  }
}

function clearPendingCheckout() {
  try {
    window.localStorage.removeItem(CHECKOUT_PENDING_STORAGE_KEY);
  } catch {
    // Analytics must never interrupt navigation.
  }
}

export function PublicSiteInstrumentation() {
  const location = useLocation();
  const seenSectionsRef = useRef<Set<string>>(new Set());
  const scrollMilestonesRef = useRef<Set<number>>(new Set());
  const startedFormsRef = useRef<WeakSet<HTMLFormElement>>(new WeakSet());

  useEffect(() => {
    const path = location.pathname;
    const routeType = getRouteType(path);

    trackEvent(ANALYTICS_EVENTS.publicPageViewed, {
      route_type: routeType,
      should_appear_in_ga4_reports: routeType !== 'hidden_demo' && routeType !== 'application',
    });

    if (path === '/') {
      trackEvent(ANALYTICS_EVENTS.homepageViewed, {
        route_type: routeType,
      });
    }

    if (path === '/waitlist') {
      trackEvent(ANALYTICS_EVENTS.waitlistOpened, {
        route_type: routeType,
      });
    }

    const redirectDestination = getRedirectDestination(path);
    if (redirectDestination) {
      trackEvent(ANALYTICS_EVENTS.redirectObserved, {
        redirect_source: path,
        redirect_destination: redirectDestination,
        redirect_type: 'spa_navigate_replace_or_tenant_redirect',
      });
    }

    const pendingCheckout = readPendingCheckout();
    if (pendingCheckout && path === '/payment/success') {
      clearPendingCheckout();
    } else if (
      pendingCheckout &&
      Date.now() - pendingCheckout.startedAt >= CHECKOUT_ABANDON_AFTER_MS &&
      path !== pendingCheckout.sourcePath
    ) {
      trackEvent(ANALYTICS_EVENTS.checkoutAbandoned, {
        offer: EARLY_ACCESS_OFFER,
        value: EARLY_ACCESS_VALUE_ZAR,
        currency: EARLY_ACCESS_CURRENCY,
        payment_provider: pendingCheckout.provider,
        checkout_destination: pendingCheckout.destination,
        checkout_source_path: pendingCheckout.sourcePath,
        return_path: path,
      });
      clearPendingCheckout();
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    seenSectionsRef.current = new Set();
    scrollMilestonesRef.current = new Set();
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = location.pathname;
    if (path.startsWith('/app')) return;

    let ticking = false;
    const milestones = [25, 50, 75, 90];

    const checkScrollDepth = () => {
      ticking = false;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const depth = Math.max(0, Math.min(100, (window.scrollY / scrollable) * 100));
      milestones.forEach((milestone) => {
        if (depth < milestone || scrollMilestonesRef.current.has(milestone)) return;
        scrollMilestonesRef.current.add(milestone);
        trackEvent(ANALYTICS_EVENTS.scrollDepthReached, {
          route_type: getRouteType(path),
          scroll_percent: milestone,
        });
      });
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(checkScrollDepth);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    checkScrollDepth();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    if (location.pathname.startsWith('/app')) return;

    let cleanupObserver: (() => void) | undefined;
    let retryId: number | undefined;
    let attempts = 0;

    const attachSectionObserver = () => {
      const sections = Array.from(document.querySelectorAll('main section'));
      if (!sections.length) {
        attempts += 1;
        if (attempts <= 10) {
          retryId = window.setTimeout(attachSectionObserver, 250);
        }
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const index = sections.indexOf(entry.target as HTMLElement);
            const sectionName = getSectionName(entry.target, index);
            const key = `${location.pathname}:${sectionName}`;
            if (seenSectionsRef.current.has(key)) return;
            seenSectionsRef.current.add(key);

            const params = {
              route_type: getRouteType(location.pathname),
              section: sectionName,
              section_index: index,
            };

            trackEvent(ANALYTICS_EVENTS.landingSectionViewed, params);

            const specificEvent = getSpecificSectionEvent(location.pathname, sectionName, index);
            if (specificEvent) {
              trackEvent(specificEvent, params);
            }
          });
        },
        { threshold: 0.35 }
      );

      sections.forEach((section) => observer.observe(section));
      cleanupObserver = () => observer.disconnect();
    };

    attachSectionObserver();

    return () => {
      if (retryId) window.clearTimeout(retryId);
      cleanupObserver?.();
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const actionable = target?.closest('a,button,[role="button"]');
      if (!actionable) return;

      const text = getNormalizedText(actionable);
      const href = getElementHref(actionable);
      const destination = getSafeDestination(href);
      const isOutbound = isOutboundHref(href);
      const isPaystack = isPaystackDestination(destination || href);

      if (shouldTrackCta(text, destination || href)) {
        const ctaParams = {
          route_type: getRouteType(location.pathname),
          cta_text: text || 'unlabeled_cta',
          cta_type: classifyCta(text, destination || href),
          destination,
          is_outbound: isOutbound,
        };

        trackEvent(ANALYTICS_EVENTS.ctaClicked, ctaParams);

        if (isPaystack) {
          trackEvent(ANALYTICS_EVENTS.paymentButtonClicked, {
            ...ctaParams,
            offer: EARLY_ACCESS_OFFER,
            value: EARLY_ACCESS_VALUE_ZAR,
            currency: EARLY_ACCESS_CURRENCY,
            payment_provider: PAYSTACK_PAYMENT_PROVIDER,
          });
          trackEvent(ANALYTICS_EVENTS.checkoutOpened, {
            ...ctaParams,
            offer: EARLY_ACCESS_OFFER,
            value: EARLY_ACCESS_VALUE_ZAR,
            currency: EARLY_ACCESS_CURRENCY,
            payment_provider: PAYSTACK_PAYMENT_PROVIDER,
            checkout_destination: PAYSTACK_EARLY_ACCESS_URL,
          });
          writePendingCheckout(PAYSTACK_EARLY_ACCESS_URL, `${location.pathname}${location.search}`);
        }
      }

      if (isOutbound) {
        trackEvent(ANALYTICS_EVENTS.outboundLinkClicked, {
          route_type: getRouteType(location.pathname),
          link_text: text || 'unlabeled_link',
          destination,
          is_payment_provider: isPaystack,
        });
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null;
      const form = target?.closest('form') as HTMLFormElement | null;
      if (!form || startedFormsRef.current.has(form)) return;
      startedFormsRef.current.add(form);

      trackEvent(ANALYTICS_EVENTS.formStart, {
        route_type: getRouteType(location.pathname),
        form_id: form.id || undefined,
        form_name: form.getAttribute('name') || form.getAttribute('aria-label') || undefined,
      });
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;

      trackEvent(ANALYTICS_EVENTS.formSubmitted, {
        route_type: getRouteType(location.pathname),
        form_id: form.id || undefined,
        form_name: form.getAttribute('name') || form.getAttribute('aria-label') || undefined,
      });
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('submit', handleSubmit, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('submit', handleSubmit, true);
    };
  }, [location.pathname, location.search]);

  return null;
}
