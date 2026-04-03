import React, { useEffect, useMemo, useRef, useState } from 'react';

type NodeKind = 'input' | 'stage' | 'output' | 'source';

interface SceneNode {
  id: string;
  label: string;
  shortLabel?: string;
  x: number;
  y: number;
  kind: NodeKind;
  iconSrc?: string;
  iconAlt?: string;
}

interface SceneRoute {
  id: string;
  points: Array<{ x: number; y: number }>;
  stage: number;
  role: 'intake' | 'trunk' | 'evidence' | 'output';
}

const stageLabels = [
  'Signal discovered',
  'Evidence matched',
  'Ready to file',
  'Submitted',
  'Reconciled'
];

const amazonNode: SceneNode = {
  id: 'amazon',
  label: 'Amazon',
  x: 0.05,
  y: 0.52,
  kind: 'input',
  iconSrc: '/AMZN.png',
  iconAlt: 'Amazon'
};

const inputNodes: SceneNode[] = [
  { id: 'inventory', label: 'FBA Inventory', x: 0.09, y: 0.18, kind: 'input' },
  { id: 'shipments', label: 'Shipments', x: 0.09, y: 0.3, kind: 'input' },
  { id: 'returns', label: 'Returns / Refunds', x: 0.09, y: 0.42, kind: 'input' },
  { id: 'fees', label: 'Fee Events', x: 0.09, y: 0.54, kind: 'input' },
  { id: 'settlements', label: 'Settlement / Ledger', x: 0.09, y: 0.66, kind: 'input' },
  { id: 'reimbursements', label: 'Reimbursements', x: 0.09, y: 0.78, kind: 'input' }
];

const stageNodes: SceneNode[] = [
  { id: 'detect', label: 'Detect', x: 0.34, y: 0.52, kind: 'stage' },
  { id: 'evidence', label: 'Evidence', x: 0.5, y: 0.52, kind: 'stage' },
  { id: 'filing', label: 'Filing', x: 0.68, y: 0.52, kind: 'stage' },
  { id: 'payout', label: 'Payout', x: 0.84, y: 0.52, kind: 'stage' }
];

const outputNodes: SceneNode[] = [
  { id: 'detected', label: 'Detected', x: 0.93, y: 0.22, kind: 'output' },
  { id: 'evidence-ready', label: 'Evidence Ready', x: 0.93, y: 0.38, kind: 'output' },
  { id: 'filed', label: 'Filed', x: 0.93, y: 0.52, kind: 'output' },
  { id: 'approved', label: 'Approved', x: 0.93, y: 0.68, kind: 'output' },
  { id: 'recovered', label: 'Recovered $', x: 0.93, y: 0.82, kind: 'output' }
];

const evidenceSourceNodes: SceneNode[] = [
  { id: 'gmail-source', label: 'Gmail', shortLabel: 'Gmail', x: 0.47, y: 0.3, kind: 'source', iconSrc: '/gmailicon.png', iconAlt: 'Gmail' },
  { id: 'outlook-source', label: 'Outlook', shortLabel: 'Outlook', x: 0.4, y: 0.41, kind: 'source', iconSrc: '/outlookicon.webp', iconAlt: 'Outlook' },
  { id: 'dropbox-source', label: 'Dropbox', shortLabel: 'Dropbox', x: 0.4, y: 0.63, kind: 'source', iconSrc: '/DPP.png', iconAlt: 'Dropbox' },
  { id: 'onedrive-source', label: 'OneDrive', shortLabel: 'OneDrive', x: 0.47, y: 0.74, kind: 'source', iconSrc: '/onedrivelogo.png', iconAlt: 'OneDrive' },
  { id: 'adobe-sign-source', label: 'Adobe Sign', shortLabel: 'Adobe Sign', x: 0.59, y: 0.3, kind: 'source', iconSrc: '/adobesign.png', iconAlt: 'Adobe Sign' },
  { id: 'slack-source', label: 'Slack', shortLabel: 'Slack', x: 0.59, y: 0.74, kind: 'source', iconSrc: '/slack2.png', iconAlt: 'Slack' }
];

