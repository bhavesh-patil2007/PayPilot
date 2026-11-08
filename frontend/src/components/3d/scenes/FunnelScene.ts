/**
 * FunnelScene.ts
 * 
 * Production-ready Three.js 0.170.0 scene controller for PayBack Hunter.
 * Visualizes the 4-stage recovery pipeline (Identified -> Submitted -> Pending -> Recovered)
 * with 4 tiered glassmorphic frustum stages, glowing junction rings, downward
 * spiraling particle vortex physics, and interactive NDC pointer hover highlighting.
 */

import * as THREE from 'three';
import { ThreeSceneController, RecoveryFunnelMetrics, RecoveryCase } from '../../../types';
import { disposeThreeScene } from '../utils/threeDisposal';

interface FunnelStageConfig {
  id: string;
  name: string;
  yTop: number;
  yBottom: number;
  radiusTop: number;
  radiusBottom: number;
  colorHex: number;
  emissiveHex: number;
}

export class FunnelScene implements ThreeSceneController<RecoveryFunnelMetrics | RecoveryCase[] | any> {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private animFrameId: number | null = null;
  private isDestroyed: boolean = false;

  // Visual Groups
  private rootGroup: THREE.Group | null = null;
  private stageMeshes: THREE.Mesh[] = [];
  private ringMeshes: THREE.Mesh[] = [];
  private particlesMesh: THREE.Points | null = null;
  private glowTexture: THREE.Texture | null = null;

  // Particle System Data
  private readonly particleCount = 450;
  private particlePositions: Float32Array = new Float32Array(0);
  private particleColors: Float32Array = new Float32Array(0);
  private particleRadii: Float32Array = new Float32Array(0);
  private particleAngles: Float32Array = new Float32Array(0);
  private particleY: Float32Array = new Float32Array(0);
  private particleSpeeds: Float32Array = new Float32Array(0);

  // Interaction State
  private targetRotationX = 0.25;
  private targetRotationY = 0.0;
  private currentRotationX = 0.25;
  private currentRotationY = 0.0;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouseCoords: THREE.Vector2 = new THREE.Vector2(-999, -999);
  private hoveredStageIndex: number | null = null;

  // Stage Geometry Definitions
  private readonly stages: FunnelStageConfig[] = [
    {
      id: 'POTENTIAL_IDENTIFIED',
      name: 'Identified',
      yTop: 3.6,
      yBottom: 1.8,
      radiusTop: 3.4,
      radiusBottom: 2.7,
      colorHex: 0x6366f1, // Indigo
      emissiveHex: 0x4338ca,
    },
    {
      id: 'CLAIM_SUBMITTED',
      name: 'Submitted',
      yTop: 1.8,
      yBottom: 0.2,
      radiusTop: 2.7,
      radiusBottom: 2.0,
      colorHex: 0x0ea5e9, // Cyan
      emissiveHex: 0x0284c7,
    },
    {
      id: 'PROVIDER_PENDING',
      name: 'Pending',
      yTop: 0.2,
      yBottom: -1.4,
      radiusTop: 2.0,
      radiusBottom: 1.3,
      colorHex: 0xf59e0b, // Amber
      emissiveHex: 0xb45309,
    },
    {
      id: 'VERIFIED_RECOVERED',
      name: 'Recovered',
      yTop: -1.4,
      yBottom: -3.0,
      radiusTop: 1.3,
      radiusBottom: 0.85,
      colorHex: 0x10b981, // Emerald
      emissiveHex: 0x047857,
    },
  ];

  public init(container: HTMLElement, width: number, height: number): void {
    this.container = container;
    this.isDestroyed = false;

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // 2. Camera Setup
    const aspect = (width > 0 && height > 0) ? width / height : 1.2;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(0, 1.5, 12);
    this.camera.lookAt(0, 0.3, 0);

    // 3. Renderer Setup
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(Math.max(width, 10), Math.max(height, 10));
      this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(this.renderer.domElement);
    } catch (e) {
      console.warn('[FunnelScene] WebGLRenderer init failed:', e);
      return;
    }

    // 4. Lighting Rig
    this.setupLighting();

    // 5. Construct Visual Hierarchy
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.buildFunnelStages();
    this.buildJunctionRings();
    this.initParticleVortex();

