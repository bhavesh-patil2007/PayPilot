/**
 * frontend/src/components/3d/scenes/NodeGraphScene.ts
 * 
 * Payment Truth 3D Interactive Force Graph Scene Controller.
 * Visualizes 3-way reconciliation connections across Invoices, Bank Feeds,
 * and PayPal Transactions with dynamic physics relaxation, raycasting hover detection,
 * pulsing discrepancy warning halos, and directed energy flow particle streams.
 */

import * as THREE from 'three';
import {
  ThreeSceneController,
  TruthGraphData,
  TruthGraphNode,
  TruthGraphEdge,
} from '../../../types';
import { disposeThreeScene } from '../utils/threeDisposal';

interface EdgeParticleFlow {
  sourceId: string;
  targetId: string;
  speed: number;
  particles: Array<{ t: number }>;
  pointsMesh: THREE.Points;
  positionsBuffer: Float32Array;
}

interface WarningHalo {
  nodeId: string;
  ringMesh: THREE.Mesh;
  baseScale: number;
}

export class NodeGraphScene implements ThreeSceneController<TruthGraphData | any> {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  // Scene Graphs & Groups
  private rootGroup: THREE.Group = new THREE.Group();
  private nodesGroup: THREE.Group = new THREE.Group();
  private edgesGroup: THREE.Group = new THREE.Group();
  private particlesGroup: THREE.Group = new THREE.Group();
  private labelsGroup: THREE.Group = new THREE.Group();
  private warningHalosGroup: THREE.Group = new THREE.Group();

  // Graph Data & State
  private graphData: TruthGraphData | null = null;
  private nodeMeshMap: Map<string, THREE.Mesh> = new Map();
  private nodePositions: Map<string, THREE.Vector3> = new Map();
  private nodeVelocities: Map<string, THREE.Vector3> = new Map();
  private edgeLines: Array<{ edge: TruthGraphEdge; line: THREE.Line }> = [];
  private edgeParticleFlows: EdgeParticleFlow[] = [];
  private warningHalos: WarningHalo[] = [];
  private labelSprites: THREE.Sprite[] = [];

  // Interaction & Raycasting
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private pointerNdc: THREE.Vector2 = new THREE.Vector2(-999, -999);
  private hoveredNodeId: string | null = null;
  private targetParallax: THREE.Vector2 = new THREE.Vector2(0, 0);
  private currentParallax: THREE.Vector2 = new THREE.Vector2(0, 0);

  // Force simulation relaxation counter
  private physicsRelaxationTicks: number = 0;
  private maxPhysicsTicks: number = 180;

  // Shared Procedural Assets
  private particleTexture: THREE.Texture | null = null;
  private createdTextures: THREE.Texture[] = [];