const allNodes = [amazonNode, ...inputNodes, ...stageNodes, ...outputNodes, ...evidenceSourceNodes];

const routes: SceneRoute[] = [
  ...inputNodes.map((node) => ({
    id: `amazon-${node.id}`,
    stage: 0,
    role: 'intake' as const,
    points: [
      { x: amazonNode.x, y: amazonNode.y },
      { x: 0.06, y: amazonNode.y },
      { x: 0.06, y: node.y },
      { x: node.x, y: node.y }
    ]
  })),
  ...inputNodes.map((node) => ({
    id: `${node.id}-intake`,
    stage: 0,
    role: 'intake' as const,
    points: [
      { x: node.x, y: node.y },
      { x: 0.22, y: node.y },
      { x: 0.22, y: 0.52 },
      { x: 0.34, y: 0.52 }
    ]
  })),
  {
    id: 'detect-to-evidence',
    stage: 1,
    role: 'trunk',
    points: [
      { x: 0.34, y: 0.52 },
      { x: 0.5, y: 0.52 }
    ]
  },
  {
    id: 'evidence-to-filing',
    stage: 2,
    role: 'trunk',
    points: [
      { x: 0.5, y: 0.52 },
      { x: 0.68, y: 0.52 }
    ]
  },
  {
    id: 'filing-to-payout',
    stage: 3,
    role: 'trunk',
    points: [
      { x: 0.68, y: 0.52 },
      { x: 0.84, y: 0.52 }
    ]
  },
  {
    id: 'detect-output',
    stage: 0,
    role: 'output',
    points: [
      { x: 0.34, y: 0.52 },
      { x: 0.34, y: 0.22 },
      { x: 0.93, y: 0.22 }
    ]
  },
  {
    id: 'evidence-output',
    stage: 1,
    role: 'output',
    points: [
      { x: 0.5, y: 0.52 },
      { x: 0.5, y: 0.38 },
      { x: 0.93, y: 0.38 }
    ]
  },
  {
    id: 'filing-output',
    stage: 2,
    role: 'output',
    points: [
      { x: 0.68, y: 0.52 },
      { x: 0.93, y: 0.52 }
    ]
  },
  {
    id: 'approved-output',
    stage: 3,
    role: 'output',
    points: [
      { x: 0.84, y: 0.52 },
      { x: 0.84, y: 0.68 },
      { x: 0.93, y: 0.68 }
    ]
  },
  {
    id: 'recovered-output',
    stage: 4,
    role: 'output',
    points: [
      { x: 0.84, y: 0.52 },
      { x: 0.84, y: 0.82 },
      { x: 0.93, y: 0.82 }
    ]
  },
  {
    id: 'gmail-evidence',
    stage: 1,
    role: 'evidence',
    points: [
      { x: 0.47, y: 0.3 },
      { x: 0.47, y: 0.42 },
      { x: 0.5, y: 0.42 },
      { x: 0.5, y: 0.52 }
    ]
  },
  {
    id: 'outlook-evidence',
    stage: 1,
    role: 'evidence',
    points: [
      { x: 0.4, y: 0.41 },
      { x: 0.46, y: 0.41 },
      { x: 0.46, y: 0.52 },
      { x: 0.5, y: 0.52 }
    ]
  },
  {
    id: 'dropbox-evidence',
    stage: 1,
    role: 'evidence',
    points: [
      { x: 0.4, y: 0.63 },
      { x: 0.46, y: 0.63 },
      { x: 0.46, y: 0.52 },
      { x: 0.5, y: 0.52 }
    ]
  },
  {
    id: 'onedrive-evidence',
    stage: 1,
    role: 'evidence',
    points: [
      { x: 0.47, y: 0.74 },
      { x: 0.47, y: 0.62 },
      { x: 0.5, y: 0.62 },
      { x: 0.5, y: 0.52 }
    ]
  },
  {
    id: 'adobe-sign-evidence',
    stage: 1,
    role: 'evidence',
    points: [
      { x: 0.59, y: 0.3 },
      { x: 0.59, y: 0.42 },
      { x: 0.54, y: 0.42 },
      { x: 0.54, y: 0.52 },
      { x: 0.5, y: 0.52 }
    ]
  },
  {
    id: 'slack-evidence',
    stage: 1,
    role: 'evidence',
    points: [
      { x: 0.59, y: 0.74 },
      { x: 0.59, y: 0.62 },
      { x: 0.54, y: 0.62 },
      { x: 0.54, y: 0.52 },
      { x: 0.5, y: 0.52 }
    ]
  }
];

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

