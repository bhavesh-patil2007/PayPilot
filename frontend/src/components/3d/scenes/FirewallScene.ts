/**
 * FirewallScene.ts
 * 
 * Production-ready Three.js 0.170.0 scene controller for the Commitment Firewall.
 * Renders an animated 3D holographic force-field shield reacting dynamically to
 * risk viability scores and breach states (APPROVED_SAFE, WARNING_BUFFER_TIGHT,
 * CRITICAL_BUFFER_BREACH) with concentric gyroscopic rings, defensive particle swarm,
 * shockwave pulse rings, and interactive NDC pointer deflection.
 */

import * as THREE from 'three';
import {
  ThreeSceneController,
  CommitmentFirewallStatus,
  FirewallEvaluationResult,
} from '../../../types';
import { disposeThreeScene } from '../utils/threeDisposal';

export interface FirewallSceneData {
  status?: CommitmentFirewallStatus;
  safe?: boolean;
  orderAmount?: number;
  lowestProjectedBuffer?: number;
}

export class FirewallScene implements ThreeSceneController<FirewallSceneData | FirewallEvaluationResult | CommitmentFirewallStatus | any> {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private animFrameId: number | null = null;
  private isDestroyed: boolean = false;

  // Visual Meshes & Groups
  private rootGroup: THREE.Group | null = null;
  private innerCoreMesh: THREE.Mesh | null = null;
  private outerShellMesh: THREE.Mesh | null = null;
  private gimbalRing1: THREE.Mesh | null = null;
  private gimbalRing2: THREE.Mesh | null = null;
  private gimbalRing3: THREE.Mesh | null = null;
  private particleSwarm: THREE.Points | null = null;
  private shockwaveRing: THREE.Mesh | null = null;

  // Particle Swarm Data
  private readonly particleCount = 300;
  private basePositions: Float32Array = new Float32Array(0);

  // Dynamic Risk State
  private currentStatus: CommitmentFirewallStatus = 'APPROVED_SAFE';
  private targetColor: THREE.Color = new THREE.Color(0x06b6d4); // Cyan
  private activeColor: THREE.Color = new THREE.Color(0x06b6d4);
  private pulseFrequency = 1.0; // Hz
  private ringSpeedMultiplier = 1.0;

  // Interaction State
  private targetTiltX = 0;
  private targetTiltY = 0;
  private currentTiltX = 0;
  private currentTiltY = 0;
  private shockwaveProgress = 0; // 0 to 1

