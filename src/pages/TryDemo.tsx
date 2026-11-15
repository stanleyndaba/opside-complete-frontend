import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandFooter } from "@/components/layout/BrandFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { DiscrepancyModalVisual } from "@/components/landing/DiscrepancyModalVisual";
import { PUBLIC_ROUTE_META } from "@/config/seo";
import { usePageMeta } from "@/hooks/usePageMeta";

function ScaledDemoStage({
  children,
  designWidth = 900,
  designHeight = 520,
}: {
  children: React.ReactNode;
  designWidth?: number;
  designHeight?: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(designHeight);

  useEffect(() => {
    const frame = frameRef.current;
    const scene = sceneRef.current;
    if (!frame || !scene) return;

    const update = () => {
      const availableWidth = frame.clientWidth || designWidth;
      const nextScale = Math.min(1, availableWidth / designWidth);
      setScale(nextScale);
      setHeight(Math.max(1, scene.scrollHeight * nextScale));
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(frame);
    resizeObserver.observe(scene);
    window.addEventListener("resize", update);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [designWidth]);

  return (
    <div ref={frameRef} className="relative w-full overflow-hidden" style={{ height }}>
      <div
        ref={sceneRef}
        className="absolute left-0 top-0 w-[900px]"
        style={{
          width: designWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function TryDemo() {
  usePageMeta(PUBLIC_ROUTE_META["/try-demo"]);

  return (
    <div className="landing-page landing-google-sans min-h-screen bg-[#F6F8F9] text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <PublicNavbar variant="light" wide />
      <main className="pt-20 md:pt-24">
        <section className="relative overflow-hidden bg-[#F6F8F9] px-5 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14 md:px-8 md:pb-20 md:pt-20 lg:px-10 2xl:px-12">
          <div className="mx-auto max-w-[1280px]">
            <div className="max-w-[900px]">
              <p className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#71808A]">Try the Margin evidence visual</p>
              <h1 className="mt-4 max-w-[860px] font-lora text-[39px] leading-[0.98] tracking-[-0.05em] text-[#182026] sm:text-[56px] md:text-[72px]" style={{ fontWeight: 400 }}>
                Your Finance team should not have to rebuild the same financial history every time.
              </h1>
              <p className="mt-6 max-w-[760px] text-[15px] leading-7 text-[#4D5B66] sm:text-[17px] sm:leading-8">
                Explore the same evidence reconstruction visual used on the landing page. Switch between the finding and proof views to see how Margin connects the financial exposure, source records, required documentation, and remaining approval position.
              </p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-[#DCE8EE] bg-[#EAF1F5] px-5 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 lg:px-10 2xl:px-12" aria-labelledby="try-demo-stage-title">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#71808A]">Cross-marketplace financial position</p>
                <h2 id="try-demo-stage-title" className="mt-2 font-lora text-[25px] leading-[1.05] tracking-[-0.035em] text-[#182026] sm:text-[32px]" style={{ fontWeight: 400 }}>Evidence before action.</h2>
              </div>
              <span className="rounded-full border border-[#C8D7DE] bg-white/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-tight text-[#5B6C76]">Interactive visual</span>
            </div>
            <div className="rounded-[14px] bg-[#DDE8ED]/65 p-2 shadow-[0_24px_70px_rgba(72,103,122,0.13)] sm:p-4 md:p-6">
              <ScaledDemoStage>
                <DiscrepancyModalVisual />
              </ScaledDemoStage>
            </div>
            <p className="mt-5 max-w-[720px] text-[12px] leading-5 text-[#667780]">The visual is built from the same live Margin component as the landing page. It is scaled as one coherent scene on smaller screens so the evidence hierarchy remains legible instead of collapsing into a narrow card.</p>
          </div>
        </section>

        <section className="bg-white px-5 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-10 2xl:px-12">
          <div className="mx-auto grid max-w-[1280px] gap-8 md:grid-cols-3 md:gap-10">
            {[
              ["01 / CONNECT", "Link the financial event to the settlement, fulfillment, marketplace, and entity records that explain it."],
              ["02 / PROVE", "Separate what the available evidence establishes from what remains required or unresolved."],
              ["03 / CONTROL", "Keep the financial position visible before any recovery action crosses the approval boundary."],
            ].map(([label, body]) => (
              <article key={label} className="border-t border-[#DCE3E1] pt-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#71808A]">{label}</p>
                <p className="mt-3 max-w-[340px] text-[14px] leading-6 text-[#52616A]">{body}</p>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-[1280px]">
            <Link to="/review-consent" className="inline-flex h-11 items-center gap-2 rounded-[3px] bg-[#F05A3C] px-5 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(240,90,60,0.18)] transition-colors hover:bg-[#D9472D]">
              Review your financial position <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <BrandFooter />
    </div>
  );
}
