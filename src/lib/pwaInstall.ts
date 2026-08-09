type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type PwaInstallSnapshot = {
  canInstall: boolean;
  isStandalone: boolean;
};

type PwaInstallListener = (snapshot: PwaInstallSnapshot) => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isStandalone = false;
let hasStarted = false;
const listeners = new Set<PwaInstallListener>();

const getDisplayModeQuery = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  return window.matchMedia('(display-mode: standalone)');
};

const readStandaloneState = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(getDisplayModeQuery()?.matches);
};

const getSnapshot = (): PwaInstallSnapshot => ({
  canInstall: Boolean(deferredPrompt) && !isStandalone,
  isStandalone,
});

const notify = () => {
  const snapshot = getSnapshot();
  listeners.forEach((listener) => listener(snapshot));
};

const handleBeforeInstallPrompt = (event: Event) => {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  notify();
};

const clearInstallPrompt = () => {
  deferredPrompt = null;
  isStandalone = readStandaloneState();
  notify();
};

const handleDisplayModeChange = () => {
  isStandalone = readStandaloneState();
  if (isStandalone) {
    deferredPrompt = null;
  }
  notify();
};

export const startPwaInstallManager = () => {
  if (hasStarted || typeof window === 'undefined') {
    return;
  }

  hasStarted = true;
  isStandalone = readStandaloneState();

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', clearInstallPrompt);

  const displayModeQuery = getDisplayModeQuery();
  displayModeQuery?.addEventListener?.('change', handleDisplayModeChange);
};

export const subscribeToPwaInstall = (listener: PwaInstallListener) => {
  listeners.add(listener);
  listener(getSnapshot());

  return () => {
    listeners.delete(listener);
  };
};

export const promptPwaInstall = async () => {
  if (!deferredPrompt || isStandalone) {
    return null;
  }

  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  notify();

  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  isStandalone = readStandaloneState();
  notify();

  return choice;
};
