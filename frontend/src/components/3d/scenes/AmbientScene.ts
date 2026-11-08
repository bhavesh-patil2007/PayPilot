/**
 * AmbientScene.ts
 *
 * Production-ready Three.js 0.170.0 Scene Controller for PayPilot Ambient Background.
 * Renders an ultra-lightweight, 60fps floating constellation/plexus particle background
 * behind dark obsidian cards. Features bounded line segments, distance-based alpha
 * fading, normalized mouse repulsion physics, and zero-allocation frame updates.
 */

import * as THREE from 'three';
import type { ThreeSceneController } from '../../../types';
import { disposeThreeScene } from '../utils/threeDisposal';

export interface AmbientSceneOptions {
  particleCount?: number;
  maxDistance?: number;
  baseSpeed?: number;
  colorTheme?: 'fintech' | 'cyan' | 'emerald' | 'amber';
  opacity?: number;
  particleDensity?: 'sparse' | 'normal' | 'dense';
}

function createSoftParticleTexture(size = 64): THREE.Texture | null {
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
      grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
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

interface AmbientParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  originColor: THREE.Color;
}

export class AmbientScene implements ThreeSceneController<AmbientSceneOptions> {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private animFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private isDestroyed: boolean = false;

  private particleTexture: THREE.Texture | null = null;
  private particles: AmbientParticle[] = [];

  // Primitives
  private pointsMesh: THREE.Points | null = null;
  private linesMesh: THREE.LineSegments | null = null;

  // Pre-allocated Line Buffer Attributes
  private maxLines = 650;
  private linePosBuffer: Float32Array = new Float32Array(this.maxLines * 2 * 3);
  private lineColBuffer: Float32Array = new Float32Array(this.maxLines * 2 * 3);

  // Configuration
  private options: Required<Omit<AmbientSceneOptions, 'particleDensity'>> = {
    particleCount: 220,
    maxDistance: 4.2,
    baseSpeed: 0.35,
    colorTheme: 'fintech',
    opacity: 0.38,
  };

  // Bounds
  private boundX = 22.0;
  private boundY = 14.0;
  private boundZ = 8.0;

  // Pointer Interaction
  private mouseWorld: THREE.Vector3 = new THREE.Vector3(999, 999, 0);
  private pointerNormalized = { x: 0, y: 0 };
  private isHovering = false;

