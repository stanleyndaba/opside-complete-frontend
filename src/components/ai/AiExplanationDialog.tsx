import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AiExplanation } from '@/lib/api';
import { AiExplanationContent } from './AiExplanationContent';

type AiExplanationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  loading: boolean;
  error: string | null;
  explanation: AiExplanation | null;
  onRetry?: () => void;
};

export function AiExplanationDialog({
  open,
  onOpenChange,
  title,
  description,
  loading,
  error,
  explanation,
  onRetry,
}: AiExplanationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[82vh] w-[min(94vw,960px)] max-w-4xl overflow-hidden rounded-none border border-white/10 bg-[#070707] p-0 text-white shadow-2xl backdrop-blur-3xl">
        <DialogHeader className="border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-[20px] font-sans font-medium tracking-tight text-white">{title}</DialogTitle>
          <DialogDescription className="mt-1 max-w-2xl text-[12px] font-sans leading-5 tracking-tight text-white/[0.5]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(82vh-88px)] overflow-y-auto">
          <AiExplanationContent
            loading={loading}
            error={error}
            explanation={explanation}
            onRetry={onRetry}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
