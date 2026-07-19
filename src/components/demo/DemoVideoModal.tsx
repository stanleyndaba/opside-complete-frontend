import React, { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { trackEvent } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: YouTubePlayerEvent) => void;
            onStateChange?: (event: YouTubePlayerEvent) => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayer = {
  destroy: () => void;
  playVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

type YouTubePlayerEvent = {
  data: number;
  target: YouTubePlayer;
};

let youTubeApiPromise: Promise<void> | null = null;

function loadYouTubeIframeApi() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve();
  }

  if (window.YT?.Player) return Promise.resolve();
  if (youTubeApiPromise) return youTubeApiPromise;

  youTubeApiPromise = new Promise<void>((resolve) => {
    const existingCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      existingCallback?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return youTubeApiPromise;
}

interface DemoVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title?: string;
  description?: string;
  analyticsLocation?: string;
  videoName?: string;
}

function getYouTubeId(videoUrl: string): string | null {
  try {
    const parsed = new URL(videoUrl);

    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '') || null;
    }

    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/embed/')[1]?.split('/')[0] || null;
      }

      return parsed.searchParams.get('v');
    }
  } catch {
    return null;
  }

  return null;
}

function buildYouTubeEmbedUrl(videoUrl: string): string {
  const videoId = getYouTubeId(videoUrl);

  if (!videoId) return videoUrl;

  const params = new URLSearchParams({
    autoplay: '1',
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
  });

  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function DemoVideoModal({
  open,
  onOpenChange,
  videoUrl,
  title = 'Margin product demo',
  description = 'Watch how Margin turns Amazon loss events into claim-ready recovery work.',
  analyticsLocation = 'demo_modal',
  videoName = 'margin_demo',
}: DemoVideoModalProps) {
  const embedUrl = buildYouTubeEmbedUrl(videoUrl);
  const videoId = getYouTubeId(videoUrl);
  const embedRef = useRef<HTMLDivElement>(null);
  const playerMountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const modalOpenedTrackedRef = useRef(false);
  const embedVisibleTrackedRef = useRef(false);
  const videoStartedTrackedRef = useRef(false);
  const videoProgressTrackedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!open) {
      modalOpenedTrackedRef.current = false;
      embedVisibleTrackedRef.current = false;
      videoStartedTrackedRef.current = false;
      videoProgressTrackedRef.current = new Set();
      return;
    }

    if (modalOpenedTrackedRef.current) return;
    modalOpenedTrackedRef.current = true;
    trackEvent(ANALYTICS_EVENTS.demoModalOpened, {
      cta_location: analyticsLocation,
      video_name: videoName,
    });
  }, [analyticsLocation, open, videoName]);

  useEffect(() => {
    if (!open || !embedRef.current) return;

    const trackEmbedVisible = () => {
      if (embedVisibleTrackedRef.current) return;
      embedVisibleTrackedRef.current = true;
      trackEvent(ANALYTICS_EVENTS.demoEmbedVisible, {
        cta_location: analyticsLocation,
        video_name: videoName,
      });
    };

    if (typeof IntersectionObserver === 'undefined') {
      trackEmbedVisible();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackEmbedVisible();
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(embedRef.current);
    return () => observer.disconnect();
  }, [analyticsLocation, open, videoName]);

  useEffect(() => {
    if (!open || !videoId || !playerMountRef.current) return;

    let cancelled = false;
    let progressInterval: number | undefined;

    const trackProgress = () => {
      const player = playerRef.current;
      if (!player) return;

      const duration = Number(player.getDuration?.() || 0);
      const currentTime = Number(player.getCurrentTime?.() || 0);
      if (!duration || !currentTime) return;

      const progress = (currentTime / duration) * 100;
      const milestones = [
        { percent: 25, eventName: ANALYTICS_EVENTS.demoVideoProgress25 },
        { percent: 50, eventName: ANALYTICS_EVENTS.demoVideoProgress50 },
        { percent: 75, eventName: ANALYTICS_EVENTS.demoVideoProgress75 },
      ];

      milestones.forEach((milestone) => {
        if (progress < milestone.percent || videoProgressTrackedRef.current.has(milestone.percent)) return;
        videoProgressTrackedRef.current.add(milestone.percent);
        trackEvent(milestone.eventName, {
          cta_location: analyticsLocation,
          video_name: videoName,
          progress_percent: milestone.percent,
        });
      });
    };

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !playerMountRef.current || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(playerMountRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            try {
              event.target.playVideo();
            } catch {
              // Browser autoplay policy may block play; player state remains the source of truth.
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState?.PLAYING) {
              if (!videoStartedTrackedRef.current) {
                videoStartedTrackedRef.current = true;
                trackEvent(ANALYTICS_EVENTS.demoVideoStarted, {
                  cta_location: analyticsLocation,
                  video_name: videoName,
                });
              }
              if (!progressInterval) {
                progressInterval = window.setInterval(trackProgress, 1000);
              }
            }

            if (event.data === window.YT?.PlayerState?.ENDED) {
              trackEvent(ANALYTICS_EVENTS.demoVideoCompleted, {
                cta_location: analyticsLocation,
                video_name: videoName,
                progress_percent: 100,
              });
              if (progressInterval) {
                window.clearInterval(progressInterval);
                progressInterval = undefined;
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (progressInterval) window.clearInterval(progressInterval);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [analyticsLocation, open, videoId, videoName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-24px)] max-w-[760px] gap-0 overflow-hidden rounded-[18px] border border-[#DCE6EC] bg-[#FBFCFD] p-0 text-[#182026] shadow-[0_28px_90px_rgba(24,32,38,0.2)] sm:rounded-[22px] [&>button]:right-4 [&>button]:top-4 [&>button]:rounded-full [&>button]:bg-white [&>button]:p-2 [&>button]:text-[#25313A] [&>button]:opacity-100 [&>button]:shadow-[0_10px_30px_rgba(24,32,38,0.12)] [&>button:hover]:bg-[#F3F6F8]">
        <div className="relative overflow-hidden bg-white px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_18%_0%,rgba(11,116,222,0.1),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(46,125,91,0.08),transparent_36%)]" />
          <div className="relative max-w-3xl pr-12">
            <div className="text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">
              Event-to-recovery walkthrough
            </div>
            <DialogTitle className="mt-2 text-[19px] font-semibold leading-tight tracking-[-0.035em] text-[#182026] sm:text-[23px]">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-2xl text-[13px] leading-5 text-[#66737F] sm:text-sm sm:leading-6">
              {description}
            </DialogDescription>
          </div>
        </div>

        <div className="bg-[#FBFCFD] px-3 pb-3 sm:px-4 sm:pb-4">
          <div ref={embedRef} className="relative mx-auto aspect-video max-h-[52dvh] w-full overflow-hidden rounded-[14px] border border-[#DCE6EC] bg-[#0B1117] shadow-[0_18px_50px_rgba(24,32,38,0.16)] sm:rounded-[18px]">
            {open && videoId ? (
              <div ref={playerMountRef} className="absolute inset-0 h-full w-full [&_iframe]:h-full [&_iframe]:w-full" />
            ) : null}
            {open && !videoId ? (
              <iframe
                title={title}
                src={embedUrl}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#E4EDF1] bg-white px-4 py-3 text-[11px] leading-4 text-[#66737F] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span>Playback stays inside Margin. Close this window to return to the page.</span>
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent(ANALYTICS_EVENTS.demoVideoClicked, {
              cta_location: analyticsLocation,
              video_name: videoName,
              destination: videoUrl,
            })}
            className="inline-flex items-center gap-1.5 font-semibold text-[#0B74DE] transition hover:text-[#0869C9]"
          >
            Open on YouTube
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
