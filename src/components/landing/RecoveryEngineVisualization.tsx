import React, { useEffect, useMemo, useRef, useState } from 'react';

type NodeKind = 'input' | 'stage' | 'core' | 'output';

interface SceneNode {
  id: string;
  label: string;
  shortLabel?: string;
  x: number;
  y: number;
  kind: NodeKind;
  emphasis?: 'high' | 'medium';
}

interface SceneEdge {
  from: string;
  to: string;
  stage: number;
}

const stageLabels = [
  'Signal discovered',
  'Evidence matched',
  'Ready to file',
  'Submitted',
  'Reconciled'
];

const inputNodes: SceneNode[] = [
  { id: 'inventory', label: 'FBA Inventory', x: 0.11, y: 0.18, kind: 'input' },
  { id: 'shipments', label: 'Shipments', x: 0.11, y: 0.33, kind: 'input' },
  { id: 'returns', label: 'Returns / Refunds', x: 0.11, y: 0.5, kind: 'input' },
  { id: 'fees', label: 'Fee Events', x: 0.11, y: 0.67, kind: 'input' },
  { id: 'reimbursements', label: 'Reimbursements', x: 0.11, y: 0.82, kind: 'input' }
];

const centerNodes: SceneNode[] = [
  { id: 'detect', label: 'Detection', shortLabel: 'Detect', x: 0.34, y: 0.28, kind: 'stage', emphasis: 'medium' },
  { id: 'evidence', label: 'Evidence', shortLabel: 'Evidence', x: 0.42, y: 0.72, kind: 'stage', emphasis: 'medium' },
  { id: 'core', label: 'Margin Recovery Engine', shortLabel: 'Margin Engine', x: 0.54, y: 0.5, kind: 'core', emphasis: 'high' },
  { id: 'filing', label: 'Filing', shortLabel: 'Filing', x: 0.68, y: 0.28, kind: 'stage', emphasis: 'medium' },
  { id: 'payout', label: 'Payout', shortLabel: 'Payout', x: 0.74, y: 0.72, kind: 'stage', emphasis: 'medium' }
];

const outputNodes: SceneNode[] = [
  { id: 'detected', label: 'Detected', x: 0.9, y: 0.18, kind: 'output' },
  { id: 'evidence-ready', label: 'Evidence Ready', x: 0.9, y: 0.38, kind: 'output' },
  { id: 'filed', label: 'Filed', x: 0.9, y: 0.56, kind: 'output' },
  { id: 'approved', label: 'Approved', x: 0.9, y: 0.74, kind: 'output' },
  { id: 'recovered', label: 'Recovered $', x: 0.9, y: 0.88, kind: 'output' }
];

const edges: SceneEdge[] = [
  ...inputNodes.map((node) => ({ from: node.id, to: 'detect', stage: 0 })),
  { from: 'detect', to: 'detected', stage: 0 },
  { from: 'detect', to: 'core', stage: 0 },
  { from: 'detect', to: 'evidence', stage: 1 },
  { from: 'evidence', to: 'evidence-ready', stage: 1 },
  { from: 'evidence', to: 'core', stage: 1 },
  { from: 'core', to: 'filing', stage: 2 },
  { from: 'filing', to: 'filed', stage: 2 },
  { from: 'filing', to: 'payout', stage: 3 },
  { from: 'payout', to: 'approved', stage: 3 },
  { from: 'payout', to: 'recovered', stage: 4 },
  { from: 'core', to: 'payout', stage: 4 }
];

const sceneNodes = [...inputNodes, ...centerNodes, ...outputNodes];

const toClipSpace = (x: number, y: number) => ({
  x: x * 2 - 1,
  y: 1 - y * 2
});

const makeShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const makeProgram = (gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) => {
  const vertexShader = makeShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = makeShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
};

const lineVertexSource = `
attribute vec2 aPosition;
attribute vec4 aColor;
uniform float uPointSize;
varying vec4 vColor;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  gl_PointSize = uPointSize;
  vColor = aColor;
}
`;

