import React from "react";

export function FinalDelegationPreview({ compactMobile = false, tallMobile = false, expandedMobile = false, priority = false, src = "/recover-once", title = "Recover Once page preview" }: { compactMobile?: boolean; tallMobile?: boolean; expandedMobile?: boolean; priority?: boolean; src?: string; title?: string }) {
  return (
    <div className="relative overflow-hidden rounded-[5px]">
      <div className={`relative ${expandedMobile ? "h-[620px]" : compactMobile ? (tallMobile ? "h-[760px]" : "h-[300px]") : "h-[520px]"} overflow-hidden rounded-[5px] sm:h-[600px]`}>
        <iframe title={title} src={src} className="h-full w-full rounded-[5px] border-0 bg-[#FBFAF7]" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
      </div>
    </div>
  );
}

export default FinalDelegationPreview;
