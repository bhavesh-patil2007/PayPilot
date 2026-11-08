/**
 * MoneyMapScene.ts
 *
 * Production-ready Three.js 0.170.0 Scene Controller for PayPilot Money Map.
 * Renders an interactive 3D multi-tier liquidity highway connecting Inflow Gateways,
 * PayPal Primary/Reserve Wallets, Commercial Banking Vaults, and Outflow Commitments.
 * Features 3D Catmull-Rom spline conduits, continuous particle stream highways,
 * raycasting hover/click inspection, and smooth isometric camera parallax.
 */

import * as THREE from 'three';
import type { ThreeSceneController } from '../../../types';
import { disposeThreeScene } from '../utils/threeDisposal';

export interface MoneyMapNodeDef {
  id: string;
  label: string;
  tier: 0 | 1 | 2 | 3;
  type: 'INFLOW' | 'WALLET' | 'BANK' | 'OUTFLOW';
  amount: number;
  position: [number, number, number];
  colorHex: number;
}

export interface MoneyMapFlowDef {
  id: string;
  sourceId: string;
  targetId: string;
  volume: number;
  speed: number;
  colorHex: number;
}

function createRadialTexture(size = 64): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (typeof ctx.createRadialGradient === 'function') {
      const center = size / 2;
      const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(16, 16, 32, 32);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  } catch {
    return null;
  }
}

const DEFAULT_NODES: MoneyMapNodeDef[] = [
  { id: 'N_CUST', label: 'Customer Checkouts', tier: 0, type: 'INFLOW', amount: 40000, position: [-7.2, 2.2, -2.5], colorHex: 0x10b981 },
  { id: 'N_INV', label: 'Invoice Receivables', tier: 0, type: 'INFLOW', amount: 38500, position: [-7.2, 0.0, 0.0], colorHex: 0x00cfe8 },
  { id: 'N_FX', label: 'Cross-Border FX', tier: 0, type: 'INFLOW', amount: 12500, position: [-7.2, -2.2, 2.5], colorHex: 0x38bdf8 },
  { id: 'N_PP_MAIN', label: 'PayPal Primary Wallet', tier: 1, type: 'WALLET', amount: 68400, position: [-2.4, 1.4, -1.2], colorHex: 0x0079c1 },
  { id: 'N_PP_HOLD', label: 'PayPal Dispute Reserve', tier: 1, type: 'WALLET', amount: 12500, position: [-2.4, -1.4, 1.2], colorHex: 0xf59e0b },
  { id: 'N_BK_OPER', label: 'SVB / Chase Operating', tier: 2, type: 'BANK', amount: 58100, position: [2.4, 1.4, -1.2], colorHex: 0x6366f1 },
  { id: 'N_BK_RSV', label: 'Emergency Reserve', tier: 2, type: 'BANK', amount: 16000, position: [2.4, -1.4, 1.2], colorHex: 0x8b5cf6 },
  { id: 'N_SUPP', label: 'Alibaba Supply Logistics', tier: 3, type: 'OUTFLOW', amount: 22500, position: [7.2, 2.2, -2.5], colorHex: 0xf59e0b },
  { id: 'N_PAYROLL', label: 'Gusto Payroll Service', tier: 3, type: 'OUTFLOW', amount: 24000, position: [7.2, 0.0, 0.0], colorHex: 0xef4444 },
  { id: 'N_RENT', label: 'Hudson Office Lease', tier: 3, type: 'OUTFLOW', amount: 8500, position: [7.2, -2.2, 2.5], colorHex: 0xa855f7 },
];

const DEFAULT_FLOWS: MoneyMapFlowDef[] = [
  { id: 'F_1', sourceId: 'N_CUST', targetId: 'N_PP_MAIN', volume: 40000, speed: 0.35, colorHex: 0x10b981 },
  { id: 'F_2', sourceId: 'N_INV', targetId: 'N_PP_MAIN', volume: 38500, speed: 0.32, colorHex: 0x00cfe8 },
  { id: 'F_3', sourceId: 'N_FX', targetId: 'N_PP_HOLD', volume: 12500, speed: 0.25, colorHex: 0xf59e0b },
  { id: 'F_4', sourceId: 'N_PP_MAIN', targetId: 'N_BK_OPER', volume: 45000, speed: 0.40, colorHex: 0x0079c1 },
  { id: 'F_5', sourceId: 'N_PP_MAIN', targetId: 'N_BK_RSV', volume: 15000, speed: 0.28, colorHex: 0x6366f1 },
  { id: 'F_6', sourceId: 'N_BK_OPER', targetId: 'N_SUPP', volume: 22500, speed: 0.32, colorHex: 0xf59e0b },
  { id: 'F_7', sourceId: 'N_BK_OPER', targetId: 'N_PAYROLL', volume: 24000, speed: 0.35, colorHex: 0xef4444 },
  { id: 'F_8', sourceId: 'N_BK_RSV', targetId: 'N_RENT', volume: 8500, speed: 0.22, colorHex: 0xa855f7 },
];