  public init(container: HTMLElement, width: number, height: number): void {
    this.container = container;
    this.isDestroyed = false;

    const w = width > 0 ? width : container.clientWidth || 600;
    const h = height > 0 ? height : container.clientHeight || 400;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 20);
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
      console.warn('[AmbientScene] WebGLRenderer init failed:', e);
      return;
    }

    this.particleTexture = createSoftParticleTexture(64);

    this.buildParticles();
    this.clock.start();
    this.animate();
  }

  private getThemePalette(): THREE.Color[] {
    switch (this.options.colorTheme) {
      case 'cyan':
        return [new THREE.Color(0x00cfe8), new THREE.Color(0x38bdf8), new THREE.Color(0x0079c1)];
      case 'emerald':
        return [new THREE.Color(0x10b981), new THREE.Color(0x34d399), new THREE.Color(0x059669)];
      case 'amber':
        return [new THREE.Color(0xf59e0b), new THREE.Color(0xfbbf24), new THREE.Color(0xd97706)];
      case 'fintech':
      default:
        return [
          new THREE.Color(0x0079c1), // PayPal Blue
          new THREE.Color(0x00cfe8), // Electric Cyan
          new THREE.Color(0x10b981), // Fintech Emerald
          new THREE.Color(0x6366f1), // Indigo
        ];
    }
  }

  private buildParticles(): void {
    if (!this.scene) return;

    if (this.pointsMesh) {
      this.pointsMesh.geometry.dispose();
      (this.pointsMesh.material as THREE.Material).dispose();
      this.scene.remove(this.pointsMesh);
      this.pointsMesh = null;
    }
    if (this.linesMesh) {
      this.linesMesh.geometry.dispose();
      (this.linesMesh.material as THREE.Material).dispose();
      this.scene.remove(this.linesMesh);
      this.linesMesh = null;
    }

    const n = this.options.particleCount;
    this.particles = [];
    const palette = this.getThemePalette();

    const posArray = new Float32Array(n * 3);
    const colArray = new Float32Array(n * 3);

    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * this.boundX * 2;
      const y = (Math.random() - 0.5) * this.boundY * 2;
      const z = (Math.random() - 0.5) * this.boundZ * 2;

      const speed = this.options.baseSpeed;
      const vx = (Math.random() - 0.5) * speed;
      const vy = (Math.random() - 0.5) * speed;
      const vz = (Math.random() - 0.5) * speed * 0.5;

      const col = palette[i % palette.length].clone();

      this.particles.push({ x, y, z, vx, vy, vz, originColor: col });

      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      colArray[i * 3] = col.r;
      colArray[i * 3 + 1] = col.g;
      colArray[i * 3 + 2] = col.b;
    }

    // Points
    const ptGeom = new THREE.BufferGeometry();
    ptGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    ptGeom.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

    const ptMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: this.options.opacity * 1.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.particleTexture || undefined,
    });
    this.pointsMesh = new THREE.Points(ptGeom, ptMat);
    this.scene.add(this.pointsMesh);

    // Dynamic Line Segments
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(this.linePosBuffer, 3));
    lineGeom.setAttribute('color', new THREE.BufferAttribute(this.lineColBuffer, 3));
    lineGeom.setDrawRange(0, 0);

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: this.options.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.linesMesh = new THREE.LineSegments(lineGeom, lineMat);
    this.scene.add(this.linesMesh);
  }

  public updateData(data?: AmbientSceneOptions | any): void {
    if (this.isDestroyed) return;
    if (data) {
      if (data.particleCount !== undefined) {
        this.options.particleCount = Math.max(50, Math.min(400, data.particleCount));
      } else if (data.particleDensity === 'dense') {
        this.options.particleCount = 320;
      } else if (data.particleDensity === 'sparse') {
        this.options.particleCount = 120;
      }
      if (data.maxDistance !== undefined) this.options.maxDistance = data.maxDistance;
      if (data.baseSpeed !== undefined) this.options.baseSpeed = data.baseSpeed;
      if (data.colorTheme !== undefined) this.options.colorTheme = data.colorTheme;
      if (data.opacity !== undefined) this.options.opacity = data.opacity;
    }
    this.buildParticles();
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
    this.pointerNormalized.x = clampedX;
    this.pointerNormalized.y = clampedY;
    this.isHovering = true;

    // Approximate world coordinate on Z=0 plane
    this.mouseWorld.set(clampedX * 18.0, clampedY * 11.0, 0);
  }

  private animate = (): void => {
    if (this.isDestroyed || !this.renderer || !this.scene || !this.camera || !this.pointsMesh || !this.linesMesh) return;

    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    const n = this.particles.length;
    const ptPosAttr = this.pointsMesh.geometry.getAttribute('position') as THREE.BufferAttribute;

    const repulsionRadius = 5.5;
    const maxD = this.options.maxDistance;
    const maxDSq = maxD * maxD;

    // 1. Update Particle Positions & Handle Mouse Repulsion
    for (let i = 0; i < n; i++) {
      const p = this.particles[i];

      // Move by velocity
      p.x += p.vx * delta * 60;
      p.y += p.vy * delta * 60;
      p.z += p.vz * delta * 60;

      // Mouse repulsion
      if (this.isHovering) {
        const dx = p.x - this.mouseWorld.x;
        const dy = p.y - this.mouseWorld.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < repulsionRadius * repulsionRadius && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / repulsionRadius) * 0.12;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      }

      // Boundary Wrap
      if (p.x > this.boundX) p.x = -this.boundX;
      else if (p.x < -this.boundX) p.x = this.boundX;

      if (p.y > this.boundY) p.y = -this.boundY;
      else if (p.y < -this.boundY) p.y = this.boundY;

      if (p.z > this.boundZ) p.z = -this.boundZ;
      else if (p.z < -this.boundZ) p.z = this.boundZ;

      ptPosAttr.setXYZ(i, p.x, p.y, p.z);
    }
    ptPosAttr.needsUpdate = true;

    // 2. Build Plexus Connections with strict line budget
    let lineIdx = 0;
    const posBuf = this.linePosBuffer;
    const colBuf = this.lineColBuffer;

    for (let i = 0; i < n && lineIdx < this.maxLines; i++) {
      const p1 = this.particles[i];
      let connections = 0;

      for (let j = i + 1; j < n && lineIdx < this.maxLines; j++) {
        if (connections >= 3) break; // Max 3 links per particle

        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        const dSq = dx * dx + dy * dy + dz * dz;

        if (dSq < maxDSq) {
          const dist = Math.sqrt(dSq);
          const alpha = Math.max(0, 1 - dist / maxD);

          const ptr = lineIdx * 6;

          // Vertex 1
          posBuf[ptr] = p1.x;
          posBuf[ptr + 1] = p1.y;
          posBuf[ptr + 2] = p1.z;

          colBuf[ptr] = p1.originColor.r * alpha;
          colBuf[ptr + 1] = p1.originColor.g * alpha;
          colBuf[ptr + 2] = p1.originColor.b * alpha;

          // Vertex 2
          posBuf[ptr + 3] = p2.x;
          posBuf[ptr + 4] = p2.y;
          posBuf[ptr + 5] = p2.z;

          colBuf[ptr + 3] = p2.originColor.r * alpha;
          colBuf[ptr + 4] = p2.originColor.g * alpha;
          colBuf[ptr + 5] = p2.originColor.b * alpha;

          lineIdx++;
          connections++;
        }
      }
    }

    const lineGeom = this.linesMesh.geometry;
    (lineGeom.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (lineGeom.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    lineGeom.setDrawRange(0, lineIdx * 2);

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

    if (this.particleTexture) {
      this.particleTexture.dispose();
      this.particleTexture = null;
    }

    this.renderer = null;
    this.camera = null;
    this.pointsMesh = null;
    this.linesMesh = null;
    this.particles = [];
    this.container = null;
  }
}
