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
      <DialogContent className="w-[calc(100vw-24px)] max-w-5xl gap-0 overflow-hidden rounded-[28px] border border-[#DCE6EC] bg-[#FBFCFD] p-0 text-[#182026] shadow-[0_36px_120px_rgba(24,32,38,0.22)] sm:rounded-[34px] [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:bg-white [&>button]:p-2 [&>button]:text-[#25313A] [&>button]:opacity-100 [&>button]:shadow-[0_10px_30px_rgba(24,32,38,0.12)] [&>button:hover]:bg-[#F3F6F8]">
        <div className="relative overflow-hidden bg-white px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_18%_0%,rgba(11,116,222,0.1),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(46,125,91,0.08),transparent_36%)]" />
          <div className="relative max-w-3xl pr-12">
            <div className="text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">
              Event-to-recovery walkthrough
            </div>
            <DialogTitle className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.035em] text-[#182026] sm:text-[28px]">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-3 max-w-2xl text-sm leading-6 text-[#66737F] sm:text-[15px] sm:leading-7">
              {description}
            </DialogDescription>
          </div>
        </div>

        <div className="bg-[#FBFCFD] px-3 pb-3 sm:px-5 sm:pb-5">
          <div className="relative aspect-video overflow-hidden rounded-[20px] border border-[#DCE6EC] bg-[#0B1117] shadow-[0_24px_70px_rgba(24,32,38,0.18)] sm:rounded-[26px]">
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

        <div className="flex flex-col gap-3 border-t border-[#E4EDF1] bg-white px-5 py-4 text-xs leading-5 text-[#66737F] sm:flex-row sm:items-center sm:justify-between sm:px-7">
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
