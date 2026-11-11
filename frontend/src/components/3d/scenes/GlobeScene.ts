/**
 * GlobeScene.ts
 *
 * Production-ready Three.js 0.170.0 Scene Controller for PayPilot Command Center Hero.
 * Renders an interactive 3D particle globe representing global transactions,
 * elevated quadratic Bézier transactional arcs with animated comet pulses,
 * pulsing city beacons, equatorial/tropic coordinate gridlines, and smooth NDC
 * pointer parallax responsiveness.
 *
 * Supports dynamic theme switching:
 * - Light Mode: Dark copper, deep slate, rich teal, and vibrant amber materials with NormalBlending
 * - Dark Mode: Luminous electric cyan, emerald, and glowing comets with AdditiveBlending
 */

import * as THREE from 'three';
import type { ThreeSceneController, MonetaryTransitArc } from '../../../types';
import { disposeThreeScene } from '../utils/threeDisposal';

/**
 * Procedural circular soft-glow texture generator for particle sprites.
 * Guaranteed 100% offline standalone reliability without external image assets.
 */
function createGlowTexture(size = 64): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (typeof ctx.createRadialGradient === 'function') {
      const center = size / 2;
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.7)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

      ctx.fillStyle = gradient;
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

/**
 * Default fallback transit arcs representing high-volume international money routes.
 */
const DEFAULT_TRANSIT_ARCS: MonetaryTransitArc[] = [
  {
    id: 'ARC-1',
    sourceCity: 'San Jose, CA',
    sourceCoords: [37.3382, -121.8863],
    destCity: 'London, UK',
    destCoords: [51.5074, -0.1278],
    amount: 14200.0,
    currency: 'USD',
    type: 'PAYPAL_INFLOW',
    timestamp: '2024-11-06T12:00:00Z',
  },
  {
    id: 'ARC-2',
    sourceCity: 'Berlin, DE',
    sourceCoords: [52.52, 13.405],
    destCity: 'New York, NY',
    destCoords: [40.7128, -74.006],
    amount: 8650.0,
    currency: 'USD',
    type: 'PAYPAL_INFLOW',
    timestamp: '2024-11-06T12:15:00Z',
  },
  {
    id: 'ARC-3',
    sourceCity: 'Singapore',
    sourceCoords: [1.3521, 103.8198],
    destCity: 'San Jose, CA',
    destCoords: [37.3382, -121.8863],
    amount: 22500.0,
    currency: 'USD',
    type: 'SUPPLIER_OUTFLOW',
    timestamp: '2024-11-06T12:30:00Z',
  },
  {
    id: 'ARC-4',
    sourceCity: 'Toronto, CA',
    sourceCoords: [43.6532, -79.3832],
    destCity: 'San Jose, CA',
    destCoords: [37.3382, -121.8863],
    amount: 1420.0,
    currency: 'USD',
    type: 'RECOVERY_CREDIT',
    timestamp: '2024-11-06T13:00:00Z',
  },
  {
    id: 'ARC-5',
    sourceCity: 'Tokyo, JP',
    sourceCoords: [35.6762, 139.6503],
    destCity: 'San Jose, CA',
    destCoords: [37.3382, -121.8863],
    amount: 5400.0,
    currency: 'USD',
    type: 'DISPUTE_HOLD',
    timestamp: '2024-11-06T13:15:00Z',
  },
];

export class GlobeScene implements ThreeSceneController<MonetaryTransitArc[]> {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private animFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private isDestroyed: boolean = false;

  // Scene Graphs
  private rootGroup: THREE.Group | null = null;
  private globeGroup: THREE.Group | null = null;
  private arcsGroup: THREE.Group | null = null;
  private beaconsGroup: THREE.Group | null = null;
  private ringsGroup: THREE.Group | null = null;
  private latticeMesh: THREE.Points | null = null;
  private atmosphereMesh: THREE.Points | null = null;

  // Visual Assets
  private glowTexture: THREE.Texture | null = null;
  private globeRadius = 3.6;