const lineFragmentSource = `
precision mediump float;
varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`;

const pointFragmentSource = `
precision mediump float;
varying vec4 vColor;

void main() {
  vec2 centered = gl_PointCoord - vec2(0.5);
  float dist = length(centered);
  if (dist > 0.5) {
    discard;
  }
  float softness = smoothstep(0.5, 0.15, dist);
  gl_FragColor = vec4(vColor.rgb, vColor.a * softness);
}
`;

export function RecoveryEngineVisualization() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeStage, setActiveStage] = useState(0);

  const nodeMap = useMemo(() => new Map(sceneNodes.map((node) => [node.id, node])), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true
    });

    if (!gl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lineProgram = makeProgram(gl, lineVertexSource, lineFragmentSource);
    const pointProgram = makeProgram(gl, lineVertexSource, pointFragmentSource);
    if (!lineProgram || !pointProgram) return;

    const linePositionBuffer = gl.createBuffer();
    const lineColorBuffer = gl.createBuffer();
    const pointPositionBuffer = gl.createBuffer();
    const pointColorBuffer = gl.createBuffer();
    const packetPositionBuffer = gl.createBuffer();
    const packetColorBuffer = gl.createBuffer();
    const gridPositionBuffer = gl.createBuffer();
    const gridColorBuffer = gl.createBuffer();

    if (!linePositionBuffer || !lineColorBuffer || !pointPositionBuffer || !pointColorBuffer || !packetPositionBuffer || !packetColorBuffer || !gridPositionBuffer || !gridColorBuffer) {
      return;
    }

    const gridPoints: number[] = [];
    const gridColors: number[] = [];
    for (let x = 0.06; x <= 0.94; x += 0.06) {
      for (let y = 0.08; y <= 0.92; y += 0.08) {
        const clip = toClipSpace(x, y);
        gridPoints.push(clip.x, clip.y);
        gridColors.push(1, 1, 1, 0.045);
      }
    }

    const drawPoints = (
      program: WebGLProgram,
      positions: Float32Array,
      colors: Float32Array,
      pointSize: number,
      mode: number
    ) => {
      const positionLocation = gl.getAttribLocation(program, 'aPosition');
      const colorLocation = gl.getAttribLocation(program, 'aColor');
      const pointSizeLocation = gl.getUniformLocation(program, 'uPointSize');

      const positionBuffer = mode === gl.POINTS && pointSize > 12 ? packetPositionBuffer : mode === gl.POINTS ? pointPositionBuffer : linePositionBuffer;
      const colorBuffer = mode === gl.POINTS && pointSize > 12 ? packetColorBuffer : mode === gl.POINTS ? pointColorBuffer : lineColorBuffer;

      gl.useProgram(program);
      gl.uniform1f(pointSizeLocation, pointSize);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

      gl.drawArrays(mode, 0, positions.length / 2);
    };

    const drawGrid = () => {
      const positionLocation = gl.getAttribLocation(pointProgram, 'aPosition');
      const colorLocation = gl.getAttribLocation(pointProgram, 'aColor');
      const pointSizeLocation = gl.getUniformLocation(pointProgram, 'uPointSize');

      gl.useProgram(pointProgram);
      gl.uniform1f(pointSizeLocation, 2.4);

      gl.bindBuffer(gl.ARRAY_BUFFER, gridPositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridPoints), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, gridColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridColors), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, gridPoints.length / 2);
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    let frame = 0;
    let rafId = 0;

    const render = (now: number) => {
      const time = prefersReducedMotion ? 0 : now * 0.001;
      const stageDuration = 2.4;
      const stageFloat = prefersReducedMotion ? 0 : (time / stageDuration) % stageLabels.length;
      const stageIndex = Math.floor(stageFloat);
      const stageProgress = stageFloat - stageIndex;

      if (frame % 8 === 0) {
        setActiveStage(stageIndex);
      }
      frame += 1;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      drawGrid();

      const linePositions: number[] = [];
      const lineColors: number[] = [];

      edges.forEach((edge) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return;

        const fromClip = toClipSpace(from.x, from.y);
        const toClip = toClipSpace(to.x, to.y);
        linePositions.push(fromClip.x, fromClip.y, toClip.x, toClip.y);

        const isActive = edge.stage === stageIndex;
        const alpha = isActive ? 0.85 : 0.16;
        const color = edge.stage >= 3
          ? [0.92, 0.79, 0.4, alpha]
          : isActive
            ? [0.9, 0.9, 0.95, alpha]
            : [0.62, 0.62, 0.68, alpha];

        lineColors.push(...color, ...color);
      });

      drawPoints(lineProgram, new Float32Array(linePositions), new Float32Array(lineColors), 1, gl.LINES);

      const nodePositions: number[] = [];
      const nodeColors: number[] = [];

      sceneNodes.forEach((node) => {
        const clip = toClipSpace(node.x, node.y);
        nodePositions.push(clip.x, clip.y);

        const isCore = node.kind === 'core';
        const isStage = node.kind === 'stage';
        const isStageActive = ['detect', 'evidence', 'filing', 'payout'].includes(node.id) && (
          (stageIndex === 0 && node.id === 'detect')
          || (stageIndex === 1 && node.id === 'evidence')
          || (stageIndex === 2 && node.id === 'filing')
          || ((stageIndex === 3 || stageIndex === 4) && node.id === 'payout')
        );

        const pulse = isCore ? 0.18 + Math.sin(time * 2.2) * 0.08 : isStageActive ? 0.18 + Math.sin(time * 3.4) * 0.08 : 0;
        const color = isCore
          ? [0.98, 0.98, 1, 0.95]
          : node.kind === 'output'
            ? [0.93, 0.82, 0.44, 0.85]
            : node.kind === 'input'
              ? [0.72, 0.74, 0.78, 0.7]
              : [0.88, 0.9, 0.94, 0.72 + pulse];

        nodeColors.push(...color);
      });

      const pointSizes: number[] = sceneNodes.map((node) => (
        node.kind === 'core' ? 34 : node.kind === 'stage' ? 18 : 12
      ));

      // draw node halos and nodes in three passes for cleaner emphasis
      const haloPositions: number[] = [];
      const haloColors: number[] = [];
      sceneNodes.forEach((node) => {
        if (node.kind !== 'core' && node.kind !== 'stage') return;
        const clip = toClipSpace(node.x, node.y);
        haloPositions.push(clip.x, clip.y);
        const isCore = node.kind === 'core';
        const isActive = ['detect', 'evidence', 'filing', 'payout'].includes(node.id) && (
          (stageIndex === 0 && node.id === 'detect')
          || (stageIndex === 1 && node.id === 'evidence')
          || (stageIndex === 2 && node.id === 'filing')
          || ((stageIndex === 3 || stageIndex === 4) && node.id === 'payout')
        );
        haloColors.push(
          isCore ? 0.96 : 0.88,
          isCore ? 0.96 : 0.9,
          isCore ? 1 : 0.94,
          isCore ? 0.18 + Math.sin(time * 2.2) * 0.06 : isActive ? 0.16 + Math.sin(time * 2.8) * 0.05 : 0.04
        );
      });

      if (haloPositions.length > 0) {
        drawPoints(pointProgram, new Float32Array(haloPositions), new Float32Array(haloColors), 42, gl.POINTS);
      }

      const groupedNodes = [12, 18, 34];
      groupedNodes.forEach((size) => {
        const positions: number[] = [];
        const colors: number[] = [];
        sceneNodes.forEach((node, index) => {
          if (pointSizes[index] !== size) return;
          const clip = toClipSpace(node.x, node.y);
          positions.push(clip.x, clip.y);
          colors.push(...nodeColors.slice(index * 4, index * 4 + 4));
        });
        if (positions.length > 0) {
          drawPoints(pointProgram, new Float32Array(positions), new Float32Array(colors), size, gl.POINTS);
        }
      });

      const packetPositions: number[] = [];
      const packetColors: number[] = [];

      edges
        .filter((edge) => edge.stage === stageIndex)
        .forEach((edge, edgeIndex) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return;

          const pulseCount = edge.stage === 0 ? 2 : 1;
          for (let pulse = 0; pulse < pulseCount; pulse += 1) {
            const t = prefersReducedMotion ? 0.5 : (stageProgress + pulse * 0.32 + edgeIndex * 0.07) % 1;
            const x = from.x + (to.x - from.x) * t;
            const y = from.y + (to.y - from.y) * t;
            const clip = toClipSpace(x, y);
            packetPositions.push(clip.x, clip.y);
            packetColors.push(
              edge.stage >= 3 ? 0.98 : 0.96,
              edge.stage >= 3 ? 0.84 : 0.96,
              edge.stage >= 3 ? 0.42 : 1,
              0.95
            );
          }
        });

      if (packetPositions.length > 0) {
        drawPoints(pointProgram, new Float32Array(packetPositions), new Float32Array(packetColors), 16, gl.POINTS);
      }

      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      gl.deleteBuffer(linePositionBuffer);
      gl.deleteBuffer(lineColorBuffer);
      gl.deleteBuffer(pointPositionBuffer);
      gl.deleteBuffer(pointColorBuffer);
      gl.deleteBuffer(packetPositionBuffer);
      gl.deleteBuffer(packetColorBuffer);
      gl.deleteBuffer(gridPositionBuffer);
      gl.deleteBuffer(gridColorBuffer);
      gl.deleteProgram(lineProgram);
      gl.deleteProgram(pointProgram);
    };
  }, [nodeMap]);

  const overlayNodes = useMemo(
    () => sceneNodes.filter((node) => node.kind !== 'core'),
    []
  );

  return (
    <div className="relative mt-16 overflow-hidden rounded-[28px] border border-white/10 bg-[#090909]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_55%)]" />
      <div className="relative h-[620px] w-full md:h-[680px]">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        <div className="pointer-events-none absolute left-6 top-6 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-medium tracking-tight text-white/58 backdrop-blur-sm">
          Amazon signals
        </div>
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-medium tracking-tight text-white/58 backdrop-blur-sm">
          Margin orchestration layer
        </div>
        <div className="pointer-events-none absolute right-6 top-6 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-medium tracking-tight text-white/58 backdrop-blur-sm">
          Resolved outcomes
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[240px] -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-[11px] font-medium tracking-tight text-white/45">Margin Recovery Engine</div>
          <div className="mt-3 text-2xl font-medium tracking-tight text-white md:text-[32px]">
            Detection to payout, routed through one intelligence layer.
          </div>
        </div>

        {overlayNodes.map((node) => (
          <div
            key={node.id}
            className="pointer-events-none absolute hidden -translate-x-1/2 -translate-y-1/2 md:block"
            style={{ left: `${node.x * 100}%`, top: `${node.y * 100}%` }}
          >
            <div className="rounded-full border border-white/8 bg-black/45 px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/70 backdrop-blur-sm">
              {node.shortLabel || node.label}
            </div>
          </div>
        ))}

        <div className="pointer-events-none absolute bottom-6 left-6 right-6">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="flex flex-wrap gap-2">
              {stageLabels.map((label, index) => (
                <div
                  key={label}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-tight transition-colors ${
                    activeStage === index
                      ? 'border-white/14 bg-white/[0.09] text-white'
                      : 'border-white/8 bg-white/[0.02] text-white/45'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="max-w-[280px] text-sm leading-6 text-white/52 md:text-right">
              Amazon chaos comes in. The engine detects it, assembles the case, routes the filing, and reconciles the payout.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