    // 6. Start Loop
    this.clock.start();
    this.render();
  }

  private setupLighting(): void {
    if (!this.scene) return;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    keyLight.position.set(8, 12, 10);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x10b981, 1.0);
    fillLight.position.set(-8, -5, 5);
    this.scene.add(fillLight);
  }

  private buildFunnelStages(): void {
    if (!this.rootGroup) return;

    this.stageMeshes = [];

    this.stages.forEach((stage, idx) => {
      const height = stage.yTop - stage.yBottom;
      const centerY = stage.yBottom + height / 2;

      const geo = new THREE.CylinderGeometry(
        stage.radiusTop,
        stage.radiusBottom,
        height,
        36,
        1,
        true
      );

      const mat = new THREE.MeshPhysicalMaterial({
        color: stage.colorHex,
        emissive: stage.emissiveHex,
        emissiveIntensity: 0.25,
        roughness: 0.15,
        transmission: 0.65,
        thickness: 0.5,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = centerY;
      mesh.userData = { stageIndex: idx, config: stage };

      this.stageMeshes.push(mesh);
      this.rootGroup!.add(mesh);
    });
  }

  private buildJunctionRings(): void {
    if (!this.rootGroup) return;

    this.ringMeshes = [];

    const ringSpecs = [
      { y: 3.6, r: 3.4, color: 0x6366f1 },
      { y: 1.8, r: 2.7, color: 0x0ea5e9 },
      { y: 0.2, r: 2.0, color: 0xf59e0b },
      { y: -1.4, r: 1.3, color: 0x10b981 },
      { y: -3.0, r: 0.85, color: 0x34d399 },
    ];

    ringSpecs.forEach((spec) => {
      const geo = new THREE.TorusGeometry(spec.r, 0.045, 12, 48);
      geo.rotateX(Math.PI / 2);

      const mat = new THREE.MeshStandardMaterial({
        color: spec.color,
        emissive: spec.color,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = spec.y;
      this.ringMeshes.push(mesh);
      this.rootGroup!.add(mesh);
    });
  }

  private initParticleVortex(): void {
    if (!this.rootGroup) return;

    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleColors = new Float32Array(this.particleCount * 3);
    this.particleRadii = new Float32Array(this.particleCount);
    this.particleAngles = new Float32Array(this.particleCount);
    this.particleY = new Float32Array(this.particleCount);
    this.particleSpeeds = new Float32Array(this.particleCount);

    const yMin = -3.2;
    const yMax = 3.6;

    for (let i = 0; i < this.particleCount; i++) {
      const initY = yMin + Math.random() * (yMax - yMin);
      this.particleY[i] = initY;
      this.particleAngles[i] = Math.random() * Math.PI * 2;
      this.particleSpeeds[i] = 0.8 + Math.random() * 0.7;

      const r = this.getFunnelRadiusAtY(initY) * (0.88 + Math.random() * 0.2);
      this.particleRadii[i] = r;

      const x = Math.cos(this.particleAngles[i]) * r;
      const z = Math.sin(this.particleAngles[i]) * r;

      this.particlePositions[i * 3] = x;
      this.particlePositions[i * 3 + 1] = initY;
      this.particlePositions[i * 3 + 2] = z;

      const c = this.getStageColorAtY(initY);
      this.particleColors[i * 3] = c.r;
      this.particleColors[i * 3 + 1] = c.g;
      this.particleColors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    this.glowTexture = this.createParticleGlowTexture();

    const material = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      map: this.glowTexture || undefined,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlesMesh = new THREE.Points(geometry, material);
    this.rootGroup.add(this.particlesMesh);
  }

  private createParticleGlowTexture(): THREE.Texture | null {
    if (typeof document === 'undefined') return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (typeof ctx.createRadialGradient === 'function') {
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gradient.addColorStop(0.3, 'rgba(56, 189, 248, 0.8)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 32, 32);
        } else {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
          ctx.fillRect(8, 8, 16, 16);
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    } catch {
      return null;
    }
  }

  private getFunnelRadiusAtY(y: number): number {
    for (const stage of this.stages) {
      if (y >= stage.yBottom && y <= stage.yTop) {
        const t = (y - stage.yBottom) / (stage.yTop - stage.yBottom);
        return stage.radiusBottom + t * (stage.radiusTop - stage.radiusBottom);
      }
    }
    return 1.0;
  }

  private getStageColorAtY(y: number): THREE.Color {
    if (y >= 1.8) return new THREE.Color(0x6366f1); // Indigo
    if (y >= 0.2) return new THREE.Color(0x0ea5e9); // Cyan
    if (y >= -1.4) return new THREE.Color(0xf59e0b); // Amber
    return new THREE.Color(0x10b981);               // Emerald
  }

  public updateData(data?: RecoveryFunnelMetrics | RecoveryCase[] | any): void {
    if (this.isDestroyed || !data) return;

    let identified = 12;
    let submitted = 7;
    let pending = 4;
    let recovered = 2;

    if (Array.isArray(data)) {
      identified = data.length;
      submitted = data.filter((c) => c && c.status !== 'POTENTIAL_IDENTIFIED').length;
      pending = data.filter((c) => c && (c.status === 'PROVIDER_PENDING' || c.status === 'VERIFIED_RECOVERED')).length;
      recovered = data.filter((c) => c && c.status === 'VERIFIED_RECOVERED').length;
    } else if (typeof data === 'object') {
      if ('identifiedCount' in data) {
        identified = data.identifiedCount || 12;
        submitted = data.submittedCount || 7;
        pending = data.pendingCount || 4;
        recovered = data.recoveredCount || 2;
      } else if ('identifiedAmount' in data) {
        identified = data.identifiedAmount || 12;
        submitted = data.submittedAmount || 7;
        pending = data.pendingAmount || 4;
        recovered = data.recoveredAmount || 2;
      }
    }

    // Dynamic scale expansion for Recovered stage when conversions increase
    const recoveredRatio = identified > 0 ? (recovered / identified) : 0.2;
    const stage4Mesh = this.stageMeshes[3];
    if (stage4Mesh) {
      const targetScale = 1.0 + recoveredRatio * 0.35;
      stage4Mesh.scale.set(targetScale, 1.0, targetScale);
      const mat = stage4Mesh.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = 0.25 + recoveredRatio * 0.5;
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
    this.targetRotationY = clampedX * 0.5;
    this.targetRotationX = 0.25 - clampedY * 0.25;

    // Raycast against funnel stages to highlight hovered tier
    if (this.camera && this.stageMeshes.length > 0) {
      this.raycaster.setFromCamera(this.mouseCoords, this.camera);
      const intersects = this.raycaster.intersectObjects(this.stageMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const stageIdx = hitMesh.userData?.stageIndex;
        this.hoveredStageIndex = typeof stageIdx === 'number' ? stageIdx : null;
      } else {
        this.hoveredStageIndex = null;
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

    // 1. Smoothly interpolate rotation
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.06;
    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.06;

    if (this.rootGroup) {
      this.rootGroup.rotation.x = this.currentRotationX;
      // Ambient slow spin + pointer offset
      this.rootGroup.rotation.y = this.currentRotationY + elapsedTime * 0.12;
    }

    // 2. Animate Downward Particle Vortex
    if (this.particlesMesh) {
      const posAttr = this.particlesMesh.geometry.attributes.position as THREE.BufferAttribute;
      const colorAttr = this.particlesMesh.geometry.attributes.color as THREE.BufferAttribute;
      const yMin = -3.2;
      const yMax = 3.6;

      for (let i = 0; i < this.particleCount; i++) {
        // Fall downward
        this.particleY[i] -= this.particleSpeeds[i] * delta * 1.35;

        // Reset to top if dropped past exit
        if (this.particleY[i] < yMin) {
          this.particleY[i] = yMax;
          this.particleAngles[i] = Math.random() * Math.PI * 2;
        }

        const curY = this.particleY[i];
        const baseRadius = this.getFunnelRadiusAtY(curY);

        // Accelerate spin as radius shrinks (vortex conservation)
        const angularVelocity = 1.8 / Math.max(0.5, baseRadius);
        this.particleAngles[i] += angularVelocity * delta;

        const x = Math.cos(this.particleAngles[i]) * (baseRadius * 0.95);
        const z = Math.sin(this.particleAngles[i]) * (baseRadius * 0.95);

        posAttr.setXYZ(i, x, curY, z);

        // Update color
        const c = this.getStageColorAtY(curY);
        colorAttr.setXYZ(i, c.r, c.g, c.b);
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    }

    // 3. Stage Hover Highlighting
    this.stageMeshes.forEach((mesh, idx) => {
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      const isHovered = this.hoveredStageIndex === idx;
      const targetEmissive = isHovered ? 0.75 : 0.25;
      const targetOpacity = isHovered ? 0.85 : 0.65;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.1;
      mat.opacity += (targetOpacity - mat.opacity) * 0.1;
    });

    // 4. Ring Pulses
    this.ringMeshes.forEach((ring, idx) => {
      const mat = ring.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.75 + Math.sin(elapsedTime * 3.0 + idx) * 0.25;
    });

    // 5. Render Frame with headless JSDOM guard
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

    if (this.glowTexture) {
      this.glowTexture.dispose();
      this.glowTexture = null;
    }

    this.renderer = null;
    this.camera = null;
    this.rootGroup = null;
    this.stageMeshes = [];
    this.ringMeshes = [];
    this.particlesMesh = null;
    this.container = null;
  }
}
