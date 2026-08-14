import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, useClerk, useSignIn, useSignUp, useUser } from '@clerk/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { normalizeTenantSlug } from '@/lib/routes';
import { api } from '@/lib/api';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';
import { clearDemoSession, DEMO_TENANT_SLUG, isDemoBypassAvailable, isInternalDemoAccessEmail, seedDemoSession } from '@/lib/demoSession';
import { applyFoundingActivationState, hasFoundingReservationContext, markFoundingReservationConfirmed } from '@/lib/foundingActivation';

const sanitizeNextPath = (value: string | null, intent: string | null) => {
  if (typeof window === 'undefined') {
    return '/app';
  }

  const storedTenantSlug = normalizeTenantSlug(localStorage.getItem('active_tenant_slug'));
  if (intent === 'onboarding') {
    return '/founding-500/status';
  }

  if (value?.includes('/sync')) {
    return '/audit';
  }

  if (value && value.startsWith('/') && !value.startsWith('/login')) {
    return value;
  }

  if (intent === 'upload-csv' && storedTenantSlug) {
    return `/app/${storedTenantSlug}/data-upload`;
  }

  return '/app';
};

type AuthMode = 'login' | 'signup' | 'recovery';
type LoginStep = 'account' | 'workspace';
type ClerkVerificationStep = 'client_trust_email_code' | 'signup_email_code';

type ClerkLoginResult =
  | { status: 'complete'; token: string; userId?: string | null; email: string }
  | { status: 'verification_required' };

type ClerkFinalizedSession = {
  id?: string;
  user?: {
    id?: string | null;
  } | null;
  getToken: (options?: { skipCache?: boolean }) => Promise<string | null>;
};

type DemoReviewerLoginResponse = {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    role: string;
  };
  redirectPath: string;
};

type AuthBootstrapResponse = {
  success: boolean;
  user?: { id: string; email: string };
  tenant?: { id: string; slug: string; foundingReservation?: boolean; foundingActivationReady?: boolean };
  error?: string;
  message?: string;
};

const PAYSTACK_REVIEW_EMAIL = String(
  import.meta.env.VITE_PAYSTACK_REVIEW_EMAIL || 'paystack-review@margin-finance.com'
).trim().toLowerCase();
const MARGIN_SESSION_UPDATED_EVENT = 'margin:session-updated';

const isPaystackReviewerEmail = (value: string) => {
  return value.trim().toLowerCase() === PAYSTACK_REVIEW_EMAIL;
};

const getEmailDomain = (value: string) => {
  return value.trim().toLowerCase().split('@')[1] || undefined;
};

const getEmailCodeFactor = (factors?: Array<Record<string, unknown>> | null) => {
  return factors?.find((factor) => factor.strategy === 'email_code') || null;
};

const extractLoginErrorMessage = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (value instanceof Error) {
    return value.message.trim();
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nestedError = typeof record.error === 'object' && record.error !== null
      ? record.error as Record<string, unknown>
      : null;
    const clerkErrors = Array.isArray(record.errors)
      ? record.errors.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      : [];
    const candidates = [
      record.message,
      record.longMessage,
      record.error_description,
      record.error,
      record.details,
      record.statusText,
      record.name,
      nestedError?.message,
      nestedError?.code,
      ...clerkErrors.flatMap((clerkError) => [
        clerkError.longMessage,
        clerkError.message,
        clerkError.code,
      ]),
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    try {
      const serialized = JSON.stringify(value);
      return serialized === '{}' ? '' : serialized;
    } catch {
      return '';
    }
  }

  return String(value || '').trim();
};

const classifyLoginErrorForAnalytics = (error: unknown) => {
  const normalized = extractLoginErrorMessage(error).toLowerCase();

  if (!normalized || normalized === '{}' || normalized.includes('authretryablefetcherror')) return 'opaque_auth_error';
  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('form_password_incorrect') ||
    normalized.includes('form_identifier_not_found') ||
    normalized.includes('couldn\'t find your account') ||
    (normalized.includes('password') && normalized.includes('incorrect'))
  ) return 'invalid_credentials';
  if (normalized.includes('unable to resolve a workspace')) return 'workspace_unassigned';
  if (normalized.includes('email not confirmed')) return 'email_not_confirmed';
  if (normalized.includes('verification') || normalized.includes('client trust')) return 'verification_required';
  if (normalized.includes('rate limit') || normalized.includes('too many')) return 'rate_limited';
  if (normalized.includes('failed to fetch') || normalized.includes('network') || normalized.includes('timeout')) return 'network_or_timeout';
  if (normalized.includes('reviewer')) return 'reviewer_access_error';
  return 'other';
};

const isOpaqueLoginError = (message: string) => {
  const normalized = message.trim().toLowerCase();
  return !normalized ||
    normalized === '{}' ||
    normalized === '[object object]' ||
    normalized === 'authretryablefetcherror: {}' ||
    normalized.endsWith(': {}');
};

