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

export function DemoVideoModal({
  open,
  onOpenChange,
  videoUrl,
  title = 'Margin product demo',
  description = 'Watch how Margin turns Amazon loss events into claim-ready recovery work.',
}: DemoVideoModalProps) {
  const videoId = getYouTubeId(videoUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : videoUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-28px)] max-w-5xl gap-0 overflow-hidden rounded-3xl border border-white/10 bg-[#080D12] p-0 text-white shadow-[0_34px_120px_rgba(0,0,0,0.44)] [&>button]:text-white [&>button]:opacity-80 [&>button:hover]:opacity-100">
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <DialogTitle className="text-base font-semibold tracking-tight text-white sm:text-lg">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-1 max-w-2xl text-sm leading-6 text-white/56">
            {description}
          </DialogDescription>
        </div>

        <div className="relative aspect-video bg-black">
          {open ? (
            <iframe
              title={title}
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 text-xs text-white/48 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Playback stays inside Margin. Close this window to return to the page.</span>
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-white/70 transition hover:text-white"
          >
            Open on YouTube
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
