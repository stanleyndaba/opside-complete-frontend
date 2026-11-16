import { useEffect, useRef, useState } from "react";

export function ScaledDemoStage({
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
