/**
 * frontend/src/components/3d/scenes/DigitalTwinScene.ts
 * 
 * Financial Digital Twin 3D Scene Controller.
 * Features a glowing central celestial energy core enclosed by a geodesic containment
 * shield, procedural atmospheric glow corona, and 3 concentric orbital particle rings
 * representing primary liquidity reservoirs (PayPal, Bank Checking, Operating Reserve).
 */

import * as THREE from 'three';
import {
  ThreeSceneController,
  DigitalTwinMetrics,
} from '../../../types';
import { disposeThreeScene } from '../utils/threeDisposal';

interface OrbitalRing {
  name: string;
  radius: number;
  particleCount: number;
  colorHex: number;
  baseAngularSpeed: number;
  currentSpeed: number;
  eulerTilt: THREE.Euler;
  group: THREE.Group;
  pointsMesh: THREE.Points;
  positionsBuffer: Float32Array;
  baseAngles: Float32Array;
}

export class DigitalTwinScene implements ThreeSceneController<DigitalTwinMetrics | any> {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  // Scene Graphs & Groups
  private rootAssembly: THREE.Group = new THREE.Group();
  private orbCoreMesh: THREE.Mesh | null = null;
  private shieldMesh: THREE.Mesh | null = null;
  private coronaSprite: THREE.Sprite | null = null;
  private orbitalRings: OrbitalRing[] = [];
  private ambientDustMesh: THREE.Points | null = null;

  // Metrics & State
  private metrics: DigitalTwinMetrics | null = null;
  private targetCoreColor: THREE.Color = new THREE.Color(0x10b981);
  private currentCoreColor: THREE.Color = new THREE.Color(0x10b981);
  private pulseFrequencyHz: number = 1.0;
  private pulseAmplitude: number = 0.08;
  private targetEmissiveIntensity: number = 0.85;

  // Pointer Parallax
  private targetTilt: THREE.Vector2 = new THREE.Vector2(0, 0);
  private currentTilt: THREE.Vector2 = new THREE.Vector2(0, 0);

  // Procedural Textures
  private coronaTexture: THREE.Texture | null = null;
  private particleTexture: THREE.Texture | null = null;
  private createdTextures: THREE.Texture[] = [];

  // =========================================================================
  // 1. LIFECYCLE: Initialization
  // =========================================================================
  public init(container: HTMLElement, width: number, height: number): void {
    this.container = container;
    this.isDestroyed = false;

    const safeWidth = Math.max(width, 100);
    const safeHeight = Math.max(height, 100);

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.background = null;

    const aspect = safeWidth / safeHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 2.0, 16.5);
    this.camera.lookAt(0, 0, 0);