interface StreamParticleGroup {
  curve: THREE.CatmullRomCurve3;
  points: THREE.Points;
  particleCount: number;
  speed: number;
  flowDef: MoneyMapFlowDef;
}

export class MoneyMapScene implements ThreeSceneController<any> {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private animFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private isDestroyed: boolean = false;

  private rootGroup: THREE.Group | null = null;
  private nodesGroup: THREE.Group | null = null;
  private conduitsGroup: THREE.Group | null = null;
  private streamsGroup: THREE.Group | null = null;

  private glowTexture: THREE.Texture | null = null;
  private streams: StreamParticleGroup[] = [];

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouseVec: THREE.Vector2 = new THREE.Vector2(-999, -999);
  private interactiveMeshes: THREE.Mesh[] = [];
  private hoveredNodeId: string | null = null;

  private pointerCurrent = { x: 0, y: 0 };
  private pointerTarget = { x: 0, y: 0 };

  private nodes: MoneyMapNodeDef[] = DEFAULT_NODES;
  private flows: MoneyMapFlowDef[] = DEFAULT_FLOWS;

  public init(container: HTMLElement, width: number, height: number): void {
    this.container = container;
    this.isDestroyed = false;

    const w = width > 0 ? width : container.clientWidth || 500;
    const h = height > 0 ? height : container.clientHeight || 500;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
    this.camera.position.set(0, 9.5, 17.0);
    this.camera.lookAt(0, 0, 0);

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.display = 'block';

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(this.renderer.domElement);
    } catch (e) {
      console.warn('[MoneyMapScene] WebGLRenderer init failed:', e);
      return;
    }

    this.glowTexture = createRadialTexture(64);