  // Dynamic Arcs & Comets
  private arcComets: Array<{
    curve: THREE.QuadraticBezierCurve3;
    speed: number;
    offset: number;
    points: THREE.Points;
  }> = [];

  // Interaction State
  private pointerCurrent = { x: 0, y: 0 };
  private pointerTarget = { x: 0, y: 0 };

  // Data cache
  private cachedArcs: MonetaryTransitArc[] = [];

  // Theme tracking
  private currentThemeIsDark: boolean = true;

  private isDarkMode(): boolean {
    if (typeof document === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  }

  public init(container: HTMLElement, width: number, height: number): void {
    this.container = container;
    this.isDestroyed = false;
    this.currentThemeIsDark = this.isDarkMode();

    const w = width > 0 ? width : container.clientWidth || 400;
    const h = height > 0 ? height : container.clientHeight || 400;

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(0, 1.2, 9.6);
    this.camera.lookAt(0, 0, 0);

    // 2. WebGLRenderer with high-dpi clamping and alpha transparency
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

      // Clear any previous canvas and mount
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(this.renderer.domElement);
    } catch (e) {
      console.warn('[GlobeScene] WebGLRenderer init failed:', e);
      return;
    }

    // 3. Shared Glow Texture
    this.glowTexture = createGlowTexture(64);

    // 4. Build Hierarchy
    this.rootGroup = new THREE.Group();
    this.globeGroup = new THREE.Group();
    this.arcsGroup = new THREE.Group();
    this.beaconsGroup = new THREE.Group();
    this.ringsGroup = new THREE.Group();

    this.globeGroup.add(this.ringsGroup);
    this.globeGroup.add(this.beaconsGroup);
    this.globeGroup.add(this.arcsGroup);
    this.rootGroup.add(this.globeGroup);
    this.scene.add(this.rootGroup);

    // Initial earth tilt (12 degrees visual tilt)
    this.globeGroup.rotation.z = THREE.MathUtils.degToRad(12);

    // 5. Construct Visuals
    this.buildGlobeLattice(this.globeRadius);
    this.buildAtmosphere(this.globeRadius);
    this.buildCoordinateRings(this.globeRadius);

    const initialArcs = this.cachedArcs.length > 0 ? this.cachedArcs : DEFAULT_TRANSIT_ARCS;
    this.buildArcs(initialArcs);

    // 6. Start Render Loop
    this.clock.start();
    this.animate();
  }

  /**
   * Rebuilds all materials when dark/light theme toggles.
   */
  private rebuildForTheme(): void {
    if (!this.globeGroup || this.isDestroyed) return;

    if (this.latticeMesh) {
      this.globeGroup.remove(this.latticeMesh);
      if (this.latticeMesh.geometry) this.latticeMesh.geometry.dispose();
      if (this.latticeMesh.material) (this.latticeMesh.material as THREE.Material).dispose();
      this.latticeMesh = null;
    }

    if (this.atmosphereMesh) {
      this.globeGroup.remove(this.atmosphereMesh);
      if (this.atmosphereMesh.geometry) this.atmosphereMesh.geometry.dispose();
      if (this.atmosphereMesh.material) (this.atmosphereMesh.material as THREE.Material).dispose();
      this.atmosphereMesh = null;
    }

    if (this.ringsGroup) {
      while (this.ringsGroup.children.length > 0) {
        const child = this.ringsGroup.children[0] as any;
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
        this.ringsGroup.remove(child);
      }
    }

    this.buildGlobeLattice(this.globeRadius);
    this.buildAtmosphere(this.globeRadius);
    this.buildCoordinateRings(this.globeRadius);

    const arcs = this.cachedArcs.length > 0 ? this.cachedArcs : DEFAULT_TRANSIT_ARCS;
    this.buildArcs(arcs);
  }