  // =========================================================================
  // 1. LIFECYCLE: Initialization
  // =========================================================================
  public init(container: HTMLElement, width: number, height: number): void {
    this.container = container;
    this.isDestroyed = false;
    this.physicsRelaxationTicks = 0;

    const safeWidth = Math.max(width, 100);
    const safeHeight = Math.max(height, 100);

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // 2. Camera Setup
    const aspect = safeWidth / safeHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 1.5, 15);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer Setup
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(safeWidth, safeHeight);
      this.renderer.setPixelRatio(
        Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
      );

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      this.container.appendChild(this.renderer.domElement);
    } catch (e) {
      console.warn('[NodeGraphScene] WebGLRenderer init failed:', e);
      return;
    }

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const primaryLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    primaryLight.position.set(6, 12, 8);
    this.scene.add(primaryLight);

    const accentLight = new THREE.DirectionalLight(0xa855f7, 0.9);
    accentLight.position.set(-8, -6, 6);
    this.scene.add(accentLight);

    // 5. Structure Groups Hierarchy
    this.rootGroup = new THREE.Group();
    this.nodesGroup = new THREE.Group();
    this.edgesGroup = new THREE.Group();
    this.particlesGroup = new THREE.Group();
    this.labelsGroup = new THREE.Group();
    this.warningHalosGroup = new THREE.Group();

    this.rootGroup.add(this.edgesGroup);
    this.rootGroup.add(this.particlesGroup);
    this.rootGroup.add(this.warningHalosGroup);
    this.rootGroup.add(this.nodesGroup);
    this.rootGroup.add(this.labelsGroup);
    this.scene.add(this.rootGroup);

    // 6. Generate Shared Particle Texture
    this.particleTexture = this.createGlowingParticleTexture();

    // 7. Render initial data if pre-populated
    if (this.graphData) {
      this.rebuildGraphVisuals();
    }

    // 8. Start 60fps Loop
    this.clock.start();
    this.startRenderLoop();
  }

  // =========================================================================
  // 2. LIFECYCLE: Reactive Data Update
  // =========================================================================
  public updateData(data: TruthGraphData | any): void {
    if (this.isDestroyed || !data) return;
    if (typeof data === 'object') {
      this.graphData = {
        nodes: Array.isArray(data.nodes) ? data.nodes : [],
        edges: Array.isArray(data.edges) ? data.edges : [],
      };
    }
    this.physicsRelaxationTicks = 0;

    if (this.scene && this.renderer) {
      this.rebuildGraphVisuals();
    }
  }

  // =========================================================================
  // 3. LIFECYCLE: Responsive Resizing
  // =========================================================================
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

  // =========================================================================
  // 4. LIFECYCLE: Pointer Interaction & Raycasting
  // =========================================================================
  public onPointerMove(normalizedX: number, normalizedY: number): void {
    if (this.isDestroyed || !Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) {
      return;
    }

    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));

    this.pointerNdc.set(clampedX, clampedY);
    this.targetParallax.set(clampedX * 0.28, clampedY * 0.22);

    this.evaluateRaycastHover();
  }

  public onPointerClick(normalizedX: number, normalizedY: number): void {
    this.onPointerMove(normalizedX, normalizedY);
    if (this.hoveredNodeId && this.nodeMeshMap.has(this.hoveredNodeId)) {
      const mesh = this.nodeMeshMap.get(this.hoveredNodeId)!;
      mesh.scale.set(1.4, 1.4, 1.4);
    }
  }

  // =========================================================================
  // 5. GRAPH GEOMETRY BUILDER
  // =========================================================================
  private rebuildGraphVisuals(): void {
    if (!this.graphData) return;

    this.clearVisualGroups();

    const { nodes, edges } = this.graphData;
    const count = nodes.length;

    // 1. Establish Initial 3D Coordinates
    nodes.forEach((node, idx) => {
      let pos: THREE.Vector3;
      if (node.position3D && node.position3D.length === 3) {
        pos = new THREE.Vector3(node.position3D[0], node.position3D[1], node.position3D[2]);
      } else {
        const theta = (idx / Math.max(count, 1)) * Math.PI * 2;
        const phi = (idx % 2 === 0 ? 0.35 : -0.35) * Math.PI;
        const radius = 4.2;
        pos = new THREE.Vector3(
          radius * Math.cos(theta) * Math.cos(phi),
          radius * Math.sin(phi),
          radius * Math.sin(theta) * Math.cos(phi)
        );
      }

      this.nodePositions.set(node.id, pos);
      this.nodeVelocities.set(node.id, new THREE.Vector3(0, 0, 0));

      // 2. Instantiate Type-Specific Node Meshes
      const mesh = this.createNodeMesh(node);
      mesh.position.copy(pos);
      this.nodesGroup.add(mesh);
      this.nodeMeshMap.set(node.id, mesh);

      // 3. Attach Pulsing Discrepancy Halo for flagged items
      if (node.status === 'DISCREPANT') {
        const ringGeo = new THREE.RingGeometry(0.9, 1.15, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(pos);
        this.warningHalosGroup.add(ringMesh);
        this.warningHalos.push({ nodeId: node.id, ringMesh, baseScale: 1.0 });
      }

      // 4. Attach Billboarding Label Sprites
      const labelSprite = this.createLabelSprite(node);
      labelSprite.position.copy(pos).add(new THREE.Vector3(0, 1.15, 0));
      this.labelsGroup.add(labelSprite);
      this.labelSprites.push(labelSprite);
    });

    // 5. Connect Edges & Particle Beams
    edges.forEach((edge) => {
      const srcPos = this.nodePositions.get(edge.source);
      const tgtPos = this.nodePositions.get(edge.target);
      if (!srcPos || !tgtPos) return;

      const lineGeo = new THREE.BufferGeometry().setFromPoints([srcPos, tgtPos]);
      const lineColor = edge.status === 'DISCREPANT'
        ? 0xef4444
        : edge.status === 'VERIFIED'
        ? 0x10b981
        : 0x38bdf8;

      const lineMat = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: edge.status === 'DISCREPANT' ? 0.85 : 0.6,
        linewidth: 2,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      this.edgesGroup.add(line);
      this.edgeLines.push({ edge, line });

      const particleFlow = this.createEdgeParticleFlow(edge, srcPos, tgtPos);
      this.particlesGroup.add(particleFlow.pointsMesh);
      this.edgeParticleFlows.push(particleFlow);
    });
  }

  private createNodeMesh(node: TruthGraphNode): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    let colorHex: number;
    let emissiveHex: number;

    switch (node.type) {
      case 'PAYPAL_TX':
        geometry = new THREE.IcosahedronGeometry(0.72, 1);
        colorHex = 0x0070ba;
        emissiveHex = 0x00cfeb;
        break;
      case 'BANK_DEPOSIT':
        geometry = new THREE.SphereGeometry(0.68, 24, 24);
        colorHex = 0x10b981;
        emissiveHex = 0x059669;
        break;
      case 'INVOICE':
        geometry = new THREE.OctahedronGeometry(0.72, 0);
        colorHex = 0x8b5cf6;
        emissiveHex = 0x6d28d9;
        break;
      case 'CUSTOMER':
        geometry = new THREE.TorusGeometry(0.52, 0.18, 16, 28);
        colorHex = 0xf59e0b;
        emissiveHex = 0xd97706;
        break;
      case 'DISCREPANCY_ALERT':
      default:
        geometry = new THREE.DodecahedronGeometry(0.75, 0);
        colorHex = 0xef4444;
        emissiveHex = 0xdc2626;
        break;
    }

    const material = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: emissiveHex,
      emissiveIntensity: node.status === 'DISCREPANT' ? 0.8 : 0.45,
      roughness: 0.25,
      metalness: 0.65,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = {
      nodeId: node.id,
      originalScale: 1.0,
      emissiveIntensity: material.emissiveIntensity,
    };
    return mesh;
  }

  private createEdgeParticleFlow(
    edge: TruthGraphEdge,
    src: THREE.Vector3,
    tgt: THREE.Vector3
  ): EdgeParticleFlow {
    const particleCount = 4;
    const positions = new Float32Array(particleCount * 3);
    const particles: Array<{ t: number }> = [];

    for (let i = 0; i < particleCount; i++) {
      const initialT = i / particleCount;
      particles.push({ t: initialT });
      const currentPos = new THREE.Vector3().lerpVectors(src, tgt, initialT);
      positions[i * 3 + 0] = currentPos.x;
      positions[i * 3 + 1] = currentPos.y;
      positions[i * 3 + 2] = currentPos.z;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const colorHex = edge.status === 'DISCREPANT' ? 0xf87171 : 0x38bdf8;
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.35,
      map: this.particleTexture || undefined,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pointsMesh = new THREE.Points(geom, mat);

    return {
      sourceId: edge.source,
      targetId: edge.target,
      speed: Math.max(edge.flowSpeed || 1.0, 0.4),
      particles,
      pointsMesh,
      positionsBuffer: positions,
    };
  }

  private createLabelSprite(node: TruthGraphNode): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(4, 4, 248, 64, 16);
        ctx.fill();
      } else {
        ctx.fillRect(4, 4, 248, 64);
      }

      ctx.strokeStyle = node.status === 'DISCREPANT' ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 3;
      if (typeof (ctx as any).stroke === 'function') {
        ctx.stroke();
      }

      ctx.fillStyle = node.status === 'DISCREPANT' ? '#f87171' : '#34d399';
      if (typeof ctx.beginPath === 'function') {
        ctx.beginPath();
        ctx.arc(24, 36, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (typeof ctx.fillText === 'function') {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 20px sans-serif';
        const displayLabel = node.label.length > 18 ? node.label.slice(0, 16) + '...' : node.label;
        ctx.fillText(displayLabel, 40, 42);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.createdTextures.push(texture);

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.68, 1.0);
    return sprite;
  }

  private createGlowingParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (typeof ctx.createRadialGradient === 'function') {
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.35, 'rgba(56, 189, 248, 0.8)');
        grad.addColorStop(0.7, 'rgba(14, 165, 233, 0.3)');
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(16, 16, 32, 32);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.createdTextures.push(texture);
    return texture;
  }

  private stepPhysicsRelaxation(dt: number): void {
    if (this.physicsRelaxationTicks >= this.maxPhysicsTicks || !this.graphData) {
      return;
    }

    const nodes = this.graphData.nodes;
    const edges = this.graphData.edges;
    const kRepulse = 38.0;
    const kSpring = 0.85;
    const springLength = 4.2;
    const kCenter = 0.22;

    // 1. Coulomb Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      const idA = nodes[i].id;
      const posA = this.nodePositions.get(idA);
      const velA = this.nodeVelocities.get(idA);
      if (!posA || !velA) continue;

      for (let j = i + 1; j < nodes.length; j++) {
        const idB = nodes[j].id;
        const posB = this.nodePositions.get(idB);
        const velB = this.nodeVelocities.get(idB);
        if (!posB || !velB) continue;

        const delta = new THREE.Vector3().subVectors(posA, posB);
        const distSq = Math.max(delta.lengthSq(), 0.1);

        const forceMag = kRepulse / distSq;
        const force = delta.normalize().multiplyScalar(forceMag);

        velA.addScaledVector(force, dt);
        velB.addScaledVector(force, -dt);
      }

      // Centering gravity
      velA.addScaledVector(posA, -kCenter * dt);
    }

    // 2. Hooke's Spring Attraction along edges
    for (const edge of edges) {
      const posSrc = this.nodePositions.get(edge.source);
      const posTgt = this.nodePositions.get(edge.target);
      const velSrc = this.nodeVelocities.get(edge.source);
      const velTgt = this.nodeVelocities.get(edge.target);

      if (posSrc && posTgt && velSrc && velTgt) {
        const delta = new THREE.Vector3().subVectors(posTgt, posSrc);
        const dist = Math.max(delta.length(), 0.05);
        const displacement = dist - springLength;
        const springForce = delta.normalize().multiplyScalar(kSpring * displacement);

        velSrc.addScaledVector(springForce, dt);
        velTgt.addScaledVector(springForce, -dt);
      }
    }

    // 3. Integrate Velocity with Damping (0.84)
    nodes.forEach((node) => {
      const pos = this.nodePositions.get(node.id);
      const vel = this.nodeVelocities.get(node.id);
      if (!pos || !vel) return;

      vel.multiplyScalar(0.84);
      pos.addScaledVector(vel, dt);

      if (pos.length() > 7.5) {
        pos.normalize().multiplyScalar(7.5);
      }

      const mesh = this.nodeMeshMap.get(node.id);
      if (mesh) {
        mesh.position.copy(pos);
      }
    });

    // 4. Update Edge Line Geometry Buffers
    this.edgeLines.forEach(({ edge, line }) => {
      const p1 = this.nodePositions.get(edge.source);
      const p2 = this.nodePositions.get(edge.target);
      if (p1 && p2 && line.geometry && line.geometry.attributes.position) {
        const linePos = line.geometry.attributes.position as THREE.BufferAttribute;
        linePos.setXYZ(0, p1.x, p1.y, p1.z);
        linePos.setXYZ(1, p2.x, p2.y, p2.z);
        linePos.needsUpdate = true;
      }
    });

    // 5. Update Warning Halo & Label Positions
    this.warningHalos.forEach((halo) => {
      const p = this.nodePositions.get(halo.nodeId);
      if (p) halo.ringMesh.position.copy(p);
    });

    nodes.forEach((node, idx) => {
      const p = this.nodePositions.get(node.id);
      const sprite = this.labelSprites[idx];
      if (p && sprite) {
        sprite.position.copy(p).add(new THREE.Vector3(0, 1.15, 0));
      }
    });

    this.physicsRelaxationTicks++;
  }

  private evaluateRaycastHover(): void {
    if (!this.camera || this.nodeMeshMap.size === 0) return;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const meshes = Array.from(this.nodeMeshMap.values());
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const topHit = intersects[0].object as THREE.Mesh;
      const hitId = topHit.userData.nodeId;
      this.hoveredNodeId = hitId;
    } else {
      this.hoveredNodeId = null;
    }
  }

  private startRenderLoop = (): void => {
    if (this.isDestroyed) return;

    this.animationFrameId = requestAnimationFrame(this.startRenderLoop);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Advance Physics Relaxation
    this.stepPhysicsRelaxation(dt);

    // 2. Animate Discrepancy Warning Halos
    this.warningHalos.forEach((halo) => {
      const pulseT = (elapsedTime * 2.2) % 1.0;
      const scale = 1.0 + pulseT * 0.55;
      halo.ringMesh.scale.set(scale, scale, 1.0);
      const mat = halo.ringMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1.0 - pulseT) * 0.85;
      if (this.camera) {
        halo.ringMesh.lookAt(this.camera.position);
      }
    });

    // 3. Animate Flowing Edge Particle Packets
    this.edgeParticleFlows.forEach((flow) => {
      const src = this.nodePositions.get(flow.sourceId);
      const tgt = this.nodePositions.get(flow.targetId);
      if (!src || !tgt) return;

      const positions = flow.positionsBuffer;
      flow.particles.forEach((p, idx) => {
        p.t = (p.t + dt * flow.speed * 0.35) % 1.0;
        const px = THREE.MathUtils.lerp(src.x, tgt.x, p.t);
        const py = THREE.MathUtils.lerp(src.y, tgt.y, p.t);
        const pz = THREE.MathUtils.lerp(src.z, tgt.z, p.t);
        positions[idx * 3 + 0] = px;
        positions[idx * 3 + 1] = py;
        positions[idx * 3 + 2] = pz;
      });

      flow.pointsMesh.geometry.attributes.position.needsUpdate = true;
    });

    // 4. Smooth Parallax & Hover Mesh Interpolation
    this.currentParallax.lerp(this.targetParallax, 0.06);
    this.rootGroup.rotation.y = this.currentParallax.x + elapsedTime * 0.04;
    this.rootGroup.rotation.x = -this.currentParallax.y;

    // Node Hover Visual Smooth Scaling
    this.nodeMeshMap.forEach((mesh, id) => {
      const isHovered = id === this.hoveredNodeId;
      const targetScale = isHovered ? 1.28 : 1.0;
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);

      const mat = mesh.material as THREE.MeshStandardMaterial;
      const baseEmissive = mesh.userData.emissiveIntensity || 0.45;
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        isHovered ? 1.1 : baseEmissive,
        0.12
      );
    });

    // 5. Render Scene with try-catch for headless mock environments
    if (this.renderer && this.scene && this.camera) {
      try {
        this.renderer.render(this.scene, this.camera);
      } catch {
        // Safe fallback in headless JSDOM environments lacking full WebGL state machine
      }
    }
  };

  private clearVisualGroups(): void {
    // 1. Dispose procedural textures created in previous graph builds
    this.createdTextures.forEach((tex: THREE.Texture) => tex.dispose());
    this.createdTextures = [];

    // 2. Recursively dispose geometries and materials from visual groups
    const groups = [
      this.nodesGroup,
      this.edgesGroup,
      this.particlesGroup,
      this.labelsGroup,
      this.warningHalosGroup,
    ];

    groups.forEach((group) => {
      if (!group) return;
      while (group.children.length > 0) {
        const child = group.children[0] as any;
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
          else child.material.dispose();
        }
        group.remove(child);
      }
    });

    this.nodeMeshMap.clear();
    this.nodePositions.clear();
    this.nodeVelocities.clear();
    this.edgeLines = [];
    this.edgeParticleFlows = [];
    this.warningHalos = [];
    this.labelSprites = [];
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.clearVisualGroups();

    // Dispose procedural textures
    this.createdTextures.forEach((tex: THREE.Texture) => tex.dispose());
    this.createdTextures = [];
    if (this.particleTexture) {
      this.particleTexture.dispose();
      this.particleTexture = null;
    }

    // Teardown WebGL Scene & Renderer
    if (this.scene) {
      disposeThreeScene(this.scene, this.renderer);
      this.scene = null;
    }

    this.camera = null;
    this.renderer = null;
    this.container = null;
  }
}