    // Subtle ambient & directional lights
    const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x00cfe8, 1.2);
    dirLight.position.set(5, 12, 10);
    this.scene.add(dirLight);

    this.rootGroup = new THREE.Group();
    this.nodesGroup = new THREE.Group();
    this.conduitsGroup = new THREE.Group();
    this.streamsGroup = new THREE.Group();

    this.rootGroup.add(this.conduitsGroup);
    this.rootGroup.add(this.streamsGroup);
    this.rootGroup.add(this.nodesGroup);
    this.scene.add(this.rootGroup);

    this.buildMap();
    this.clock.start();
    this.animate();
  }

  private buildMap(): void {
    if (!this.nodesGroup || !this.conduitsGroup || !this.streamsGroup) return;

    // Clear old elements
    while (this.nodesGroup.children.length > 0) {
      const c = this.nodesGroup.children[0] as THREE.Mesh;
      if (c.geometry) c.geometry.dispose();
      this.nodesGroup.remove(c);
    }
    while (this.conduitsGroup.children.length > 0) {
      const c = this.conduitsGroup.children[0] as THREE.Line;
      if (c.geometry) c.geometry.dispose();
      this.conduitsGroup.remove(c);
    }
    while (this.streamsGroup.children.length > 0) {
      const c = this.streamsGroup.children[0] as THREE.Points;
      if (c.geometry) c.geometry.dispose();
      this.streamsGroup.remove(c);
    }
    this.streams = [];
    this.interactiveMeshes = [];

    const nodePositions = new Map<string, THREE.Vector3>();

    // 1. Build Account Hub Pedestals & Columns
    this.nodes.forEach((node) => {
      const pos = new THREE.Vector3(...node.position);
      nodePositions.set(node.id, pos);

      const hubGroup = new THREE.Group();
      hubGroup.position.copy(pos);

      // Base Pedestal
      const baseGeom = new THREE.CylinderGeometry(0.85, 0.95, 0.22, 24);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.8,
      });
      const baseMesh = new THREE.Mesh(baseGeom, baseMat);
      baseMesh.userData = { nodeId: node.id, nodeDef: node };
      hubGroup.add(baseMesh);
      this.interactiveMeshes.push(baseMesh);

      // Liquid Energy Column (Height scales with balance)
      const columnH = Math.max(0.5, Math.min(2.4, (node.amount / 70000) * 2.4));
      const colGeom = new THREE.CylinderGeometry(0.55, 0.55, columnH, 24);
      colGeom.translate(0, columnH / 2 + 0.11, 0);

      const colMat = new THREE.MeshStandardMaterial({
        color: node.colorHex,
        emissive: node.colorHex,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.4,
        transparent: true,
        opacity: 0.88,
      });
      const colMesh = new THREE.Mesh(colGeom, colMat);
      colMesh.userData = { nodeId: node.id, nodeDef: node };
      hubGroup.add(colMesh);
      this.interactiveMeshes.push(colMesh);

      // Glowing Halo Ring above column
      const ringGeom = new THREE.RingGeometry(0.65, 0.8, 24);
      ringGeom.rotateX(-Math.PI / 2);
      ringGeom.translate(0, columnH + 0.18, 0);

      const ringMat = new THREE.MeshBasicMaterial({
        color: node.colorHex,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      hubGroup.add(ringMesh);

      this.nodesGroup!.add(hubGroup);
    });

    // 2. Build Conduit Splines & Flow Streams
    this.flows.forEach((flow) => {
      const pSrc = nodePositions.get(flow.sourceId);
      const pDst = nodePositions.get(flow.targetId);
      if (!pSrc || !pDst) return;

      const p0 = pSrc.clone().add(new THREE.Vector3(0, 0.6, 0));
      const p3 = pDst.clone().add(new THREE.Vector3(0, 0.6, 0));

      const dx = p3.x - p0.x;
      const dy = p3.y - p0.y;
      const dz = p3.z - p0.z;

      // 3D S-Curve control points with vertical arch
      const p1 = p0.clone().add(new THREE.Vector3(dx * 0.4, dy * 0.2 + 0.7, dz * 0.2));
      const p2 = p3.clone().sub(new THREE.Vector3(dx * 0.4, -dy * 0.2 + 0.7, -dz * 0.2));

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3], false, 'catmullrom', 0.4);
      const curvePoints = curve.getPoints(40);

      // Conduit line track
      const conduitGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const conduitMat = new THREE.LineBasicMaterial({
        color: flow.colorHex,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
      });
      const conduitLine = new THREE.Line(conduitGeom, conduitMat);
      conduitLine.userData = { flowId: flow.id, sourceId: flow.sourceId, targetId: flow.targetId };
      this.conduitsGroup!.add(conduitLine);

      // Particle Stream
      const particleCount = Math.max(30, Math.min(65, Math.floor((flow.volume / 1000) * 1.2)));
      const posArray = new Float32Array(particleCount * 3);
      const colArray = new Float32Array(particleCount * 3);

      const color = new THREE.Color(flow.colorHex);
      for (let j = 0; j < particleCount; j++) {
        colArray[j * 3] = color.r;
        colArray[j * 3 + 1] = color.g;
        colArray[j * 3 + 2] = color.b;
      }

      const streamGeom = new THREE.BufferGeometry();
      streamGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      streamGeom.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

      const streamMat = new THREE.PointsMaterial({
        size: 0.16,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: this.glowTexture || undefined,
      });

      const streamPoints = new THREE.Points(streamGeom, streamMat);
      this.streamsGroup!.add(streamPoints);

      this.streams.push({
        curve,
        points: streamPoints,
        particleCount,
        speed: flow.speed,
        flowDef: flow,
      });
    });
  }

  public updateData(data?: any): void {
    if (this.isDestroyed) return;
    if (data) {
      if (Array.isArray(data.nodes) && Array.isArray(data.flows)) {
        this.nodes = data.nodes.length > 0 ? data.nodes : DEFAULT_NODES;
        this.flows = data.flows.length > 0 ? data.flows : DEFAULT_FLOWS;
      } else if (Array.isArray(data.accounts) && Array.isArray(data.flows)) {
        if (data.accounts.length > 0) {
          this.nodes = data.accounts.map((acc: any, i: number) => ({
            id: acc.id,
            label: acc.name || acc.label || acc.id,
            tier: (i % 4) as 0 | 1 | 2 | 3,
            type: (i === 0 ? 'INFLOW' : i === 1 ? 'WALLET' : i === 2 ? 'BANK' : 'OUTFLOW') as any,
            amount: acc.balance || acc.amount || 25000,
            position: [
              -7.2 + (i % 4) * 4.8,
              (i % 2 === 0 ? 1.5 : -1.5),
              (i % 3 === 0 ? -1.5 : 1.5),
            ] as [number, number, number],
            colorHex: i === 0 ? 0x10b981 : i === 1 ? 0x0079c1 : i === 2 ? 0x6366f1 : 0xf59e0b,
          }));
          this.flows = data.flows.map((f: any, idx: number) => ({
            id: f.id || `F_${idx}`,
            sourceId: f.sourceId || f.source,
            targetId: f.targetId || f.target,
            volume: f.volume || f.amount || 15000,
            speed: f.speed || 0.35,
            colorHex: f.colorHex || 0x00cfe8,
          }));
        } else {
          this.nodes = DEFAULT_NODES;
          this.flows = DEFAULT_FLOWS;
        }
      }
    }
    this.buildMap();
  }

  public resize(width: number, height: number): void {
    if (
      this.isDestroyed ||
      !this.camera ||
      !this.renderer ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public onPointerMove(normalizedX: number, normalizedY: number): void {
    if (this.isDestroyed || !Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) return;
    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));
    this.pointerTarget.x = clampedX;
    this.pointerTarget.y = clampedY;
    this.mouseVec.set(clampedX, clampedY);
  }

  public onPointerClick(normalizedX: number, normalizedY: number): void {
    if (this.isDestroyed || !this.camera) return;
    if (!Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) return;
    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));
    this.raycaster.setFromCamera(new THREE.Vector2(clampedX, clampedY), this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);
    if (intersects.length > 0) {
      const clicked = intersects[0].object;
      const def = clicked.userData?.nodeDef as MoneyMapNodeDef | undefined;
      if (def) {
        this.hoveredNodeId = def.id;
      }
    }
  }

  private animate = (): void => {
    if (this.isDestroyed || !this.renderer || !this.scene || !this.camera) return;

    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // Camera isometric parallax
    this.pointerCurrent.x += (this.pointerTarget.x - this.pointerCurrent.x) * Math.min(delta * 3.5, 1);
    this.pointerCurrent.y += (this.pointerTarget.y - this.pointerCurrent.y) * Math.min(delta * 3.5, 1);

    this.camera.position.x = this.pointerCurrent.x * 2.2;
    this.camera.position.y = 9.5 + this.pointerCurrent.y * 1.5;
    this.camera.lookAt(0, 0, 0);

    // Raycast hover check
    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);
    if (intersects.length > 0) {
      const hoveredMesh = intersects[0].object;
      this.hoveredNodeId = hoveredMesh.userData?.nodeId || null;
    } else {
      this.hoveredNodeId = null;
    }

    // Animate flow particles along splines
    for (const stream of this.streams) {
      const isConnected = this.hoveredNodeId === null ||
        stream.flowDef.sourceId === this.hoveredNodeId ||
        stream.flowDef.targetId === this.hoveredNodeId;

      const speedMultiplier = isConnected ? (this.hoveredNodeId ? 1.6 : 1.0) : 0.4;
      const effectiveSpeed = stream.speed * speedMultiplier;

      const posAttr = stream.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      if (posAttr) {
        for (let j = 0; j < stream.particleCount; j++) {
          const phase = j / stream.particleCount;
          const t = (elapsed * effectiveSpeed + phase) % 1.0;
          const pt = stream.curve.getPoint(t);
          posAttr.setXYZ(j, pt.x, pt.y, pt.z);
        }
        posAttr.needsUpdate = true;
      }

      const mat = stream.points.material as THREE.PointsMaterial;
      if (mat) {
        mat.opacity = isConnected ? 0.95 : 0.25;
      }
    }

    try {
      this.renderer.render(this.scene, this.camera);
    } catch {
      // Safe fallback for headless JSDOM environments
    }
  };

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.scene) {
      disposeThreeScene(this.scene, this.renderer);
      this.scene = null;
    }

    if (this.glowTexture) {
      this.glowTexture.dispose();
      this.glowTexture = null;
    }

    this.renderer = null;
    this.camera = null;
    this.rootGroup = null;
    this.nodesGroup = null;
    this.conduitsGroup = null;
    this.streamsGroup = null;
    this.streams = [];
    this.interactiveMeshes = [];
    this.container = null;
  }
}
