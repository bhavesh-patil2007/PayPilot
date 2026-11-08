/**
 * TerrainScene.ts
 * 
 * Production-ready Three.js 0.170.0 scene controller for the Simulation Lab.
 * Renders an interactive 3D cash-flow heightfield terrain surface representing
 * 90 days of cash projections, with vertex color-grading, neon contour wireframe,
 * safety buffer threshold plane ($15,000), minimum cash beacon, and NDC pointer inspection.
 */

import * as THREE from 'three';
import { ThreeSceneController, DailyCashProjectionPoint, SimulationLabState } from '../../../types';
import { disposeThreeScene } from '../utils/threeDisposal';

export interface TerrainSceneData {
  dailyProjections?: DailyCashProjectionPoint[];
  safetyBufferThreshold?: number;
  minimumCashPoint?: { amount: number; dayIndex: number; date: string };
  isBufferBreached?: boolean;
}

export class TerrainScene implements ThreeSceneController<TerrainSceneData | DailyCashProjectionPoint[] | SimulationLabState> {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private animFrameId: number | null = null;
  private isDestroyed: boolean = false;

  // Visual Meshes & Groups
  private rootGroup: THREE.Group | null = null;
  private terrainMesh: THREE.Mesh | null = null;
  private wireframeMesh: THREE.LineSegments | null = null;
  private safetyPlaneMesh: THREE.Mesh | null = null;
  private beaconGroup: THREE.Group | null = null;
  private probeLine: THREE.Line | null = null;

  // Geometry configuration
  private readonly planeWidth = 28;
  private readonly planeDepth = 14;
  private readonly segmentsX = 90; // 91 points (day 0 to 90)
  private readonly segmentsZ = 28;

  // Interaction State
  private targetRotationX = 0.55;
  private targetRotationY = -0.35;
  private currentRotationX = 0.55;
  private currentRotationY = -0.35;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouseCoords: THREE.Vector2 = new THREE.Vector2(0, 0);
  private hoveredDayIndex: number | null = null;

  // Data Caches
  private projectionsCache: DailyCashProjectionPoint[] = [];
  private safetyBuffer = 15000;
  private minCashDay = 28;
  private minCashAmount = 64200;

  public init(container: HTMLElement, width: number, height: number): void {
    this.container = container;
    this.isDestroyed = false;

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent background to blend into dark UI cards
    this.scene.fog = new THREE.FogExp2(0x020617, 0.025); // Obsidian fog falloff

    // 2. Camera Setup
    const aspect = (width > 0 && height > 0) ? width / height : 1.6;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 16, 24);
    this.camera.lookAt(0, 0, 0);