  /**
   * Generates a Fibonacci sphere lattice with 2,000 points.
   * Dynamically adapts colors and blending:
   * - Light Mode: Deep copper (#b45309), dark slate (#1e293b), rich amber (#d97706) with NormalBlending
   * - Dark Mode: PayPal Blue (#0079c1), Electric Cyan (#00cfe8), Emerald (#10b981) with AdditiveBlending
   */
  private buildGlobeLattice(radius: number): void {
    if (!this.globeGroup) return;

    const isDark = this.currentThemeIsDark;
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle

    // Theme-dependent color palette
    const cBase = isDark ? new THREE.Color(0x0079c1) : new THREE.Color(0xd97706); // Dark: Blue, Light: Copper
    const cCyan = isDark ? new THREE.Color(0x00cfe8) : new THREE.Color(0x0f766e); // Dark: Cyan, Light: Deep Teal
    const cEmerald = isDark ? new THREE.Color(0x10b981) : new THREE.Color(0x047857); // Dark: Emerald, Light: Dark Green
    const cNavy = isDark ? new THREE.Color(0x001d3d) : new THREE.Color(0x1e293b); // Dark: Navy, Light: Deep Slate

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // -1 to 1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      positions[i * 3] = x * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = z * radius;

      const latAbs = Math.abs(y);
      const longitudeWave = Math.sin(theta * 3.0) * 0.5 + 0.5;

      const pointColor = new THREE.Color();
      if (latAbs < 0.3) {
        pointColor.copy(cCyan).lerp(cEmerald, longitudeWave);
      } else if (latAbs < 0.7) {
        pointColor.copy(cBase).lerp(cCyan, longitudeWave * 0.7);
      } else {
        pointColor.copy(cNavy).lerp(cBase, 0.4);
      }

      colors[i * 3] = pointColor.r;
      colors[i * 3 + 1] = pointColor.g;
      colors[i * 3 + 2] = pointColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: isDark ? 0.08 : 0.095,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.9 : 0.95,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      map: this.glowTexture || undefined,
    });

    this.latticeMesh = new THREE.Points(geometry, material);
    this.globeGroup.add(this.latticeMesh);
  }

  /**
   * Outer atmospheric halo particle shell.
   */
  private buildAtmosphere(radius: number): void {
    if (!this.globeGroup) return;

    const isDark = this.currentThemeIsDark;
    const count = 450;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phi = Math.PI * (3 - Math.sqrt(5));
    const atmoRadius = radius * 1.08;
    const atmoColor = isDark ? new THREE.Color(0x00cfe8) : new THREE.Color(0xb45309);

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      positions[i * 3] = Math.cos(theta) * radiusAtY * atmoRadius;
      positions[i * 3 + 1] = y * atmoRadius;
      positions[i * 3 + 2] = Math.sin(theta) * radiusAtY * atmoRadius;

      colors[i * 3] = atmoColor.r;
      colors[i * 3 + 1] = atmoColor.g;
      colors[i * 3 + 2] = atmoColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.35 : 0.45,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      map: this.glowTexture || undefined,
    });

    this.atmosphereMesh = new THREE.Points(geometry, material);
    this.globeGroup.add(this.atmosphereMesh);
  }

  /**
   * High-tech financial terminal coordinate rings (Equator, Tropics).
   */
  private buildCoordinateRings(radius: number): void {
    if (!this.ringsGroup) return;

    const isDark = this.currentThemeIsDark;
    const segments = 64;
    const ringMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x0079c1 : 0xd97706,
      transparent: true,
      opacity: isDark ? 0.22 : 0.35,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    // Equator Ring
    const eqPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      eqPoints.push(new THREE.Vector3(Math.cos(angle) * radius * 1.002, 0, Math.sin(angle) * radius * 1.002));
    }
    const eqGeom = new THREE.BufferGeometry().setFromPoints(eqPoints);
    this.ringsGroup.add(new THREE.Line(eqGeom, ringMat));

    // Tropic of Cancer (+23.5 deg)
    const cancerLat = THREE.MathUtils.degToRad(23.5);
    const cancerR = radius * Math.cos(cancerLat) * 1.002;
    const cancerY = radius * Math.sin(cancerLat) * 1.002;
    const cancerPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      cancerPoints.push(new THREE.Vector3(Math.cos(angle) * cancerR, cancerY, Math.sin(angle) * cancerR));
    }
    const cancerGeom = new THREE.BufferGeometry().setFromPoints(cancerPoints);
    this.ringsGroup.add(new THREE.Line(cancerGeom, ringMat));

    // Tropic of Capricorn (-23.5 deg)
    const caprPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      caprPoints.push(new THREE.Vector3(Math.cos(angle) * cancerR, -cancerY, Math.sin(angle) * cancerR));
    }
    const caprGeom = new THREE.BufferGeometry().setFromPoints(caprPoints);
    this.ringsGroup.add(new THREE.Line(caprGeom, ringMat));
  }

  /**
   * Converts geographic (latitude, longitude) into 3D Cartesian coordinates on sphere.
   */
  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }

  private getArcColor(type: MonetaryTransitArc['type']): THREE.Color {
    const isDark = this.currentThemeIsDark;
    switch (type) {
      case 'PAYPAL_INFLOW':
        return isDark ? new THREE.Color(0x00cfe8) : new THREE.Color(0x0284c7); // Cyan vs Ocean Blue
      case 'RECOVERY_CREDIT':
        return isDark ? new THREE.Color(0x10b981) : new THREE.Color(0x059669); // Bright vs Forest Emerald
      case 'SUPPLIER_OUTFLOW':
        return isDark ? new THREE.Color(0xf59e0b) : new THREE.Color(0xd97706); // Amber vs Rich Copper
      case 'DISPUTE_HOLD':
        return isDark ? new THREE.Color(0xf43f5e) : new THREE.Color(0xdc2626); // Rose vs Deep Crimson
      default:
        return isDark ? new THREE.Color(0x38bdf8) : new THREE.Color(0x475569); // Sky vs Slate
    }
  }

  /**
   * Constructs 3D elevated Bézier arcs and comet particles for active transactions.
   */
  private buildArcs(arcs: MonetaryTransitArc[]): void {
    if (!this.arcsGroup || !this.beaconsGroup) return;

    const isDark = this.currentThemeIsDark;

    // 1. Clean up existing arcs & comets
    while (this.arcsGroup.children.length > 0) {
      const child = this.arcsGroup.children[0] as any;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        else child.material.dispose();
      }
      this.arcsGroup.remove(child);
    }
    while (this.beaconsGroup.children.length > 0) {
      const child = this.beaconsGroup.children[0] as any;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        else child.material.dispose();
      }
      this.beaconsGroup.remove(child);
    }
    this.arcComets = [];
    this.cachedArcs = arcs;

    const r = this.globeRadius;

    arcs.forEach((arc) => {
      if (!arc.sourceCoords || !arc.destCoords) return;
      const p0 = this.latLngToVector3(arc.sourceCoords[0], arc.sourceCoords[1], r);
      const p1 = this.latLngToVector3(arc.destCoords[0], arc.destCoords[1], r);
      const chordDist = p0.distanceTo(p1);

      // Arc midpoint elevated outward
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      const elevation = r + Math.max(chordDist * 0.32, 0.45);
      const pMid = mid.normalize().multiplyScalar(elevation);

      const curve = new THREE.QuadraticBezierCurve3(p0, pMid, p1);
      const curvePoints = curve.getPoints(48);

      const arcColor = this.getArcColor(arc.type);

      // Arc Line
      const arcGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: isDark ? 0.72 : 0.88,
        blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      const arcLine = new THREE.Line(arcGeom, arcMat);
      this.arcsGroup!.add(arcLine);

      // Comet Particle Stream along Arc (Head + 3 Fading Trail Particles)
      const cometCount = 4;
      const cometPositions = new Float32Array(cometCount * 3);
      const cometColors = new Float32Array(cometCount * 3);
      for (let j = 0; j < cometCount; j++) {
        const fade = 1 - j * 0.22;
        cometColors[j * 3] = arcColor.r * fade;
        cometColors[j * 3 + 1] = arcColor.g * fade;
        cometColors[j * 3 + 2] = arcColor.b * fade;
      }
      const cometGeom = new THREE.BufferGeometry();
      cometGeom.setAttribute('position', new THREE.BufferAttribute(cometPositions, 3));
      cometGeom.setAttribute('color', new THREE.BufferAttribute(cometColors, 3));

      const cometMat = new THREE.PointsMaterial({
        size: isDark ? 0.16 : 0.19,
        vertexColors: true,
        transparent: true,
        opacity: isDark ? 0.95 : 1.0,
        blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
        map: this.glowTexture || undefined,
      });

      const cometPoints = new THREE.Points(cometGeom, cometMat);
      this.arcsGroup!.add(cometPoints);

      this.arcComets.push({
        curve,
        speed: 0.35 + Math.random() * 0.2,
        offset: Math.random(),
        points: cometPoints,
      });

      // City Beacons (Source & Destination pulsing rings on globe surface)
      [p0, p1].forEach((pos) => {
        const beaconGeom = new THREE.RingGeometry(0.04, 0.11, 16);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: arcColor,
          transparent: true,
          opacity: isDark ? 0.85 : 0.95,
          side: THREE.DoubleSide,
          blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
          depthWrite: false,
        });
        const beacon = new THREE.Mesh(beaconGeom, beaconMat);
        beacon.position.copy(pos.clone().multiplyScalar(1.003));
        beacon.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
        this.beaconsGroup!.add(beacon);
      });
    });
  }

  public updateData(data?: MonetaryTransitArc[]): void {
    if (this.isDestroyed) return;
    const arcs = Array.isArray(data) && data.length > 0 ? data : DEFAULT_TRANSIT_ARCS;
    this.buildArcs(arcs);
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
    this.pointerTarget.x = Math.max(-1, Math.min(1, normalizedX));
    this.pointerTarget.y = Math.max(-1, Math.min(1, normalizedY));
  }

  private animate = (): void => {
    if (this.isDestroyed || !this.renderer || !this.scene || !this.camera) return;

    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // Check for real-time theme switch (Dark <-> Light Mode)
    const isDarkNow = this.isDarkMode();
    if (isDarkNow !== this.currentThemeIsDark) {
      this.currentThemeIsDark = isDarkNow;
      this.rebuildForTheme();
    }

    // Constant slow rotation + pointer parallax smoothing
    if (this.globeGroup) {
      this.globeGroup.rotation.y += delta * 0.14;

      this.pointerCurrent.x += (this.pointerTarget.x - this.pointerCurrent.x) * Math.min(delta * 4, 1);
      this.pointerCurrent.y += (this.pointerTarget.y - this.pointerCurrent.y) * Math.min(delta * 4, 1);

      this.globeGroup.rotation.x = this.pointerCurrent.y * 0.32;
      this.globeGroup.rotation.z = -this.pointerCurrent.x * 0.2;
    }

    // Animate comets along curves
    for (const comet of this.arcComets) {
      const t = (elapsed * comet.speed + comet.offset) % 1.0;
      const posAttr = comet.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      if (posAttr) {
        const pHead = comet.curve.getPoint(t);
        posAttr.setXYZ(0, pHead.x, pHead.y, pHead.z);

        for (let j = 1; j < 4; j++) {
          const trailT = Math.max(0, t - j * 0.025);
          const pTrail = comet.curve.getPoint(trailT);
          posAttr.setXYZ(j, pTrail.x, pTrail.y, pTrail.z);
        }
        posAttr.needsUpdate = true;
      }
    }

    // Animate pulsing city beacons
    if (this.beaconsGroup) {
      const pulse = (Math.sin(elapsed * 3.2) + 1) * 0.5;
      this.beaconsGroup.children.forEach((beacon, idx) => {
        const s = 1.0 + ((pulse + idx * 0.15) % 1.0) * 0.9;
        beacon.scale.set(s, s, s);
      });
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
    this.globeGroup = null;
    this.arcsGroup = null;
    this.beaconsGroup = null;
    this.ringsGroup = null;
    this.latticeMesh = null;
    this.atmosphereMesh = null;
    this.arcComets = [];
    this.container = null;
  }
}
