import React from 'react';
import { ExternalLink } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

interface DemoVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title?: string;
  description?: string;
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
}: DemoVideoModalProps) {
  const embedUrl = buildYouTubeEmbedUrl(videoUrl);

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
          <div className="relative mx-auto aspect-video max-h-[52dvh] w-full overflow-hidden rounded-[14px] border border-[#DCE6EC] bg-[#0B1117] shadow-[0_18px_50px_rgba(24,32,38,0.16)] sm:rounded-[18px]">
            {open ? (
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
