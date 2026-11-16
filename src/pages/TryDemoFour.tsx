import { DiscrepanciesPresentation } from "@/pages/Discrepancies";
import { ScaledDemoStage } from "@/components/landing/ScaledDemoStage";
import { PUBLIC_ROUTE_META } from "@/config/seo";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function TryDemoFour() {
  usePageMeta(PUBLIC_ROUTE_META["/try-demo-four"]);

  return (
    <div className="min-h-0 overflow-hidden bg-transparent p-0 sm:min-h-screen sm:bg-[#EAF1F5] sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1280px] rounded-none bg-transparent p-0 shadow-none sm:rounded-[14px] sm:bg-[#DDE8ED]/65 sm:p-4 sm:shadow-[0_24px_70px_rgba(72,103,122,0.13)] md:p-6">
        <div className="relative h-[min(600px,62vw)] min-h-[320px] overflow-y-auto overscroll-contain rounded-[10px] border border-[#C9D9E1] bg-[#FBFAF7] shadow-[0_10px_30px_rgba(37,49,58,0.09)]">
          <ScaledDemoStage designWidth={1280} designHeight={900}>
            <DiscrepanciesPresentation eyebrow={null} title="Financial Marketplace Issues" />
          </ScaledDemoStage>
        </div>
      </div>
    </div>
  );
}
