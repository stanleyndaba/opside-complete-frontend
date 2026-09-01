import { useClerk, useSignIn, useSignUp } from '@clerk/react';
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';

const DEFAULT_ERROR = 'Social sign-in could not be completed. Please try again.';

function buildLoginPath(next: string | null, error?: string, provider: 'google' | 'apple' | 'linkedin' = 'google') {
  const params = new URLSearchParams({ oauth: provider });
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    params.set('next', next);
  }
  if (error) {
    params.set('oauth_error', error);
  }
  return `/login?${params.toString()}`;
}

export default function ClerkOAuthCallback() {
  const clerk = useClerk();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const hasRun = useRef(false);
  const next = useMemo(() => searchParams.get('next'), [searchParams]);
  const provider = searchParams.get('provider') === 'apple'
    ? 'apple'
    : searchParams.get('provider') === 'linkedin'
      ? 'linkedin'
      : 'google';
  const providerName = provider === 'apple' ? 'Apple' : provider === 'linkedin' ? 'LinkedIn' : 'Google';
  const loginPath = useMemo(() => buildLoginPath(next, undefined, provider), [next, provider]);

  useEffect(() => {
    if (!clerk.loaded || !signIn || !signUp || hasRun.current) return;
    hasRun.current = true;

    const returnToLogin = (message?: string) => {
      navigate(message ? buildLoginPath(next, message, provider) : loginPath, { replace: true });
    };

    const finalizeSignIn = async () => {
      const result = await signIn.finalize({
        navigate: async () => {
          navigate(loginPath, { replace: true });
        },
      });
      if (result.error) {
        throw new Error(result.error.message || DEFAULT_ERROR);
      }
    };

    const finalizeSignUp = async () => {
      const result = await signUp.finalize({
        navigate: async () => {
          navigate(loginPath, { replace: true });
        },
      });
      if (result.error) {
        throw new Error(result.error.message || DEFAULT_ERROR);
      }
    };

    const complete = async () => {
      try {
        const providerError = searchParams.get('error_description') || searchParams.get('error');
        if (providerError) {
          returnToLogin(providerError);
        }

        if (providerError) {
          return;
        }

        if (signIn.status === 'complete') {
          await finalizeSignIn();
          return;
        }

        if (signUp.status === 'complete') {
          await finalizeSignUp();
          return;
        }

        if (signUp.isTransferable) {
          await signIn.create({ transfer: true });
          if (signIn.status === 'complete') {
            await finalizeSignIn();
            return;
          }
        }

        if (signIn.isTransferable) {
          await signUp.create({ transfer: true });
          if (signUp.status === 'complete') {
            await finalizeSignUp();
            return;
          }
        }

        if (signIn.existingSession || signUp.existingSession) {
          const sessionId = signIn.existingSession?.sessionId || signUp.existingSession?.sessionId;
          if (sessionId) {
            await clerk.setActive({
              session: sessionId,
              navigate: async () => navigate(loginPath, { replace: true }),
            });
            return;
          }
        }

        returnToLogin(`${providerName} authentication needs one more step. Please continue from the Margin sign-in page.`);
      } catch (callbackError) {
        returnToLogin(callbackError instanceof Error ? callbackError.message : DEFAULT_ERROR);
      }
    };

    void complete();
  }, [clerk, loginPath, navigate, next, searchParams, signIn, signUp]);

  return (
    <PageLayout title={`Connecting ${providerName} | Margin`} noPadding hideNavbar hideSidebar hideLogo>
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAF7] px-5 py-12 text-[#182026]">
        <section className="w-full max-w-md rounded-md border border-[#D8E3EA] bg-white p-6 text-center shadow-[0_12px_40px_rgba(37,49,58,0.06)]">
          <p className="font-lora text-[22px] text-[#182026]">Connecting {providerName} to Margin</p>
          <p className="mt-3 text-[14px] leading-6 text-[#66737F]">Finishing your secure account sign-in.</p>
        </section>
      </main>
    </PageLayout>
  );
}
