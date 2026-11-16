import { useEffect, useRef, useState } from "react";
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
    <div className="min-h-screen overflow-hidden bg-[#EAF1F5] p-2 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1280px] rounded-[14px] bg-[#DDE8ED]/65 p-2 shadow-[0_24px_70px_rgba(72,103,122,0.13)] sm:p-4 md:p-6">
        <ScaledDemoStage>
          <DiscrepancyModalVisual />
        </ScaledDemoStage>
      </div>
    </div>
  );
}
