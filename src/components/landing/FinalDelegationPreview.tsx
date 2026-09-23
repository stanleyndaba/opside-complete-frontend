import React from "react";

export function FinalDelegationPreview({ compactMobile = false, src = "/recover-once", title = "Recover Once page preview" }: { compactMobile?: boolean; src?: string; title?: string }) {
  return (
    <div className="relative overflow-hidden">
      <div className={`relative ${compactMobile ? "h-[300px]" : "h-[520px]"} overflow-hidden sm:h-[600px]`}>
        <iframe title={title} src={src} className="h-full w-full border-0 bg-[#FBFAF7]" loading="lazy" />
      </div>
    </div>
  );
}

export default FinalDelegationPreview;
