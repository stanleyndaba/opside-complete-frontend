import { FinalDelegationPreview } from "@/components/landing/FinalDelegationPreview";
import { ScaledDemoStage } from "@/components/landing/ScaledDemoStage";
import { PUBLIC_ROUTE_META } from "@/config/seo";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function TryDemoTwo() {
  usePageMeta(PUBLIC_ROUTE_META["/try-demo-two"]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#EAF1F5] p-2 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1280px] rounded-[14px] bg-[#DDE8ED]/65 p-2 shadow-[0_24px_70px_rgba(72,103,122,0.13)] sm:p-4 md:p-6">
        <ScaledDemoStage designHeight={620}>
          <FinalDelegationPreview compactMobile expandedMobile src="/filing-pipeline-preview" title="Recovery operations page preview" />
        </ScaledDemoStage>
      </div>
    </div>
  );
}