const vertexSource = `
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
  if (dist > 0.5) discard;
  float softness = smoothstep(0.5, 0.12, dist);
  gl_FragColor = vec4(vColor.rgb, vColor.a * softness);
}
`;

const routeLength = (route: SceneRoute) => {
  let total = 0;
  for (let index = 1; index < route.points.length; index += 1) {
    const from = route.points[index - 1];
    const to = route.points[index];
    total += Math.hypot(to.x - from.x, to.y - from.y);
  }
  return total;
};

const routePointAt = (route: SceneRoute, progress: number) => {
  const totalLength = routeLength(route);
  const target = totalLength * progress;
  let traversed = 0;

  for (let index = 1; index < route.points.length; index += 1) {
    const from = route.points[index - 1];
    const to = route.points[index];
    const segmentLength = Math.hypot(to.x - from.x, to.y - from.y);

    if (traversed + segmentLength >= target) {
      const local = segmentLength === 0 ? 0 : (target - traversed) / segmentLength;
      return {
        x: from.x + (to.x - from.x) * local,
        y: from.y + (to.y - from.y) * local
      };
    }

    traversed += segmentLength;
  }

  return route.points[route.points.length - 1];
};

export function RecoveryEngineVisualization() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeStage, setActiveStage] = useState(0);

  const nodeMap = useMemo(() => new Map(allNodes.map((node) => [node.id, node])), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lineProgram = makeProgram(gl, vertexSource, lineFragmentSource);
    const pointProgram = makeProgram(gl, vertexSource, pointFragmentSource);
    if (!lineProgram || !pointProgram) return;

    const linePositionBuffer = gl.createBuffer();
    const lineColorBuffer = gl.createBuffer();
    const pointPositionBuffer = gl.createBuffer();
    const pointColorBuffer = gl.createBuffer();
    const gridPositionBuffer = gl.createBuffer();
    const gridColorBuffer = gl.createBuffer();

    if (!linePositionBuffer || !lineColorBuffer || !pointPositionBuffer || !pointColorBuffer || !gridPositionBuffer || !gridColorBuffer) {
      return;
    }

    const gridPoints: number[] = [];
    const gridColors: number[] = [];
    for (let x = 0.06; x <= 0.94; x += 0.04) {
      for (let y = 0.08; y <= 0.92; y += 0.04) {
        const clip = toClipSpace(x, y);
        gridPoints.push(clip.x, clip.y);
        gridColors.push(1, 1, 1, 0.04);
      }
    }

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

    const drawLineBatch = (positions: Float32Array, colors: Float32Array) => {
      const positionLocation = gl.getAttribLocation(lineProgram, 'aPosition');
      const colorLocation = gl.getAttribLocation(lineProgram, 'aColor');
      const pointSizeLocation = gl.getUniformLocation(lineProgram, 'uPointSize');

      gl.useProgram(lineProgram);
      gl.uniform1f(pointSizeLocation, 1);

      gl.bindBuffer(gl.ARRAY_BUFFER, linePositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.LINES, 0, positions.length / 2);
    };

    const drawPointBatch = (positions: Float32Array, colors: Float32Array, pointSize: number) => {
      const positionLocation = gl.getAttribLocation(pointProgram, 'aPosition');
      const colorLocation = gl.getAttribLocation(pointProgram, 'aColor');
      const pointSizeLocation = gl.getUniformLocation(pointProgram, 'uPointSize');

      gl.useProgram(pointProgram);
      gl.uniform1f(pointSizeLocation, pointSize);

      gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, pointColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, positions.length / 2);
    };

    const drawGrid = () => {
      const positionLocation = gl.getAttribLocation(pointProgram, 'aPosition');
      const colorLocation = gl.getAttribLocation(pointProgram, 'aColor');
      const pointSizeLocation = gl.getUniformLocation(pointProgram, 'uPointSize');

      gl.useProgram(pointProgram);
      gl.uniform1f(pointSizeLocation, 2.2);

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

    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    let frame = 0;
    let rafId = 0;

    const render = (now: number) => {
      const time = prefersReducedMotion ? 0 : now * 0.001;
      const stageDuration = 2.6;
      const stageFloat = prefersReducedMotion ? 0 : (time / stageDuration) % stageLabels.length;
      const stageIndex = Math.floor(stageFloat);
      const stageProgress = stageFloat - stageIndex;

      if (frame % 8 === 0) setActiveStage(stageIndex);
      frame += 1;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      drawGrid();

      const linePositions: number[] = [];
      const lineColors: number[] = [];

      routes.forEach((route) => {
        const isActive = route.stage === stageIndex;
        const routeColor = route.role === 'trunk'
          ? isActive ? [0.98, 0.98, 1, 0.9] : [0.72, 0.74, 0.78, 0.32]
          : route.role === 'output'
            ? isActive ? [0.96, 0.84, 0.44, 0.85] : [0.62, 0.62, 0.66, 0.18]
            : isActive
              ? [0.9, 0.92, 0.98, 0.8]
              : [0.58, 0.58, 0.64, 0.14];

        for (let index = 1; index < route.points.length; index += 1) {
          const from = toClipSpace(route.points[index - 1].x, route.points[index - 1].y);
          const to = toClipSpace(route.points[index].x, route.points[index].y);
          linePositions.push(from.x, from.y, to.x, to.y);
          lineColors.push(...routeColor, ...routeColor);
        }
      });

      drawLineBatch(new Float32Array(linePositions), new Float32Array(lineColors));

      const haloPositions: number[] = [];
      const haloColors: number[] = [];
      stageNodes.forEach((node) => {
        const clip = toClipSpace(node.x, node.y);
        const isActive = (
          (stageIndex === 0 && node.id === 'detect')
          || (stageIndex === 1 && node.id === 'evidence')
          || (stageIndex === 2 && node.id === 'filing')
          || ((stageIndex === 3 || stageIndex === 4) && node.id === 'payout')
        );
        haloPositions.push(clip.x, clip.y);
        haloColors.push(
          0.96,
          0.96,
          1,
          node.id === 'evidence'
            ? 0.14 + Math.sin(time * 2.1) * 0.05
            : isActive
              ? 0.12 + Math.sin(time * 2.6) * 0.05
              : 0.03
        );
      });

      drawPointBatch(new Float32Array(haloPositions), new Float32Array(haloColors), 46);

      const nodePositions: number[] = [];
      const nodeColors: number[] = [];
      allNodes.forEach((node) => {
        const clip = toClipSpace(node.x, node.y);
        nodePositions.push(clip.x, clip.y);
        const color = node.kind === 'output'
          ? [0.96, 0.84, 0.44, 0.88]
          : node.kind === 'stage'
            ? [0.96, 0.96, 1, 0.9]
            : node.kind === 'source'
              ? [0.82, 0.84, 0.9, 0.68]
              : [0.68, 0.7, 0.75, 0.72];
        nodeColors.push(...color);
      });

      const sizes = allNodes.map((node) => (
        node.kind === 'stage' ? 16 : node.kind === 'output' ? 12 : node.kind === 'source' ? 10 : 9
      ));

      [9, 10, 12, 16].forEach((size) => {
        const positions: number[] = [];
        const colors: number[] = [];
        allNodes.forEach((node, index) => {
          if (sizes[index] !== size) return;
          const clip = toClipSpace(node.x, node.y);
          positions.push(clip.x, clip.y);
          colors.push(...nodeColors.slice(index * 4, index * 4 + 4));
        });
        if (positions.length > 0) {
          drawPointBatch(new Float32Array(positions), new Float32Array(colors), size);
        }
      });

      const packetPositions: number[] = [];
      const packetColors: number[] = [];

      routes
        .filter((route) => route.stage === stageIndex)
        .forEach((route, routeIndex) => {
          const pulseCount = route.role === 'intake' ? 2 : 1;
          for (let pulse = 0; pulse < pulseCount; pulse += 1) {
            const progress = prefersReducedMotion ? 0.5 : (stageProgress + pulse * 0.35 + routeIndex * 0.06) % 1;
            const point = routePointAt(route, progress);
            const clip = toClipSpace(point.x, point.y);
            packetPositions.push(clip.x, clip.y);
            packetColors.push(
              route.role === 'output' ? 0.98 : 0.96,
              route.role === 'output' ? 0.84 : 0.96,
              route.role === 'output' ? 0.42 : 1,
              0.98
            );
          }
        });

      if (packetPositions.length > 0) {
        drawPointBatch(new Float32Array(packetPositions), new Float32Array(packetColors), 14);
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
      gl.deleteBuffer(gridPositionBuffer);
      gl.deleteBuffer(gridColorBuffer);
      gl.deleteProgram(lineProgram);
      gl.deleteProgram(pointProgram);
    };
  }, [nodeMap]);

  const inputOverlayNodes = useMemo(() => inputNodes, []);
  const outputOverlayNodes = useMemo(() => outputNodes, []);

  return (
    <div className="relative mt-16 overflow-hidden rounded-[28px] border border-white/10 bg-[#090909]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035),transparent_55%)]" />
      <div className="relative h-[640px] w-full md:h-[720px]">
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

        {inputOverlayNodes.map((node) => (
          <div
            key={node.id}
            className="pointer-events-none absolute hidden -translate-y-1/2 md:block"
            style={{ left: `${(node.x + 0.025) * 100}%`, top: `${node.y * 100}%` }}
          >
            <div className="text-[11px] font-medium tracking-tight text-white/62">{node.label}</div>
          </div>
        ))}

        {outputOverlayNodes.map((node) => (
          <div
            key={node.id}
            className="pointer-events-none absolute hidden -translate-x-full -translate-y-1/2 md:block"
            style={{ left: `${(node.x - 0.015) * 100}%`, top: `${node.y * 100}%` }}
          >
            <div className="rounded-full border border-white/8 bg-black/40 px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/72 backdrop-blur-sm">
              {node.label}
            </div>
          </div>
        ))}

        {stageNodes.map((node) => (
          <div
            key={node.id}
            className="pointer-events-none absolute hidden -translate-x-1/2 md:block"
            style={{ left: `${node.x * 100}%`, top: `${(node.y + 0.055) * 100}%` }}
          >
            <div className="text-[11px] font-medium tracking-tight text-white/58">{node.label}</div>
          </div>
        ))}

        {evidenceSourceNodes.map((node) => (
          <div
            key={node.id}
            className="pointer-events-none absolute hidden -translate-x-1/2 -translate-y-1/2 md:block"
            style={{ left: `${node.x * 100}%`, top: `${node.y * 100}%` }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/45 backdrop-blur-sm">
                {node.iconSrc ? (
                  <img
                    src={node.iconSrc}
                    alt={node.iconAlt || node.label}
                    className="max-h-5 max-w-5 object-contain opacity-85"
                  />
                ) : null}
              </div>
              <div className="text-[10px] font-medium tracking-tight text-white/45">{node.shortLabel}</div>
            </div>
          </div>
        ))}

        <div
          className="pointer-events-none absolute hidden -translate-y-1/2 md:block"
          style={{ left: `${(amazonNode.x + 0.018) * 100}%`, top: `${amazonNode.y * 100}%` }}
        >
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/74 backdrop-blur-sm">
            {amazonNode.iconSrc ? (
              <img
                src={amazonNode.iconSrc}
                alt={amazonNode.iconAlt || amazonNode.label}
                className="max-h-3.5 max-w-[18px] object-contain opacity-90"
              />
            ) : null}
            <span>{amazonNode.label}</span>
          </div>
        </div>

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

            <div className="max-w-[320px] text-sm leading-6 text-white/52 md:text-right">
              Amazon inputs enter on the left. Margin routes detection into evidence, filing, and payout until recovered dollars exit on the right.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
