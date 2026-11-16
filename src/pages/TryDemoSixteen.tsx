import { ScaledDemoStage } from "@/components/landing/ScaledDemoStage";
import { PUBLIC_ROUTE_META } from "@/config/seo";
import { usePageMeta } from "@/hooks/usePageMeta";
import { AccuracyGraphContent } from "@/pages/AccuracyGraph";

export default function TryDemoSixteen() {
  usePageMeta(PUBLIC_ROUTE_META["/try-demo-sixteen"]);

  return (
    <div className="min-h-0 overflow-hidden bg-transparent p-0 sm:min-h-screen sm:bg-[#EAF1F5] sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1280px] rounded-none bg-transparent p-0 shadow-none sm:rounded-[14px] sm:bg-[#DDE8ED]/65 sm:p-4 sm:shadow-[0_24px_70px_rgba(72,103,122,0.13)] md:p-6">
        <div className="relative h-auto min-h-0 overflow-y-auto overscroll-contain rounded-[10px] border border-[#C9D9E1] bg-[#E7E9EB] shadow-[0_10px_30px_rgba(37,49,58,0.09)] sm:h-[min(600px,62vw)] sm:min-h-[320px]">
          <ScaledDemoStage designWidth={1180} designHeight={900}>
            <AccuracyGraphContent />
          </ScaledDemoStage>
        </div>
      </div>
    </div>
  );
}
