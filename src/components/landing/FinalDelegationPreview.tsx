import React from "react";

export function FinalDelegationPreview({ compactMobile = false }: { compactMobile?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] px-1.5 py-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:px-2.5 sm:py-3">
      <div className="flex h-7 items-center gap-1.5 border-b border-[#D9E2E6] px-2">
        <span className="h-2 w-2 rounded-full bg-[#D7DAD7]" />
        <span className="h-2 w-2 rounded-full bg-[#D7DAD7]" />
        <span className="h-2 w-2 rounded-full bg-[#D7DAD7]" />
      </div>
      <div className={`relative ${compactMobile ? "h-[360px]" : "h-[520px]"} overflow-hidden rounded-[5px] bg-[#FBFAF7] sm:h-[600px]`}>
        <iframe title="Recover Once page preview" src="/recover-once" className="h-full w-full border-0 bg-[#FBFAF7]" loading="lazy" />
      </div>
    </div>
  );
}

export default FinalDelegationPreview;
