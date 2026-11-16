import { DuplicatePipelineVisual } from "@/pages/DuplicatePipelinePreview";
import { ScaledDemoStage } from "@/components/landing/ScaledDemoStage";
import { PUBLIC_ROUTE_META } from "@/config/seo";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function TryDemoThree() {
  usePageMeta(PUBLIC_ROUTE_META["/try-demo-three"]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#EAF1F5] p-2 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1280px] rounded-[14px] bg-[#DDE8ED]/65 p-2 shadow-[0_24px_70px_rgba(72,103,122,0.13)] sm:p-4 md:p-6">
        <div className="relative h-[min(600px,62vw)] min-h-[320px] overflow-y-auto overscroll-contain rounded-[10px] border border-[#C9D9E1] bg-[#FBFAF7] shadow-[0_10px_30px_rgba(37,49,58,0.09)]">
          <ScaledDemoStage designHeight={620}>
            <DuplicatePipelineVisual />
          </ScaledDemoStage>
        </div>
      </div>
    </div>
  );
}