    // 2. Renderer Setup
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
      console.warn('[DigitalTwinScene] WebGLRenderer init failed:', e);
      return;
    }

    // 3. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const primaryLight = new THREE.PointLight(0x38bdf8, 2.2, 50);
    primaryLight.position.set(8, 10, 8);
    this.scene.add(primaryLight);

    const fillLight = new THREE.PointLight(0x10b981, 1.8, 50);
    fillLight.position.set(-8, -8, 6);
    this.scene.add(fillLight);

    // 4. Procedural Textures
    this.coronaTexture = this.createAtmosphericGlowTexture();
    this.particleTexture = this.createParticleSpriteTexture();

    // 5. Construct 3D Assembly Hierarchy
    this.rootAssembly = new THREE.Group();
    this.buildOrbCore();
    this.buildGeodesicShield();
    this.buildAtmosphericCorona();
    this.buildOrbitalRings();
    this.buildAmbientDust();

    this.scene.add(this.rootAssembly);

    // 6. Update from initial metrics if present
    if (this.metrics) {
      this.applyMetricsState(this.metrics);
    }

    // 7. Start Render Loop
    this.clock.start();
    this.startRenderLoop();
  }

  // =========================================================================
  // 2. LIFECYCLE: Reactive Data Update
  // =========================================================================
  public updateData(data: DigitalTwinMetrics | any): void {
    if (this.isDestroyed || !data) return;
    this.metrics = data;
    this.applyMetricsState(data);
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
  // 4. LIFECYCLE: Pointer Interaction & Tilting
  // =========================================================================
  public onPointerMove(normalizedX: number, normalizedY: number): void {
    if (this.isDestroyed || !Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) {
      return;
    }
    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));

    this.targetTilt.set(clampedX * 0.45, -clampedY * 0.35);
  }

  public onPointerClick(normalizedX: number, normalizedY: number): void {
    this.onPointerMove(normalizedX, normalizedY);
    this.pulseAmplitude = Math.min(this.pulseAmplitude * 1.8, 0.3);
  }

  // =========================================================================
  // 5. 3D COMPONENT BUILDERS
  // =========================================================================

  private buildOrbCore(): void {
    const geo = new THREE.IcosahedronGeometry(1.6, 4);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.85,
      roughness: 0.18,
      metalness: 0.4,
    });
    this.orbCoreMesh = new THREE.Mesh(geo, mat);
    this.rootAssembly.add(this.orbCoreMesh);
  }

  private buildGeodesicShield(): void {
    const geo = new THREE.IcosahedronGeometry(2.15, 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    });
    this.shieldMesh = new THREE.Mesh(geo, mat);
    this.rootAssembly.add(this.shieldMesh);
  }

  private buildAtmosphericCorona(): void {
    if (!this.coronaTexture) return;
    const spriteMat = new THREE.SpriteMaterial({
      map: this.coronaTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.72,
    });
    this.coronaSprite = new THREE.Sprite(spriteMat);
    this.coronaSprite.scale.set(6.8, 6.8, 1.0);
    this.rootAssembly.add(this.coronaSprite);
  }

  private buildOrbitalRings(): void {
    const ringConfigs = [
      {
        name: 'PayPal Available Balance',
        radius: 3.3,
        particleCount: 120,
        colorHex: 0x00cfeb,
        baseAngularSpeed: 1.35,
        eulerTilt: new THREE.Euler(
          THREE.MathUtils.degToRad(24),
          THREE.MathUtils.degToRad(12),
          0
        ),
      },
      {
        name: 'Bank Operating Checking',
        radius: 4.5,
        particleCount: 100,
        colorHex: 0x10b981,
        baseAngularSpeed: 0.95,
        eulerTilt: new THREE.Euler(
          THREE.MathUtils.degToRad(-32),
          THREE.MathUtils.degToRad(-18),
          THREE.MathUtils.degToRad(22)
        ),
      },
      {
        name: 'Emergency Reserve Savings',
        radius: 5.8,
        particleCount: 80,
        colorHex: 0x8b5cf6,
        baseAngularSpeed: 0.55,
        eulerTilt: new THREE.Euler(
          THREE.MathUtils.degToRad(58),
          THREE.MathUtils.degToRad(35),
          THREE.MathUtils.degToRad(-25)
        ),
      },
    ];

    this.orbitalRings = ringConfigs.map((config) => {
      const group = new THREE.Group();
      group.rotation.copy(config.eulerTilt);

      const positions = new Float32Array(config.particleCount * 3);
      const baseAngles = new Float32Array(config.particleCount);

      for (let i = 0; i < config.particleCount; i++) {
        const theta = (i / config.particleCount) * Math.PI * 2;
        baseAngles[i] = theta;

        positions[i * 3 + 0] = config.radius * Math.cos(theta);
        positions[i * 3 + 1] = Math.sin(theta * 3) * 0.28;
        positions[i * 3 + 2] = config.radius * Math.sin(theta);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        color: config.colorHex,
        size: 0.28,
        map: this.particleTexture || undefined,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const pointsMesh = new THREE.Points(geom, mat);
      group.add(pointsMesh);
      this.rootAssembly.add(group);

      return {
        name: config.name,
        radius: config.radius,
        particleCount: config.particleCount,
        colorHex: config.colorHex,
        baseAngularSpeed: config.baseAngularSpeed,
        currentSpeed: config.baseAngularSpeed,
        eulerTilt: config.eulerTilt,
        group,
        pointsMesh,
        positionsBuffer: positions,
        baseAngles,
      };
    });
  }

  private buildAmbientDust(): void {
    const dustCount = 80;
    const positions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.16,
      map: this.particleTexture || undefined,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.ambientDustMesh = new THREE.Points(geom, mat);
    this.scene?.add(this.ambientDustMesh);
  }

  // =========================================================================
  // 6. METRICS REACTION PIPELINE
  // =========================================================================
  private applyMetricsState(metrics: DigitalTwinMetrics | any): void {
    if (!metrics) return;

    // 1. Dynamic Pulse Parameters by State
    switch (metrics.dynamicPulseState) {
      case 'EXPANDING':
        this.pulseAmplitude = 0.16;
        this.pulseFrequencyHz = metrics.pulseFrequencyHz || 1.6;
        break;
      case 'CONTRACTING':
        this.pulseAmplitude = 0.12;
        this.pulseFrequencyHz = metrics.pulseFrequencyHz || 1.8;
        break;
      case 'CRITICAL':
        this.pulseAmplitude = 0.24;
        this.pulseFrequencyHz = 2.8;
        break;
      case 'STABLE':
      default:
        this.pulseAmplitude = 0.08;
        this.pulseFrequencyHz = metrics.pulseFrequencyHz || 1.0;
        break;
    }

    // 2. Core Color Tiers by Health Score & Hex
    if (metrics.orbColorHex) {
      this.targetCoreColor.set(metrics.orbColorHex);
    } else if (metrics.healthScore !== undefined) {
      if (metrics.healthScore >= 80) {
        this.targetCoreColor.setHex(0x10b981); // Emerald
      } else if (metrics.healthScore >= 50) {
        this.targetCoreColor.setHex(0xf59e0b); // Amber
      } else {
        this.targetCoreColor.setHex(0xef4444); // Crimson
      }
    }

    // 3. Orbital Ring Velocity Scaling by Reserve Distribution
    if (metrics.liquidity && this.orbitalRings.length === 3) {
      const total = Math.max(metrics.liquidity.totalLiquidCash || 1, 1000);
      const ppRatio = (metrics.liquidity.paypalAvailableBalance || 0) / total;
      const bkRatio = (metrics.liquidity.bankOperatingChecking || 0) / total;
      const rsRatio = (metrics.liquidity.emergencyReserveSavings || 0) / total;

      this.orbitalRings[0].currentSpeed = this.orbitalRings[0].baseAngularSpeed * (0.8 + ppRatio * 1.5);
      this.orbitalRings[1].currentSpeed = this.orbitalRings[1].baseAngularSpeed * (0.8 + bkRatio * 1.5);
      this.orbitalRings[2].currentSpeed = this.orbitalRings[2].baseAngularSpeed * (0.8 + rsRatio * 1.5);
    }
  }

  // =========================================================================
  // 7. PROCEDURAL TEXTURE GENERATORS
  // =========================================================================
  private createAtmosphericGlowTexture(): THREE.Texture | null {
    if (typeof document === 'undefined') return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (typeof ctx.createRadialGradient === 'function') {
          const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
          grad.addColorStop(0.0, 'rgba(16, 185, 129, 0.85)');
          grad.addColorStop(0.35, 'rgba(6, 182, 212, 0.45)');
          grad.addColorStop(0.7, 'rgba(14, 165, 233, 0.15)');
          grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 256, 256);
        } else {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
          ctx.fillRect(32, 32, 192, 192);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      this.createdTextures.push(texture);
      return texture;
    } catch {
      return null;
    }
  }

  private createParticleSpriteTexture(): THREE.Texture | null {
    if (typeof document === 'undefined') return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (typeof ctx.createRadialGradient === 'function') {
          const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
          grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.7)');
          grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 64, 64);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(16, 16, 32, 32);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      this.createdTextures.push(texture);
      return texture;
    } catch {
      return null;
    }
  }

  // =========================================================================
  // 8. 60FPS RENDER & ANIMATION LOOP
  // =========================================================================
  private startRenderLoop = (): void => {
    if (this.isDestroyed) return;

    this.animationFrameId = requestAnimationFrame(this.startRenderLoop);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Dynamic Heartbeat Core Pulse
    const pulseFactor = 1.0 + this.pulseAmplitude * Math.sin(elapsedTime * Math.PI * 2 * this.pulseFrequencyHz);

    if (this.orbCoreMesh) {
      this.orbCoreMesh.scale.set(pulseFactor, pulseFactor, pulseFactor);

      this.currentCoreColor.lerp(this.targetCoreColor, 0.05);
      const coreMat = this.orbCoreMesh.material as THREE.MeshStandardMaterial;
      coreMat.color.copy(this.currentCoreColor);
      coreMat.emissive.copy(this.currentCoreColor);
    }

    // 2. Gyroscopic Geodesic Shield Rotation
    if (this.shieldMesh) {
      this.shieldMesh.rotation.x += dt * 0.25;
      this.shieldMesh.rotation.y += dt * 0.38;
      this.shieldMesh.rotation.z += dt * 0.18;
      const shieldScale = 1.0 + this.pulseAmplitude * 0.4 * Math.sin(elapsedTime * Math.PI * 2 * this.pulseFrequencyHz);
      this.shieldMesh.scale.set(shieldScale, shieldScale, shieldScale);
    }

    // 3. Corona Sprite Breathing Scale
    if (this.coronaSprite) {
      const coronaScale = 6.8 * pulseFactor;
      this.coronaSprite.scale.set(coronaScale, coronaScale, 1.0);
    }

    // 4. Concentric Orbital Rings Dynamics
    this.orbitalRings.forEach((ring) => {
      const positions = ring.positionsBuffer;
      const baseAngles = ring.baseAngles;
      const count = ring.particleCount;
      const speed = ring.currentSpeed;
      const radius = ring.radius;

      for (let i = 0; i < count; i++) {
        const theta = baseAngles[i] + elapsedTime * speed;
        positions[i * 3 + 0] = radius * Math.cos(theta);
        positions[i * 3 + 1] = Math.sin(theta * 3 + elapsedTime * 1.5) * 0.32;
        positions[i * 3 + 2] = radius * Math.sin(theta);
      }

      ring.pointsMesh.geometry.attributes.position.needsUpdate = true;
    });

    // 5. Ambient Dust Gentle Orbit
    if (this.ambientDustMesh) {
      this.ambientDustMesh.rotation.y += dt * 0.02;
    }

    // 6. Interactive Damped Tilting
    this.currentTilt.lerp(this.targetTilt, 0.08);
    this.rootAssembly.rotation.y = this.currentTilt.x;
    this.rootAssembly.rotation.x = this.currentTilt.y;

    // 7. Render Frame with headless JSDOM guard
    if (this.renderer && this.scene && this.camera) {
      try {
        this.renderer.render(this.scene, this.camera);
      } catch {
        // Safe fallback for mock WebGL contexts in test environment
      }
    }
  };

  // =========================================================================
  // 9. CLEAN RESOURCE DISPOSAL
  // =========================================================================
  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Dispose procedural textures
    this.createdTextures.forEach((tex: THREE.Texture) => tex.dispose());
    this.createdTextures = [];
    this.coronaTexture = null;
    this.particleTexture = null;

    // Discard Three.js Objects & GPU buffers
    if (this.scene) {
      disposeThreeScene(this.scene, this.renderer);
      this.scene = null;
    }

    this.orbCoreMesh = null;
    this.shieldMesh = null;
    this.coronaSprite = null;
    this.orbitalRings = [];
    this.ambientDustMesh = null;
    this.camera = null;
    this.renderer = null;
    this.container = null;
  }
}