  public init(container: HTMLElement, width: number, height: number): void {
    this.container = container;
    this.isDestroyed = false;

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // 2. Camera Setup
    const aspect = (width > 0 && height > 0) ? width / height : 1.2;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 9.5);
    this.camera.lookAt(0, 0, 0);

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
      this.renderer.toneMappingExposure = 1.25;

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(this.renderer.domElement);
    } catch (e) {
      console.warn('[FirewallScene] WebGLRenderer init failed:', e);
      return;
    }

    // 4. Lighting Rig
    this.setupLighting();

    // 5. Construct Visuals
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.buildCoreShield();
    this.buildGimbalRings();
    this.buildParticleSwarm();
    this.buildShockwaveRing();

    // 6. Start Loop
    this.clock.start();
    this.render();
  }

  private setupLighting(): void {
    if (!this.scene) return;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0x06b6d4, 2.5, 20);
    keyLight.position.set(5, 5, 5);
    keyLight.name = 'keyPointLight';
    this.scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x10b981, 2.0, 20);
    rimLight.position.set(-5, -5, -5);
    rimLight.name = 'rimPointLight';
    this.scene.add(rimLight);
  }

  private buildCoreShield(): void {
    if (!this.rootGroup) return;

    // 1. Inner Solid Core (Icosahedron)
    const innerGeo = new THREE.IcosahedronGeometry(1.5, 2);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    this.innerCoreMesh = new THREE.Mesh(innerGeo, innerMat);
    this.rootGroup.add(this.innerCoreMesh);

    // 2. Outer Geodesic Hexagonal Lattice Shell
    const outerGeo = new THREE.IcosahedronGeometry(2.1, 3);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    this.outerShellMesh = new THREE.Mesh(outerGeo, outerMat);
    this.rootGroup.add(this.outerShellMesh);
  }

  private buildGimbalRings(): void {
    if (!this.rootGroup) return;

    // Ring 1 (Inner Gimbal)
    const geo1 = new THREE.TorusGeometry(2.6, 0.035, 12, 64);
    const mat1 = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.gimbalRing1 = new THREE.Mesh(geo1, mat1);
    this.rootGroup.add(this.gimbalRing1);

    // Ring 2 (Middle Gimbal)
    const geo2 = new THREE.TorusGeometry(3.05, 0.04, 12, 64);
    const mat2 = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.gimbalRing2 = new THREE.Mesh(geo2, mat2);
    this.gimbalRing2.rotation.x = Math.PI / 3;
    this.rootGroup.add(this.gimbalRing2);

    // Ring 3 (Outer Gimbal)
    const geo3 = new THREE.TorusGeometry(3.5, 0.045, 12, 64);
    const mat3 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.gimbalRing3 = new THREE.Mesh(geo3, mat3);
    this.gimbalRing3.rotation.y = Math.PI / 4;
    this.rootGroup.add(this.gimbalRing3);
  }

  private buildParticleSwarm(): void {
    if (!this.rootGroup) return;

    this.basePositions = new Float32Array(this.particleCount * 3);
    const dynamicPositions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    // Distribute particles along spherical Fibonacci lattice on radius 2.3
    const radius = 2.3;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < this.particleCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / this.particleCount);

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      this.basePositions[i * 3] = x;
      this.basePositions[i * 3 + 1] = y;
      this.basePositions[i * 3 + 2] = z;

      dynamicPositions[i * 3] = x;
      dynamicPositions[i * 3 + 1] = y;
      dynamicPositions[i * 3 + 2] = z;

      colors[i * 3] = 0.02;
      colors[i * 3 + 1] = 0.75;
      colors[i * 3 + 2] = 0.95;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(dynamicPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particleSwarm = new THREE.Points(geo, mat);
    this.rootGroup.add(this.particleSwarm);
  }

  private buildShockwaveRing(): void {
    if (!this.rootGroup) return;

    const geo = new THREE.RingGeometry(1.5, 1.6, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    this.shockwaveRing = new THREE.Mesh(geo, mat);
    this.shockwaveRing.visible = false;
    this.rootGroup.add(this.shockwaveRing);
  }

  public updateData(data?: FirewallSceneData | FirewallEvaluationResult | CommitmentFirewallStatus | any): void {
    if (this.isDestroyed || !data) return;

    let status: CommitmentFirewallStatus = 'APPROVED_SAFE';

    if (typeof data === 'string') {
      status = data as CommitmentFirewallStatus;
    } else if (typeof data === 'object') {
      if (data.status) {
        status = data.status;
      } else if (data.safe === false) {
        status = 'CRITICAL_BUFFER_BREACH';
      } else if (data.safe === true) {
        status = 'APPROVED_SAFE';
      }
    }

    this.currentStatus = status;

    // Modulate visual parameters based on firewall state
    if (status === 'APPROVED_SAFE') {
      this.targetColor.set(0x06b6d4); // Cyan / Emerald
      this.pulseFrequency = 1.0;
      this.ringSpeedMultiplier = 1.0;
      if (this.shockwaveRing) this.shockwaveRing.visible = false;
    } else if (status === 'WARNING_BUFFER_TIGHT') {
      this.targetColor.set(0xf59e0b); // Amber Gold
      this.pulseFrequency = 2.5;
      this.ringSpeedMultiplier = 2.2;
      if (this.shockwaveRing) this.shockwaveRing.visible = false;
    } else if (status === 'CRITICAL_BUFFER_BREACH') {
      this.targetColor.set(0xef4444); // Crimson Alert
      this.pulseFrequency = 5.0;
      this.ringSpeedMultiplier = 4.5;
      if (this.shockwaveRing) this.shockwaveRing.visible = true;
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
    this.targetTiltY = clampedX * 0.4;
    this.targetTiltX = -clampedY * 0.4;
  }

  public onPointerClick(normalizedX: number, normalizedY: number): void {
    this.onPointerMove(normalizedX, normalizedY);
    // Trigger momentary shockwave pulse on user interaction
    this.shockwaveProgress = 0.01;
    if (this.shockwaveRing) this.shockwaveRing.visible = true;
  }

  private render = (): void => {
    if (this.isDestroyed || !this.renderer || !this.scene || !this.camera) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Smoothly interpolate color state
    this.activeColor.lerp(this.targetColor, 0.08);

    // Update Core Material
    if (this.innerCoreMesh) {
      const mat = this.innerCoreMesh.material as THREE.MeshStandardMaterial;
      mat.color.copy(this.activeColor);
      mat.emissive.copy(this.activeColor);

      // Pulse Scale & Glow
      const pulse = 1.0 + Math.sin(elapsedTime * this.pulseFrequency * Math.PI * 2) * 0.06;
      this.innerCoreMesh.scale.set(pulse, pulse, pulse);
      mat.emissiveIntensity = 0.5 + Math.sin(elapsedTime * this.pulseFrequency * Math.PI * 2) * 0.35;
    }

    // Update Outer Shell
    if (this.outerShellMesh) {
      const mat = this.outerShellMesh.material as THREE.MeshBasicMaterial;
      mat.color.copy(this.activeColor);
      this.outerShellMesh.rotation.y += delta * 0.25;
      this.outerShellMesh.rotation.x += delta * 0.15;
    }

    // 2. Animate Gyroscopic Rings
    const rSpeed = delta * this.ringSpeedMultiplier;
    if (this.gimbalRing1) {
      this.gimbalRing1.rotation.x += rSpeed * 0.6;
      this.gimbalRing1.rotation.y += rSpeed * 0.8;
      (this.gimbalRing1.material as THREE.MeshStandardMaterial).emissive.copy(this.activeColor);
    }
    if (this.gimbalRing2) {
      this.gimbalRing2.rotation.y += rSpeed * 0.7;
      this.gimbalRing2.rotation.z += rSpeed * 0.5;
      (this.gimbalRing2.material as THREE.MeshStandardMaterial).emissive.copy(this.activeColor);
    }
    if (this.gimbalRing3) {
      this.gimbalRing3.rotation.x += rSpeed * 0.4;
      this.gimbalRing3.rotation.z += rSpeed * 0.9;
      (this.gimbalRing3.material as THREE.MeshStandardMaterial).emissive.copy(this.activeColor);
    }

    // 3. Animate Particle Swarm (breathing radial displacement)
    if (this.particleSwarm) {
      const posAttr = this.particleSwarm.geometry.attributes.position as THREE.BufferAttribute;
      const colorAttr = this.particleSwarm.geometry.attributes.color as THREE.BufferAttribute;
      const radialPulse = 1.0 + Math.sin(elapsedTime * this.pulseFrequency * Math.PI * 2) * 0.08;

      for (let i = 0; i < this.particleCount; i++) {
        const bx = this.basePositions[i * 3];
        const by = this.basePositions[i * 3 + 1];
        const bz = this.basePositions[i * 3 + 2];

        posAttr.setXYZ(i, bx * radialPulse, by * radialPulse, bz * radialPulse);
        colorAttr.setXYZ(i, this.activeColor.r, this.activeColor.g, this.activeColor.b);
      }
      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      this.particleSwarm.rotation.y -= delta * 0.15;
    }

    // 4. Animate Shockwave Rings (for Critical breach or click deflection)
    if (this.shockwaveRing && (this.shockwaveRing.visible || this.currentStatus === 'CRITICAL_BUFFER_BREACH')) {
      if (this.currentStatus === 'CRITICAL_BUFFER_BREACH') {
        const wave = (elapsedTime * 1.5) % 1.0; // 0..1 loop
        const s = 1.0 + wave * 2.5;
        this.shockwaveRing.scale.set(s, s, s);
        (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1.0 - wave) * 0.6);
        (this.shockwaveRing.material as THREE.MeshBasicMaterial).color.copy(this.activeColor);
      } else if (this.shockwaveProgress > 0) {
        this.shockwaveProgress += delta * 1.8;
        if (this.shockwaveProgress >= 1.0) {
          this.shockwaveProgress = 0;
          this.shockwaveRing.visible = false;
        } else {
          const s = 1.0 + this.shockwaveProgress * 2.5;
          this.shockwaveRing.scale.set(s, s, s);
          (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = (1.0 - this.shockwaveProgress) * 0.7;
          (this.shockwaveRing.material as THREE.MeshBasicMaterial).color.copy(this.activeColor);
        }
      }
    }

    // 5. Update Lights
    const keyPoint = this.scene.getObjectByName('keyPointLight') as THREE.PointLight;
    if (keyPoint) keyPoint.color.copy(this.activeColor);

    // 6. Smooth Tilt Toward Pointer
    this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.08;
    this.currentTiltY += (this.targetTiltY - this.currentTiltY) * 0.08;

    if (this.rootGroup) {
      this.rootGroup.rotation.x = this.currentTiltX;
      this.rootGroup.rotation.y = this.currentTiltY;
    }

    // 7. Render Frame with headless JSDOM guard
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
    this.innerCoreMesh = null;
    this.outerShellMesh = null;
    this.gimbalRing1 = null;
    this.gimbalRing2 = null;
    this.gimbalRing3 = null;
    this.particleSwarm = null;
    this.shockwaveRing = null;
    this.container = null;
  }
}
