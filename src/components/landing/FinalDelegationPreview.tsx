import React from "react";
import { BatteryFull, Wifi } from "lucide-react";

export function FinalDelegationPreview({ compactMobile = false, tallMobile = false, expandedMobile = false, priority = false, showMacChrome = false, src = "/recover-once", title = "Recover Once page preview" }: { compactMobile?: boolean; tallMobile?: boolean; expandedMobile?: boolean; priority?: boolean; showMacChrome?: boolean; src?: string; title?: string }) {
  const previewHeight = expandedMobile ? "h-[620px]" : compactMobile ? (tallMobile ? "h-[760px]" : "h-[300px]") : "h-[520px]";
  return (
    <div className="relative overflow-hidden rounded-[5px] bg-white">
      <div className={`relative ${previewHeight} overflow-hidden rounded-[5px] bg-white sm:h-[600px]`}>
        {showMacChrome ? (
          <div className="flex h-9 items-center justify-between bg-white px-3 text-[#66737F]" aria-label="Mac browser preview chrome">
            <div className="flex items-center gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-[#D8DDE0]" /><span className="h-2.5 w-2.5 rounded-full bg-[#D8DDE0]" /><span className="h-2.5 w-2.5 rounded-full bg-[#D8DDE0]" /></div>
            <div className="flex items-center gap-2.5" aria-hidden="true"><Wifi className="h-3.5 w-3.5" strokeWidth={2} /><BatteryFull className="h-4 w-4" strokeWidth={2} /><span className="flex items-center gap-1 rounded-full bg-[#F1F3F4] px-2 py-1 text-[9px] font-semibold tracking-tight text-[#26333A]"><span className="relative flex h-3.5 w-5 items-center" aria-hidden="true"><span className="absolute left-0 top-[5px] h-1 w-3 rounded-sm bg-[#182026]" /><span className="absolute left-1 top-[2px] h-1 w-3 rounded-sm bg-[#182026]" /></span>Margin<span className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" /></span></div>
          </div>
        ) : null}
        <iframe title={title} src={src} className={`${showMacChrome ? "h-[calc(100%-36px)]" : "h-full"} w-full rounded-[5px] border-0 bg-white`} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
      </div>
    </div>
  );
}

export default FinalDelegationPreview;