const formatLoginError = (error: unknown, step: LoginStep) => {
  const rawMessage = extractLoginErrorMessage(error);
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes('exceed_egress_quota') ||
    normalized.includes('restricted') ||
    normalized.includes('violations') ||
    normalized.includes('spend cap') ||
    normalized.includes('upgrade their plan')
  ) {
    return '__SERVICE_PREPARING__';
  }

  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('form_password_incorrect') ||
    normalized.includes('form_identifier_not_found') ||
    normalized.includes('couldn\'t find your account') ||
    (normalized.includes('password') && normalized.includes('incorrect'))
  ) {
    return 'The email or password is incorrect. Please check the account details and try again.';
  }

  if (normalized.includes('verification code') || normalized.includes('client trust')) {
    return 'Enter the verification code to finish secure sign-in.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email address before logging in.';
  }

  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Too many login attempts happened too quickly. Please wait a moment, then try again.';
  }

  if (step === 'workspace' && normalized.includes('unable to resolve a workspace')) {
    return 'Your account sign-in succeeded, but Margin could not prepare your audit workspace yet. Please retry, or use the reviewer credentials Margin supplied if you are reviewing the demo.';
  }

  const retryableAuthIssue =
    isOpaqueLoginError(rawMessage) ||
    normalized.includes('authretryablefetcherror') ||
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('504') ||
    normalized.includes('gateway') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('network');

  if (retryableAuthIssue) {
    return step === 'account'
      ? 'Authentication did not return a readable response while checking the account. Please try again in a moment.'
      : 'Your account sign-in looks okay, but Margin could not finish access setup. Please retry in a moment.';
  }

  return rawMessage || (step === 'account'
    ? 'Unable to log in with those credentials.'
    : 'Unable to finish access setup after sign-in.');
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const {
    isLoaded: clerkAuthLoaded,
    isSignedIn: clerkSignedIn,
    userId: clerkUserId,
    getToken: getClerkToken,
  } = useAuth();
  const clerk = useClerk();
  const { user: clerkUser } = useUser();
  const {
    signIn,
    errors: clerkSignInErrors,
    fetchStatus: clerkSignInFetchStatus,
  } = useSignIn();
  const {
    signUp,
  } = useSignUp();
  usePageMeta({
    title: 'Log In | Margin',
    description: 'Access your Margin workspace with your account credentials.',
    url: `${SITE_META.url}/login`,
    image: SITE_META.image,
  });

  const intent = searchParams.get('intent');
  const next = searchParams.get('next');
  const nextPath = useMemo(() => sanitizeNextPath(next, intent), [intent, next]);
  const isAuditIntent = intent === 'audit' || nextPath === '/audit' || nextPath.startsWith('/audit?');
  const demoBypassAvailable = isDemoBypassAvailable();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [internalError, setInternalError] = useState('');
  const setError = (message: string) => {
    if (message === '__SERVICE_PREPARING__') {
      setInternalError(message);
    } else if (message) {
      toast({
        variant: 'destructive',
        description: message,
      });
      setInternalError('');
    } else {
      setInternalError('');
    }
  };
  const error = internalError;
  const [loginStep, setLoginStep] = useState<LoginStep | null>(null);
  const [workspaceRetryAvailable, setWorkspaceRetryAvailable] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [activeSessionEmail, setActiveSessionEmail] = useState<string | null>(null);
  const [clerkVerificationStep, setClerkVerificationStep] = useState<ClerkVerificationStep | null>(null);
  const [clerkVerificationCode, setClerkVerificationCode] = useState('');
  const [clerkVerificationMessage, setClerkVerificationMessage] = useState('');
  const clerkFinalizeBootstrapRef = useRef<Promise<ClerkLoginResult> | null>(null);
  const enterDemoWorkspace = useCallback(() => {
    seedDemoSession();
    navigate(`/app/${DEMO_TENANT_SLUG}/dashboard`, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!demoBypassAvailable || mode !== 'login') return;
    if (nextPath === `/app/${DEMO_TENANT_SLUG}/dashboard` || nextPath.startsWith(`/app/${DEMO_TENANT_SLUG}/`)) {
      enterDemoWorkspace();
    }
  }, [demoBypassAvailable, enterDemoWorkspace, mode, nextPath]);

  useEffect(() => {
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') : '';
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    if (intent === 'onboarding') {
      markFoundingReservationConfirmed('signup_intent');
    }
  }, [intent]);

  useEffect(() => {
    let isMounted = true;

    const loadActiveSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      const recoveryMode = searchParams.get('type') === 'recovery' || searchParams.get('mode') === 'recovery';
      const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress || null;
      if (!recoveryMode && clerkAuthLoaded && clerkSignedIn && clerkUserId) {
        const nextEmail = clerkEmail || localStorage.getItem('user_email') || null;
        setActiveSessionEmail(nextEmail);
      } else if (!recoveryMode && session?.access_token) {
        const nextEmail = session.user?.email || localStorage.getItem('user_email') || null;
        setActiveSessionEmail(nextEmail);
      } else {
        setActiveSessionEmail(null);
      }

      setSessionChecked(true);
    };

    loadActiveSession();

    return () => {
      isMounted = false;
    };
  }, [clerkAuthLoaded, clerkSignedIn, clerkUser, clerkUserId, searchParams]);

  useEffect(() => {
    const urlType = searchParams.get('type');
    const explicitMode = searchParams.get('mode');
    if (urlType === 'recovery' || explicitMode === 'recovery') {
      setMode('recovery');
    } else if (explicitMode === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('recovery');
        setError('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const heading = mode === 'signup'
    ? isAuditIntent
      ? 'Create audit access'
      : 'Create your Margin account'
    : mode === 'recovery'
      ? 'Reset your password'
    : 'Sign in to Margin';

  const resetLocalAuthError = () => {
    setError('');
    setLoginStep(null);
    setWorkspaceRetryAvailable(false);
    setClerkVerificationStep(null);
    setClerkVerificationCode('');
    setClerkVerificationMessage('');
  };

  const persistSession = (accessToken?: string | null, userId?: string | null, userEmail?: string | null) => {
    if (accessToken) {
      localStorage.setItem('session_token', accessToken);
    }
    if (userId) {
      localStorage.setItem('user_id', userId);
    }
    if (userEmail) {
      localStorage.setItem('user_email', userEmail);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(MARGIN_SESSION_UPDATED_EVENT));
    }
  };

  const clearStoredTenantContext = () => {
    localStorage.removeItem('active_tenant_id');
    localStorage.removeItem('active_tenant_slug');
  };

  const clearStoredAuthContext = () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    clearDemoSession();
    clearStoredTenantContext();
  };

  const buildLoginAnalyticsParams = (extra: Record<string, unknown> = {}) => ({
    auth_mode: mode,
    email_domain: getEmailDomain(email),
    is_reviewer_email: isPaystackReviewerEmail(email),
    has_next_path: nextPath !== '/app',
    requested_app_route: nextPath.startsWith('/app'),
    requested_reserved_demo_route: nextPath.startsWith(`/app/${DEMO_TENANT_SLUG}`) || nextPath.startsWith('/app/acme-corp'),
    intent: intent || undefined,
    ...extra,
  });

  const trackLoginFailure = (step: LoginStep, error: unknown, extra: Record<string, unknown> = {}) => {
    trackEvent(ANALYTICS_EVENTS.loginFailed, buildLoginAnalyticsParams({
      failure_step: step,
      error_category: classifyLoginErrorForAnalytics(error),
      ...extra,
    }));
  };

  const logClerkLoginDiagnostic = (eventName: string, details: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.info('[Clerk login]', eventName, details);
    }
  };

  const extractClerkSignalErrorMessage = (value: unknown): string => {
    if (!value || typeof value !== 'object') {
      return extractLoginErrorMessage(value);
    }

    const record = value as Record<string, unknown>;
    const fields = record.fields && typeof record.fields === 'object'
      ? Object.values(record.fields as Record<string, unknown>)
      : [];
    const globalErrors = Array.isArray(record.global) ? record.global : [];
    const rawErrors = Array.isArray(record.raw) ? record.raw : [];

    for (const candidate of [...fields, ...globalErrors, ...rawErrors, value]) {
      const message = extractLoginErrorMessage(candidate);
      if (message) {
        return message;
      }
    }

    return '';
  };

  const getClerkErrorMessage = (operationError?: unknown) => {
    return extractClerkSignalErrorMessage(operationError)
      || extractClerkSignalErrorMessage(clerkSignInErrors)
      || 'Unable to finish Clerk sign-in. Please check your details and try again.';
  };

  const bootstrapWorkspaceWithClerkToken = async (emailAddress: string, sessionToken: string) => {
    clearStoredTenantContext();

    const workspaceName = deriveWorkspaceNameFromEmail(emailAddress);
    const bootstrapResponse = await fetch(api.buildApiUrl('/api/auth/bootstrap'), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        workspaceName,
        preferredTenantSlug: normalizeTenantSlug(localStorage.getItem('active_tenant_slug')),
        foundingReservation: !isAuditIntent && (intent === 'onboarding' || hasFoundingReservationContext()),
      }),
    });

    const payload = await bootstrapResponse.json().catch(() => null) as AuthBootstrapResponse | null;
    if (!bootstrapResponse.ok || !payload?.success) {
      throw new Error(payload?.error || payload?.message || 'Unable to resolve a workspace for this account.');
    }

    applyFoundingActivationState({
      reserved: payload.tenant?.foundingReservation,
      activationReady: payload.tenant?.foundingActivationReady,
    });

    const resolvedTenantSlug = normalizeTenantSlug(payload.tenant?.slug);
    if (resolvedTenantSlug && payload.tenant?.id) {
      persistSession(sessionToken, payload.user?.id, payload.user?.email || emailAddress);
      localStorage.setItem('active_tenant_id', payload.tenant.id);
      localStorage.setItem('active_tenant_slug', resolvedTenantSlug);
      return resolvedTenantSlug;
    }

    throw new Error('Unable to resolve a workspace for this account.');
  };

  const finalizeClerkSignIn = async (emailAddress: string): Promise<ClerkLoginResult> => {
    if (!signIn || signIn.status !== 'complete') {
      throw new Error('Clerk sign-in is not complete yet.');
    }

    const runBootstrapOnce = (session: ClerkFinalizedSession) => {
      if (!clerkFinalizeBootstrapRef.current) {
        clerkFinalizeBootstrapRef.current = (async () => {
          const sessionToken = await session.getToken({ skipCache: true });
          if (!sessionToken) {
            throw new Error('No active Clerk session token was available after sign-in.');
          }

          const finalizedUserId = session.user?.id || clerkUserId;
          persistSession(sessionToken, finalizedUserId, emailAddress);
          setActiveSessionEmail(emailAddress);

          if (isInternalDemoAccessEmail(emailAddress)) {
            seedDemoSession({ userEmail: emailAddress });
            navigate(`/app/${DEMO_TENANT_SLUG}/dashboard`, { replace: true });

            return {
              status: 'complete',
              token: sessionToken,
              userId: finalizedUserId,
              email: emailAddress,
            };
          }

          const resolvedTenantSlug = await bootstrapWorkspaceWithClerkToken(emailAddress, sessionToken);
          const targetPath = nextPath !== '/app'
            ? bindPathToTenant(nextPath, resolvedTenantSlug)
            : getDefaultWorkspaceLanding(resolvedTenantSlug);
          await routeWithCapacityGate(targetPath);

          return {
            status: 'complete',
            token: sessionToken,
            userId: finalizedUserId,
            email: emailAddress,
          };
        })();
      }

      return clerkFinalizeBootstrapRef.current;
    };

    const finalizeResult = await signIn.finalize({
      navigate: async ({ session }) => {
        if (!session || typeof session.getToken !== 'function') {
          throw new Error('No active Clerk session was created after sign-in.');
        }
        await runBootstrapOnce(session);
      },
    });

    if (finalizeResult.error) {
      throw new Error(getClerkErrorMessage(finalizeResult.error));
    }

    const result = await clerkFinalizeBootstrapRef.current;
    if (!result) {
      throw new Error('Clerk sign-in completed, but no active session was returned.');
    }
    setClerkVerificationStep(null);
    setClerkVerificationCode('');
    setClerkVerificationMessage('');
    return result;
  };

  const handleClerkSignInStatus = async (emailAddress: string): Promise<ClerkLoginResult> => {
    if (!signIn) {
      throw new Error('Authentication is still loading. Please try again in a moment.');
    }

    const currentStatus = signIn.status;
    logClerkLoginDiagnostic('status_after_sign_in_step', {
      status: currentStatus,
      fetchStatus: clerkSignInFetchStatus,
      hasError: Boolean(extractClerkSignalErrorMessage(clerkSignInErrors)),
    });

    if (currentStatus === 'complete') {
      return finalizeClerkSignIn(emailAddress);
    }

    if (currentStatus === 'needs_client_trust') {
      const emailFactor = getEmailCodeFactor(signIn.supportedSecondFactors as Array<Record<string, unknown>>);
      if (!emailFactor) {
        throw new Error('This sign-in needs device verification, but no email-code verification option is available.');
      }

      const emailCodeResult = await signIn.mfa.sendEmailCode();
      if (emailCodeResult.error) {
        throw new Error(getClerkErrorMessage(emailCodeResult.error));
      }

      setClerkVerificationStep('client_trust_email_code');
      setClerkVerificationCode('');
      setClerkVerificationMessage('Enter the verification code sent to your email to finish sign-in.');
      setError('Enter the verification code sent to your email to finish sign-in.');
      return { status: 'verification_required' };
    }

    if (currentStatus === 'needs_second_factor') {
      throw new Error('This account requires multi-factor authentication. Margin does not support that sign-in step on this form yet.');
    }

    if (currentStatus === 'needs_new_password') {
      throw new Error('This account needs a password reset before it can sign in.');
    }

    if (currentStatus === 'needs_protect_check') {
      throw new Error('This sign-in needs an additional security check. Refresh and try again, or contact Margin if it continues.');
    }

    throw new Error(import.meta.env.DEV
      ? `Clerk sign-in stopped at unsupported status: ${currentStatus || 'unknown'}.`
      : 'This sign-in needs an additional authentication step Margin does not support yet.');
  };

  const authenticateNormalLoginWithClerk = async (): Promise<ClerkLoginResult> => {
    if (!clerkAuthLoaded || !signIn) {
      throw new Error('Authentication is still loading. Please try again in a moment.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (clerkVerificationStep) {
      const code = clerkVerificationCode.trim();
      if (!code) {
        throw new Error('Enter the verification code sent to your email.');
      }

      const verificationResult = await signIn.mfa.verifyEmailCode({ code });
      if (verificationResult.error) {
        throw new Error(getClerkErrorMessage(verificationResult.error));
      }

      return handleClerkSignInStatus(normalizedEmail);
    }

    clerkFinalizeBootstrapRef.current = null;
    const passwordResult = await signIn.password({
      emailAddress: normalizedEmail,
      password,
    });

    if (passwordResult.error) {
      logClerkLoginDiagnostic('password_result_error', {
        status: signIn.status,
        fetchStatus: clerkSignInFetchStatus,
        hasError: true,
      });
      throw new Error(getClerkErrorMessage(passwordResult.error));
    }

    return handleClerkSignInStatus(normalizedEmail);
  };

  const finalizeClerkSignUp = async (emailAddress: string): Promise<ClerkLoginResult> => {
    if (!signUp || signUp.status !== 'complete') {
      throw new Error('Clerk signup is not complete yet.');
    }

    let completed = false;
    const finalizeResult = await signUp.finalize({
      navigate: async ({ session }) => {
        if (!session || typeof session.getToken !== 'function') {
          throw new Error('No active Clerk session was created after signup.');
        }

        const sessionToken = await session.getToken({ skipCache: true });
        if (!sessionToken) {
          throw new Error('No active Clerk session token was available after signup.');
        }

        const finalizedUserId = session.user?.id || clerkUserId;
        persistSession(sessionToken, finalizedUserId, emailAddress);
        setActiveSessionEmail(emailAddress);

        const resolvedTenantSlug = await bootstrapWorkspaceWithClerkToken(emailAddress, sessionToken);
        const targetPath = nextPath !== '/app'
          ? bindPathToTenant(nextPath, resolvedTenantSlug)
          : getDefaultWorkspaceLanding(resolvedTenantSlug);
        await routeWithCapacityGate(targetPath);
        completed = true;
      },
    });

    if (finalizeResult.error) {
      throw new Error(extractClerkSignalErrorMessage(finalizeResult.error) || 'Unable to finish Clerk signup.');
    }

    if (!completed) {
      throw new Error('Clerk signup completed, but the workspace was not opened.');
    }

    setClerkVerificationStep(null);
    setClerkVerificationCode('');
    setClerkVerificationMessage('');
    return { status: 'complete', token: localStorage.getItem('session_token') || '', userId: localStorage.getItem('user_id'), email: emailAddress };
  };

  const authenticateSignupWithClerk = async (): Promise<ClerkLoginResult> => {
    if (!clerkAuthLoaded || !signUp) {
      throw new Error('Authentication is still loading. Please try again in a moment.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (clerkVerificationStep === 'signup_email_code') {
      const code = clerkVerificationCode.trim();
      if (!code) {
        throw new Error('Enter the verification code sent to your email.');
      }

      const verifyResult = await signUp.verifications.verifyEmailCode({ code });
      if (verifyResult.error) {
        throw new Error(extractClerkSignalErrorMessage(verifyResult.error) || 'Unable to verify that code.');
      }

      if (signUp.status === 'complete') {
        return finalizeClerkSignUp(normalizedEmail);
      }

      if (signUp.status === 'missing_requirements' && signUp.unverifiedFields?.includes('email_address')) {
        const sendResult = await signUp.verifications.sendEmailCode();
        if (sendResult.error) {
          throw new Error(extractClerkSignalErrorMessage(sendResult.error) || 'Unable to send the verification code.');
        }

        setClerkVerificationStep('signup_email_code');
        setClerkVerificationCode('');
        setClerkVerificationMessage('Enter the verification code sent to your email to finish account creation.');
        setError('Enter the verification code sent to your email to finish account creation.');
        return { status: 'verification_required' };
      }

      throw new Error(import.meta.env.DEV
        ? `Clerk signup stopped at unsupported status: ${signUp.status || 'unknown'}.`
        : 'This signup needs an additional authentication step Margin does not support yet.');
    }

    const result = await signUp.password({
      emailAddress: normalizedEmail,
      password,
    });

    if (result.error) {
      throw new Error(extractClerkSignalErrorMessage(result.error) || 'Unable to create this account. Please check the details and try again.');
    }

    if (signUp.status === 'complete') {
      return finalizeClerkSignUp(normalizedEmail);
    }

    if (signUp.status === 'missing_requirements' && signUp.unverifiedFields?.includes('email_address')) {
      const sendResult = await signUp.verifications.sendEmailCode();
      if (sendResult.error) {
        throw new Error(extractClerkSignalErrorMessage(sendResult.error) || 'Unable to send the verification code.');
      }

      setClerkVerificationStep('signup_email_code');
      setClerkVerificationCode('');
      setClerkVerificationMessage('Enter the verification code sent to your email to finish account creation.');
      setError('Enter the verification code sent to your email to finish account creation.');
      return { status: 'verification_required' };
    }

    throw new Error(import.meta.env.DEV
      ? `Clerk signup stopped at unsupported status: ${signUp.status || 'unknown'}.`
      : 'This signup needs an additional authentication step Margin does not support yet.');
  };

  const shouldGateOnboarding = (path: string) => path.includes('/connect-amazon');

  const routeWithCapacityGate = async (targetPath: string) => {
    if (!shouldGateOnboarding(targetPath)) {
      navigate(targetPath, { replace: true });
      return;
    }

    try {
      const capacity = await api.getOnboardingCapacity();
      if (capacity.ok && capacity.data && !capacity.data.allowed) {
        navigate('/waitlist?reason=capacity', { replace: true });
        return;
      }
    } catch {
      // If capacity check fails, continue with normal onboarding navigation.
    }

    navigate(targetPath, { replace: true });
  };

  const bindPathToTenant = (path: string, tenantSlug: string) => {
    if (!path.startsWith('/app/')) {
      return path;
    }

    return path.replace(/^\/app\/[^/]+/, `/app/${tenantSlug}`);
  };

  const getDefaultWorkspaceLanding = (tenantSlug: string) => {
    return tenantSlug === DEMO_TENANT_SLUG
      ? `/app/${DEMO_TENANT_SLUG}/dashboard`
      : `/app/${tenantSlug}/connect-amazon`;
  };

  const deriveWorkspaceNameFromEmail = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    const domain = trimmed.split('@')[1] || '';
    const label = domain.split('.')[0] || trimmed.split('@')[0] || 'workspace';
    return label
      .split(/[^a-z0-9]+/i)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Workspace';
  };

  const resolveTenantSlugForAuthenticatedUser = async (emailAddress: string, preferredTenantSlug?: string | null) => {
    clearStoredTenantContext();

    if (isInternalDemoAccessEmail(emailAddress)) {
      seedDemoSession({ userEmail: emailAddress });
      setActiveSessionEmail(emailAddress);
      return DEMO_TENANT_SLUG;
    }

    const workspaceName = deriveWorkspaceNameFromEmail(emailAddress);
    const bootstrapResponse = await api.post<{
      success: boolean;
      user?: { id: string; email: string };
      tenant?: { id: string; slug: string; foundingReservation?: boolean; foundingActivationReady?: boolean };
    }>('/api/auth/bootstrap', {
      workspaceName,
      preferredTenantSlug: normalizeTenantSlug(preferredTenantSlug || localStorage.getItem('active_tenant_slug')),
      foundingReservation: !isAuditIntent && (intent === 'onboarding' || hasFoundingReservationContext()),
    });

    applyFoundingActivationState({
      reserved: bootstrapResponse.data?.tenant?.foundingReservation,
      activationReady: bootstrapResponse.data?.tenant?.foundingActivationReady,
    });

    const resolvedTenantSlug = normalizeTenantSlug(bootstrapResponse.data?.tenant?.slug);
    if (bootstrapResponse.ok && resolvedTenantSlug && bootstrapResponse.data?.tenant?.id) {
      persistSession(
        localStorage.getItem('session_token'),
        bootstrapResponse.data.user?.id,
        bootstrapResponse.data.user?.email || emailAddress,
      );
      localStorage.setItem('active_tenant_id', bootstrapResponse.data.tenant.id);
      localStorage.setItem('active_tenant_slug', resolvedTenantSlug);
      return resolvedTenantSlug;
    }

    throw new Error('Unable to resolve a workspace for this account.');
  };

  const routeExistingSession = async () => {
    const sessionEmail = activeSessionEmail || localStorage.getItem('user_email') || '';
    if (clerkAuthLoaded && clerkSignedIn && clerkUserId) {
      const sessionToken = await getClerkToken({ skipCache: true });
      const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress || sessionEmail || email.trim();
      if (!sessionToken || !clerkEmail) {
        throw new Error('No active Clerk session is available for workspace routing.');
      }

      const resolvedTenantSlug = await bootstrapWorkspaceWithClerkToken(clerkEmail, sessionToken);
      const targetPath = nextPath !== '/app'
        ? bindPathToTenant(nextPath, resolvedTenantSlug)
        : getDefaultWorkspaceLanding(resolvedTenantSlug);
      await routeWithCapacityGate(targetPath);
      return;
    }

    const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(sessionEmail);
    const targetPath = nextPath !== '/app'
      ? bindPathToTenant(nextPath, resolvedTenantSlug)
      : getDefaultWorkspaceLanding(resolvedTenantSlug);
    await routeWithCapacityGate(targetPath);
  };

  const handleContinueExistingSession = async () => {
    setLoading(true);
    setError('');
    setLoginStep('workspace');
    setWorkspaceRetryAvailable(false);

    try {
      await routeExistingSession();
    } catch (sessionRouteError) {
      setWorkspaceRetryAvailable(true);
      setError(formatLoginError(sessionRouteError, 'workspace'));
    } finally {
      setLoading(false);
    }
  };

  const handleRetryWorkspaceRouting = async () => {
    setLoading(true);
    setError('');
    setLoginStep('workspace');
    setWorkspaceRetryAvailable(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const storedToken = localStorage.getItem('session_token');
      if (!session?.access_token && !storedToken) {
        throw new Error('No active session is available for workspace routing.');
      }

      const sessionEmail = session.user?.email || email.trim() || localStorage.getItem('user_email') || '';
      persistSession(session?.access_token || storedToken, session?.user?.id || localStorage.getItem('user_id'), sessionEmail);
      setActiveSessionEmail(sessionEmail || null);

      const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(sessionEmail);
      const targetPath = nextPath !== '/app'
        ? bindPathToTenant(nextPath, resolvedTenantSlug)
        : getDefaultWorkspaceLanding(resolvedTenantSlug);
      await routeWithCapacityGate(targetPath);
    } catch (retryError) {
      setWorkspaceRetryAvailable(true);
      setError(formatLoginError(retryError, 'workspace'));
    } finally {
      setLoading(false);
    }
  };

  const handleUseDifferentAccount = async () => {
    setLoading(true);
    setError('');
    setLoginStep(null);
    setWorkspaceRetryAvailable(false);

    try {
      if (clerkAuthLoaded && clerkSignedIn) {
        await clerk.signOut();
      }
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Even if sign-out reports an issue, clear local auth state so the form is usable.
    } finally {
      clearStoredAuthContext();
      setActiveSessionEmail(null);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setClerkVerificationStep(null);
      setClerkVerificationCode('');
      setClerkVerificationMessage('');
      setLoading(false);
    }
  };

  const resetBrowserAuthForFreshLogin = async () => {
    try {
      if (clerkAuthLoaded && clerkSignedIn) {
        await clerk.signOut();
      }
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Local cleanup below is still enough to prevent stale app context from poisoning login.
    } finally {
      clearStoredAuthContext();
      setActiveSessionEmail(null);
    }
  };

  const handleClearBrowserSession = async () => {
    const currentEmail = email;
    setLoading(true);
    setError('');
    setLoginStep('account');
    setWorkspaceRetryAvailable(false);

    try {
      await resetBrowserAuthForFreshLogin();
      setEmail(currentEmail);
      setPassword('');
      setConfirmPassword('');
      setClerkVerificationStep(null);
      setClerkVerificationCode('');
      setClerkVerificationMessage('');
      setError('Browser session cleared. Enter your password and log in again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    let failureStep: LoginStep = 'account';

    if (mode === 'recovery') {
      if (!password.trim() || !confirmPassword.trim()) {
        setError('Enter and confirm your new password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (!email.trim() || !password.trim()) {
      setError(mode === 'signup' ? 'Enter your email and create a password.' : 'Enter both your email and password.');
      return;
    }
    if ((mode === 'login' || mode === 'signup') && clerkVerificationStep && !clerkVerificationCode.trim()) {
      setError('Enter the verification code sent to your email.');
      return;
    }

    setLoading(true);
    setError('');
    setLoginStep('account');
    setWorkspaceRetryAvailable(false);
    trackEvent(ANALYTICS_EVENTS.loginAttempt, buildLoginAnalyticsParams({
      login_step: 'account',
    }));

    try {
      if (mode === 'signup') {
        failureStep = 'account';
        if (!clerkVerificationStep) {
          await resetBrowserAuthForFreshLogin();
        }
        const signupResult = await authenticateSignupWithClerk();
        if (signupResult.status === 'verification_required') {
          setLoading(false);
          return;
        }

        trackEvent(ANALYTICS_EVENTS.loginSuccess, buildLoginAnalyticsParams({
          auth_mode: 'signup',
          access_outcome: 'session_started',
        }));

        toast({
          title: 'Account created',
          description: 'Your account is ready. Redirecting you into the audit workspace now.',
        });
        setLoading(false);
        return;
      }

      if (mode === 'recovery') {
        failureStep = 'account';
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (updateError) {
          setLoginStep('account');
          trackLoginFailure('account', updateError, { auth_mode: 'recovery' });
          setError(formatLoginError(updateError, 'account'));
          setLoading(false);
          return;
        }
        trackEvent(ANALYTICS_EVENTS.loginSuccess, buildLoginAnalyticsParams({
          auth_mode: 'recovery',
          access_outcome: 'password_updated',
        }));

        toast({
          title: 'Password updated',
          description: 'You can continue into your workspace now.',
        });

        setConfirmPassword('');
        failureStep = 'workspace';
        setLoginStep('workspace');
        const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(email.trim() || localStorage.getItem('user_email') || '');
        await routeWithCapacityGate(`/app/${resolvedTenantSlug}/connect-amazon`);
        setLoading(false);
        return;
      }

      failureStep = 'account';
      if (isPaystackReviewerEmail(email)) {
        await resetBrowserAuthForFreshLogin();

        const reviewerResponse = await api.post<DemoReviewerLoginResponse>('/api/auth/demo-reviewer/login', {
          email: email.trim(),
          password,
        });

        if (!reviewerResponse.ok || !reviewerResponse.data?.success) {
          setLoginStep('account');
          const reviewerError = reviewerResponse.status === 401
            ? 'The reviewer email or password is incorrect.'
            : reviewerResponse.status === 503
              ? 'Reviewer access is not available right now.'
              : reviewerResponse.error || 'Reviewer access is not available right now.';
          trackLoginFailure('account', reviewerError, {
            reviewer_status: reviewerResponse.status,
          });
          setError(reviewerError);
          return;
        }

        seedDemoSession({ userEmail: reviewerResponse.data.user?.email || email.trim() });
        setActiveSessionEmail(reviewerResponse.data.user?.email || email.trim());
        trackEvent(ANALYTICS_EVENTS.reviewerLoginSuccess, buildLoginAnalyticsParams({
          tenant_slug: reviewerResponse.data.tenant?.slug || DEMO_TENANT_SLUG,
          access_outcome: 'reviewer_demo_workspace_opened',
        }));

        toast({
          title: 'Reviewer workspace ready',
          description: 'Opening the Acme Operations demo workspace.',
        });

        navigate(reviewerResponse.data.redirectPath || `/app/${DEMO_TENANT_SLUG}/dashboard`, { replace: true });
        return;
      }

      await resetBrowserAuthForFreshLogin();
      const clerkLoginResult = await authenticateNormalLoginWithClerk();
      if (clerkLoginResult.status === 'verification_required') {
        return;
      }

      trackEvent(ANALYTICS_EVENTS.loginSuccess, buildLoginAnalyticsParams({
        auth_mode: 'login',
        access_outcome: 'account_signed_in',
        auth_provider: 'clerk',
      }));

      toast({
        title: 'Logged in',
        description: 'Redirecting you into your workspace now.',
      });
    } catch (loginError: unknown) {
      setWorkspaceRetryAvailable(failureStep === 'workspace');
      trackLoginFailure(failureStep, loginError);
      setError(formatLoginError(loginError, failureStep));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email first so we know where to send the reset link.');
      setLoginStep('account');
      return;
    }

    setLoading(true);
    setError('');
    setLoginStep('account');
    setWorkspaceRetryAvailable(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?mode=recovery`,
      });

      if (resetError) {
        setError(formatLoginError(resetError, 'account'));
        setLoading(false);
        return;
      }

      toast({
        title: 'Reset email sent',
        description: 'Check your inbox for the secure password reset link.',
      });
    } catch (resetError) {
      setError(formatLoginError(resetError, 'account'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-zinc-900 selection:bg-zinc-100 tracking-tight">
      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-16 flex flex-col items-center">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
              <span className="brand-wordmark font-merriweather text-[20px] font-semibold tracking-tight text-zinc-900">Margin</span>
            </Link>
          </div>

          <section>
            <div className="mb-6 flex justify-center">
              <Link 
                to={isAuditIntent ? "/audit" : "/"} 
                className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                Back to Margin
              </Link>
            </div>

            <h1 className="text-center text-[28px] font-bold leading-none tracking-tight text-zinc-900">
              {heading}
            </h1>

            <div className="mt-10">
              {sessionChecked && activeSessionEmail && mode === 'login' ? (
                <div className="mb-8 border border-zinc-100 bg-zinc-50/30 p-5 rounded-none">
                  <p className="text-[9px] font-bold uppercase tracking-tight text-zinc-400">
                    Active Session Detected
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">
                    You are signed in as <span className="font-bold text-zinc-900">{activeSessionEmail}</span>.
                  </p>
                  <div className="mt-6 flex flex-col gap-2">
                    <Button
                      type="button"
                      onClick={() => void handleContinueExistingSession()}
                      disabled={loading}
                      className="h-10 w-full rounded-none bg-[#007AFF] px-4 text-[11px] font-bold uppercase tracking-tight text-white hover:bg-[#0066FF]"
                    >
                      Continue
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleUseDifferentAccount()}
                      disabled={loading}
                      className="h-10 w-full rounded-none border-zinc-200 bg-white px-4 text-[11px] font-bold uppercase tracking-tight text-zinc-600 hover:bg-zinc-50"
                    >
                      Switch Account
                    </Button>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[9px] font-bold uppercase tracking-tight text-zinc-400">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    disabled={mode === 'recovery'}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      resetLocalAuthError();
                    }}
                    placeholder="name@company.com"
                    className="h-11 rounded-none border-zinc-100 bg-zinc-50/30 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-300 focus-visible:border-zinc-900 focus-visible:ring-0 disabled:opacity-50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[9px] font-bold uppercase tracking-tight text-zinc-400">
                  {mode === 'recovery' ? 'New Password' : 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      resetLocalAuthError();
                    }}
                    placeholder={mode === 'recovery' ? 'Enter new password' : 'Enter password'}
                    className="h-11 rounded-none border-zinc-100 bg-zinc-50/30 px-3 pr-11 text-[13px] text-zinc-900 placeholder:text-zinc-300 focus-visible:border-zinc-900 focus-visible:ring-0 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 transition-colors hover:text-zinc-900"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {(mode === 'login' || mode === 'signup') && clerkVerificationStep ? (
                <div className="space-y-2">
                  <Label htmlFor="clerkVerificationCode" className="text-[10px] font-medium uppercase tracking-widest text-[#66737F]">
                    Verification Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="clerkVerificationCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={clerkVerificationCode}
                      onChange={(event) => {
                        setClerkVerificationCode(event.target.value);
                        setError('');
                      }}
                      placeholder="Enter verification code"
                      className="h-12 rounded-sm border-[#182026]/20 bg-transparent px-3 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:border-[#182026] focus-visible:ring-0"
                    />
                  </div>
                  {clerkVerificationMessage ? (
                    <p className="text-xs leading-5 text-[#66737F]">{clerkVerificationMessage}</p>
                  ) : null}
                </div>
              ) : null}

              {mode === 'recovery' ? (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[10px] font-medium uppercase tracking-widest text-[#66737F]">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        resetLocalAuthError();
                      }}
                      placeholder="Confirm your new password"
                      className="h-12 rounded-sm border-[#182026]/20 bg-transparent px-3 pr-11 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:border-[#182026] focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A99A4] transition-colors hover:text-[#182026]"
                      aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ) : null}

              {error === '__SERVICE_PREPARING__' ? (
                <div className="border border-[#D8E3E8] bg-white/55 px-5 py-6 text-center">
                  <h3 className="text-[20px] font-semibold tracking-[-0.04em] text-[#182026]">
                    We're preparing your account.
                  </h3>
                  <p className="mx-auto mt-3 max-w-[320px] text-[13px] leading-6 text-[#66737F]">
                    Margin could not finish preparing your workspace automatically. Retry account setup, or start again from the free audit path.
                  </p>
                  <Button
                    asChild
                    className="mt-5 h-10 rounded-sm bg-[#0B74DE] px-5 text-[12px] font-semibold text-white hover:bg-[#0869C9] active:scale-[0.98]"
                  >
                    <Link to="/audit">
                      Start Free Audit
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}

              {workspaceRetryAvailable && mode === 'login' ? (
                <Button
                  type="button"
                  onClick={() => void handleRetryWorkspaceRouting()}
                  disabled={loading}
                  className="mt-3 h-10 rounded-sm bg-[#0B74DE] px-4 text-[12px] font-semibold tracking-tight text-white hover:bg-[#0869C9] active:scale-[0.98]"
                >
                  Retry access setup
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              ) : null}

              {!workspaceRetryAvailable && loginStep === 'account' && mode === 'login' ? (
                <Button
                  type="button"
                  onClick={() => void handleClearBrowserSession()}
                  disabled={loading}
                  variant="outline"
                  className="mt-3 h-10 rounded-sm border-red-200 bg-transparent px-4 text-[12px] font-semibold tracking-tight text-red-700 hover:bg-red-50"
                >
                  Clear browser session
                </Button>
              ) : null}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-none bg-[#007AFF] px-8 text-[11px] font-bold uppercase tracking-tight text-white hover:bg-[#0066FF] transition-all shadow-[0_1px_2px_rgba(0,122,255,0.1)]"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    mode === 'signup'
                      ? 'Create Account'
                      : mode === 'recovery'
                        ? 'Update Password'
                        : clerkVerificationStep
                          ? 'Verify Code'
                          : 'Sign In'
                  )}
                </Button>
              </div>

              <div className="flex flex-col gap-4 pt-6 text-[10px] font-bold uppercase tracking-tight text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMode((currentMode) => {
                      const nextMode = currentMode === 'signup' ? 'login' : 'signup';
                      setPassword('');
                      setConfirmPassword('');
                      setError('');
                      setClerkVerificationStep(null);
                      setClerkVerificationCode('');
                      setClerkVerificationMessage('');
                      return nextMode;
                    });
                  }}
                  className="text-left transition-colors hover:text-zinc-900"
                >
                  {mode === 'signup' ? 'Log In' : 'Create Account'}
                </button>
                {mode !== 'recovery' ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-left transition-colors hover:text-zinc-900 disabled:opacity-50"
                  >
                    Forgot Password?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setPassword('');
                      setConfirmPassword('');
                      setError('');
                      setClerkVerificationStep(null);
                      setClerkVerificationCode('');
                      setClerkVerificationMessage('');
                    }}
                    className="text-left transition-colors hover:text-zinc-900"
                  >
                    Back
                  </button>
                )}
              </div>

              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Login;