    // 3. WebGLRenderer Setup
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(Math.max(width, 10), Math.max(height, 10));
      this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(this.renderer.domElement);
    } catch (e) {
      console.warn('[TerrainScene] WebGLRenderer init failed, entering fallback state:', e);
      return;
    }

    // 4. Lighting Rig
    this.setupLighting();

    // 5. Build 3D Objects
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.buildTerrain();
    this.buildSafetyBufferPlane();
    this.buildMinimumBeacon();
    this.buildProbeLine();

    // 6. Start Render Loop
    this.clock.start();
    this.render();
  }

  private setupLighting(): void {
    if (!this.scene) return;

    // Ambient baseline illumination
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.6);
    this.scene.add(ambientLight);

    // Primary directional light (top-right sunlight angle)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 25, 15);
    this.scene.add(dirLight);

    // Cyberpunk rim light from bottom left
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.8);
    rimLight.position.set(-15, -5, -10);
    this.scene.add(rimLight);

    // Warning amber point light near danger zone
    const warningPoint = new THREE.PointLight(0xf59e0b, 1.5, 30);
    warningPoint.position.set(0, 2, 0);
    this.scene.add(warningPoint);
  }

  private buildTerrain(): void {
    if (!this.rootGroup) return;

    // Create Plane Geometry: X is length (days), Z is width
    const geometry = new THREE.PlaneGeometry(
      this.planeWidth,
      this.planeDepth,
      this.segmentsX,
      this.segmentsZ
    );
    geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    // Allocate per-vertex colors
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = 0.05;     // R
      colors[i * 3 + 1] = 0.7;   // G
      colors[i * 3 + 2] = 0.9;   // B
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Material with smooth specular lighting and vertex color blending
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.35,
      metalness: 0.25,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.rootGroup.add(this.terrainMesh);

    // Wireframe Topographical Grid Overlay
    const wireframeGeo = new THREE.WireframeGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });
    this.wireframeMesh = new THREE.LineSegments(wireframeGeo, wireframeMat);
    this.rootGroup.add(this.wireframeMesh);
  }

  private buildSafetyBufferPlane(): void {
    if (!this.rootGroup) return;

    const planeGeo = new THREE.PlaneGeometry(this.planeWidth * 1.05, this.planeDepth * 1.05);
    planeGeo.rotateX(-Math.PI / 2);

    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      wireframe: true,
    });

    this.safetyPlaneMesh = new THREE.Mesh(planeGeo, planeMat);
    this.safetyPlaneMesh.position.y = 0; // Default zero-plane level
    this.rootGroup.add(this.safetyPlaneMesh);
  }

  private buildMinimumBeacon(): void {
    if (!this.rootGroup) return;

    this.beaconGroup = new THREE.Group();

    // Floating Octahedron Diamond
    const diamondGeo = new THREE.OctahedronGeometry(0.5, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
    diamondMesh.name = 'diamondMesh';
    diamondMesh.position.y = 1.0;
    this.beaconGroup.add(diamondMesh);

    // Vertical Laser Guide Line to Surface
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1.0, 0),
    ]);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const laserLine = new THREE.Line(laserGeo, laserMat);
    this.beaconGroup.add(laserLine);

    this.rootGroup.add(this.beaconGroup);
  }

  private buildProbeLine(): void {
    if (!this.rootGroup) return;

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -5, 0),
      new THREE.Vector3(0, 8, 0),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.0, // Invisible until user hovers
      blending: THREE.AdditiveBlending,
    });

    this.probeLine = new THREE.Line(lineGeo, lineMat);
    this.rootGroup.add(this.probeLine);
  }

  public updateData(data: TerrainSceneData | DailyCashProjectionPoint[] | SimulationLabState): void {
    if (this.isDestroyed || !data) return;

    let points: DailyCashProjectionPoint[] = [];
    if (Array.isArray(data)) {
      points = data;
    } else if (typeof data === 'object' && 'dailyProjections' in data && Array.isArray(data.dailyProjections)) {
      points = data.dailyProjections;
      if (data.safetyBufferThreshold !== undefined) {
        this.safetyBuffer = data.safetyBufferThreshold;
      }
      if (data.minimumCashPoint) {
        this.minCashDay = data.minimumCashPoint.dayIndex;
        this.minCashAmount = data.minimumCashPoint.amount;
      }
    }

    if (points.length === 0) return;
    this.projectionsCache = points;

    // Recalculate Min & Max for heightfield normalization
    let minBal = Infinity;
    let maxBal = -Infinity;
    let minIndex = 0;

    for (let i = 0; i < points.length; i++) {
      const b = points[i].balance;
      if (b < minBal) {
        minBal = b;
        minIndex = i;
      }
      if (b > maxBal) {
        maxBal = b;
      }
    }

    this.minCashDay = minIndex;
    this.minCashAmount = minBal;
    const balanceRange = Math.max(maxBal - minBal, 1000);

    // Update Plane Geometry Vertices and Colors
    if (!this.terrainMesh) return;
    const geo = this.terrainMesh.geometry as THREE.BufferGeometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const colorAttr = geo.attributes.color as THREE.BufferAttribute;

    const verticesAcrossX = this.segmentsX + 1; // 91
    const verticesAcrossZ = this.segmentsZ + 1; // 29

    const minHeightY = -3.5;
    const maxHeightY = 5.0;
    const heightSpan = maxHeightY - minHeightY;

    // Reposition Safety Buffer Plane
    if (this.safetyPlaneMesh) {
      const normalizedSafety = (this.safetyBuffer - minBal) / balanceRange;
      const safetyY = minHeightY + normalizedSafety * heightSpan;
      this.safetyPlaneMesh.position.y = Math.max(minHeightY - 0.5, Math.min(maxHeightY, safetyY));
    }

    // Colors
    const colorSurplus = new THREE.Color(0x00f2fe);  // Electric Cyan
    const colorHealthy = new THREE.Color(0x10b981);  // Mint Emerald
    const colorWarning = new THREE.Color(0xf59e0b);  // Amber Gold
    const colorBreach = new THREE.Color(0xef4444);   // Crimson Red

    for (let iz = 0; iz < verticesAcrossZ; iz++) {
      const zRatio = (iz / this.segmentsZ) * 2 - 1; // [-1, 1]
      // Canyon cross-section bell curve: center is full height, outer flanks taper down
      const crossProfile = Math.cos(zRatio * Math.PI * 0.45);

      for (let ix = 0; ix < verticesAcrossX; ix++) {
        const vertexIndex = iz * verticesAcrossX + ix;
        const pt = points[Math.min(ix, points.length - 1)];
        const balance = pt ? pt.balance : minBal;

        // Normalized elevation
        const normBal = (balance - minBal) / balanceRange;
        const targetY = (minHeightY + normBal * heightSpan) * crossProfile;

        posAttr.setY(vertexIndex, targetY);

        // Vertex Color Grading
        const vertexColor = new THREE.Color();
        if (balance < this.safetyBuffer) {
          // Breach or tight: interpolate warning to breach
          const t = Math.max(0, Math.min(1, (this.safetyBuffer - balance) / Math.max(1, this.safetyBuffer)));
          vertexColor.copy(colorWarning).lerp(colorBreach, t);
        } else if (balance < 60000) {
          // Normal buffer to healthy
          const t = (balance - this.safetyBuffer) / (60000 - this.safetyBuffer);
          vertexColor.copy(colorWarning).lerp(colorHealthy, t);
        } else {
          // Healthy to surplus
          const t = Math.min(1, (balance - 60000) / (maxBal - 60000 + 1));
          vertexColor.copy(colorHealthy).lerp(colorSurplus, t);
        }

        colorAttr.setXYZ(vertexIndex, vertexColor.r, vertexColor.g, vertexColor.b);
      }
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    geo.computeVertexNormals();

    // Rebuild Wireframe to match modified geometry
    if (this.wireframeMesh && this.rootGroup) {
      this.rootGroup.remove(this.wireframeMesh);
      if (this.wireframeMesh.geometry) this.wireframeMesh.geometry.dispose();
      const newWireGeo = new THREE.WireframeGeometry(geo);
      this.wireframeMesh.geometry = newWireGeo;
      this.rootGroup.add(this.wireframeMesh);
    }

    // Position Minimum Cash Beacon
    if (this.beaconGroup) {
      const minX = ((this.minCashDay / this.segmentsX) - 0.5) * this.planeWidth;
      const normMin = (this.minCashAmount - minBal) / balanceRange;
      const minY = minHeightY + normMin * heightSpan;
      this.beaconGroup.position.set(minX, minY, 0);
    }
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
    this.mouseCoords.set(clampedX, clampedY);
    // Smooth camera tilt target based on NDC coordinates
    this.targetRotationY = -0.35 + clampedX * 0.45;
    this.targetRotationX = 0.55 - clampedY * 0.25;

    // Raycast against terrain surface to track hovered day
    if (this.camera && this.terrainMesh) {
      this.raycaster.setFromCamera(this.mouseCoords, this.camera);
      const intersects = this.raycaster.intersectObject(this.terrainMesh, false);

      if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        // Map hitPoint.x to day index 0..90
        const localX = hitPoint.x;
        const ratio = (localX / this.planeWidth) + 0.5;
        const day = Math.max(0, Math.min(this.segmentsX, Math.round(ratio * this.segmentsX)));
        this.hoveredDayIndex = day;

        if (this.probeLine) {
          (this.probeLine.material as THREE.LineBasicMaterial).opacity = 0.85;
          this.probeLine.position.set(hitPoint.x, 0, hitPoint.z);
        }
      } else {
        this.hoveredDayIndex = null;
        if (this.probeLine) {
          (this.probeLine.material as THREE.LineBasicMaterial).opacity = 0.0;
        }
      }
    }
  }

  public onPointerClick(normalizedX: number, normalizedY: number): void {
    this.onPointerMove(normalizedX, normalizedY);
  }

  private render = (): void => {
    if (this.isDestroyed || !this.renderer || !this.scene || !this.camera) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Smoothly interpolate rotation toward target (damping / inertia)
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.05;
    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.05;

    if (this.rootGroup) {
      this.rootGroup.rotation.x = this.currentRotationX;
      this.rootGroup.rotation.y = this.currentRotationY;
    }

    // 2. Animate Minimum Beacon
    if (this.beaconGroup) {
      const diamond = this.beaconGroup.getObjectByName('diamondMesh');
      if (diamond) {
        diamond.rotation.y += delta * 1.8;
        diamond.position.y = 1.0 + Math.sin(elapsedTime * 3.5) * 0.18;
      }
    }

    // 3. Subtle terrain shimmer / breathing wave on wireframe opacity
    if (this.wireframeMesh) {
      const mat = this.wireframeMesh.material as THREE.LineBasicMaterial;
      mat.opacity = 0.22 + Math.sin(elapsedTime * 2.0) * 0.08;
    }

    // 4. Render Scene with headless JSDOM guard
    try {
      this.renderer.render(this.scene, this.camera);
    } catch {
      // Safe fallback in headless test environments
    }

    this.animFrameId = requestAnimationFrame(this.render);
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

    this.renderer = null;
    this.camera = null;
    this.rootGroup = null;
    this.terrainMesh = null;
    this.wireframeMesh = null;
    this.safetyPlaneMesh = null;
    this.beaconGroup = null;
    this.probeLine = null;
    this.container = null;
  }
}
