/**
 * frontend/src/test/challenger_m2_it2_verification.test.ts
 *
 * Empirical Adversarial Challenger Verification Suite (Milestone 2 Iteration 2):
 * Verifies WebGL lifecycle stability, camera projection matrix resilience
 * against non-finite dimensions, and resource disposal in NodeGraphScene and GlobeScene.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  GlobeScene,
  MoneyMapScene,
  AmbientScene,
  TerrainScene,
  FunnelScene,
  FirewallScene,
  NodeGraphScene,
  DigitalTwinScene,
  SceneType,
} from '../components/3d/scenes';
import {
  SEED_TRANSIT_ARCS,
  SEED_TRUTH_GRAPH_DATA,
  SEED_DIGITAL_TWIN_METRICS,
  SEED_RECOVERY_CASES,
  generateInitialDailyProjections,
} from '../store/demoSeedData';
import type { MonetaryTransitArc, TruthGraphData } from '../types';

// Polyfill WebGL context in JSDOM if not already done
if (typeof HTMLCanvasElement !== 'undefined') {
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (contextId: string, ...args: any[]): any {
    if (contextId === 'webgl' || contextId === 'webgl2') {
      const gl = {
        VERSION: 0x1f02,
        SHADING_LANGUAGE_VERSION: 0x8b8c,
        VENDOR: 0x1f00,
        RENDERER: 0x1f01,
        MAX_VERTEX_ATTRIBS: 0x8869,
        MAX_VARYING_VECTORS: 0x8dfd,
        MAX_VERTEX_UNIFORM_VECTORS: 0x8dfc,
        MAX_FRAGMENT_UNIFORM_VECTORS: 0x8dfb,
        MAX_TEXTURE_IMAGE_UNITS: 0x8871,
        MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8872,
        MAX_TEXTURE_SIZE: 0x0d33,
        MAX_CUBE_MAP_TEXTURE_SIZE: 0x851c,
        MAX_RENDERBUFFER_SIZE: 0x84e8,
        SCISSOR_BOX: 0x0c10,
        VIEWPORT: 0x0ba2,
        COLOR_BUFFER_BIT: 0x00004000,
        DEPTH_BUFFER_BIT: 0x00000100,
        STENCIL_BUFFER_BIT: 0x00000400,
        TEXTURE_2D: 0x0de1,
        TEXTURE_CUBE_MAP: 0x8513,
        TEXTURE_BINDING_2D: 0x8069,
        TEXTURE_BINDING_CUBE_MAP: 0x806a,
        RGBA: 0x1908,
        UNSIGNED_BYTE: 0x1401,
        FRAMEBUFFER: 0x8d40,
        RENDERBUFFER: 0x8d41,

        getParameter: (param: any) => {
          if (param === 0x1f02 || param === 7938 || param === undefined) return 'WebGL 2.0';
          if (param === 0x8b8c || param === 35724) return 'WebGL GLSL ES 3.00';
          if (param === 0x1f00 || param === 7936) return 'WebKit';
          if (param === 0x1f01 || param === 7937) return 'WebKit WebGL';
          if (param === 0x0c10 || param === 0x0ba2 || param === 3088 || param === 2978) {
            return new Int32Array([0, 0, 800, 600]);
          }
          if (param === 0x8869 || param === 0x8872 || param === 0x8b4c || param === 0x8871) return 16;
          if (param === 0x8dfb || param === 0x8dfc) return 1024;
          if (param === 0x8dfd) return 8;
          if (param === 0x0d33 || param === 0x851c || param === 0x84e8) return 16384;
          return 0;
        },
        getExtension: (name: string) => {
          if (name === 'WEBGL_lose_context') {
            return {
              loseContext: () => {},
              restoreContext: () => {},
            };
          }
          return null;
        },
        getContextAttributes: () => ({ xrCompatible: false, alpha: true, antialias: true, depth: true, stencil: true }),
        getShaderPrecisionFormat: () => ({ rangeMin: 1, rangeMax: 1, precision: 1 }),
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        getShaderParameter: () => true,
        getShaderInfoLog: () => '',
        createProgram: () => ({}),
        attachShader: () => {},
        linkProgram: () => {},
        getProgramParameter: () => true,
        getProgramInfoLog: () => '',
        useProgram: () => {},
        deleteProgram: () => {},
        deleteShader: () => {},
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        bufferSubData: () => {},
        deleteBuffer: () => {},
        createTexture: () => ({}),
        bindTexture: () => {},
        texParameteri: () => {},
        texImage2D: () => {},
        texImage3D: () => {},
        deleteTexture: () => {},
        createFramebuffer: () => ({}),
        bindFramebuffer: () => {},
        framebufferTexture2D: () => {},
        deleteFramebuffer: () => {},
        createRenderbuffer: () => ({}),
        bindRenderbuffer: () => {},
        renderbufferStorage: () => {},
        deleteRenderbuffer: () => {},
        checkFramebufferStatus: () => 36053,
        activeTexture: () => {},
        pixelStorei: () => {},
        generateMipmap: () => {},
        enable: () => {},
        disable: () => {},
        clear: () => {},
        clearColor: () => {},
        clearDepth: () => {},
        clearStencil: () => {},
        colorMask: () => {},
        depthMask: () => {},
        depthFunc: () => {},
        cullFace: () => {},
        frontFace: () => {},
        blendFunc: () => {},
        blendFuncSeparate: () => {},
        blendEquation: () => {},
        blendEquationSeparate: () => {},
        viewport: () => {},
        scissor: () => {},
        stencilMask: () => {},
        stencilFunc: () => {},
        stencilOp: () => {},
        drawArrays: () => {},
        drawElements: () => {},
        getUniformLocation: () => ({}),
        getAttribLocation: () => 0,
        enableVertexAttribArray: () => {},
        disableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        uniform1i: () => {},
        uniform1f: () => {},
        uniform2f: () => {},
        uniform3f: () => {},
        uniform4f: () => {},
        uniform1fv: () => {},
        uniform2fv: () => {},
        uniform3fv: () => {},
        uniform4fv: () => {},
        uniformMatrix3fv: () => {},
        uniformMatrix4fv: () => {},
      };
      return gl;
    }
    return origGetContext ? (origGetContext as any).apply(this, [contextId, ...args]) : null;
  };
}

function createMockContainer(width = 800, height = 600): HTMLDivElement {
  const div = document.createElement('div');
  Object.defineProperty(div, 'clientWidth', { value: width, configurable: true });
  Object.defineProperty(div, 'clientHeight', { value: height, configurable: true });
  div.getBoundingClientRect = () => ({
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
  document.body.appendChild(div);
  return div;
}

const ALL_8_SCENES = [
  { type: 'globe' as SceneType, name: 'GlobeScene', SceneClass: GlobeScene },
  { type: 'money-map' as SceneType, name: 'MoneyMapScene', SceneClass: MoneyMapScene },
  { type: 'ambient' as SceneType, name: 'AmbientScene', SceneClass: AmbientScene },
  { type: 'terrain' as SceneType, name: 'TerrainScene', SceneClass: TerrainScene },
  { type: 'funnel' as SceneType, name: 'FunnelScene', SceneClass: FunnelScene },
  { type: 'firewall' as SceneType, name: 'FirewallScene', SceneClass: FirewallScene },
  { type: 'node-graph' as SceneType, name: 'NodeGraphScene', SceneClass: NodeGraphScene },
  { type: 'digital-twin' as SceneType, name: 'DigitalTwinScene', SceneClass: DigitalTwinScene },
];

describe('Challenger M2-IT2: Empirical Adversarial Lifecycle & Memory Verification', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = createMockContainer(800, 600);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  // =========================================================================
  // TASK 1: Camera Projection Matrix Resilience Against Non-Finite Inputs
  // =========================================================================
  describe('Task 1: Camera Aspect & Projection Matrix Protection across All 8 Scenes', () => {
    const nonFiniteTestCases = [
      { label: 'NaN width & height', w: NaN, h: NaN },
      { label: 'NaN width, finite height', w: NaN, h: 600 },
      { label: 'finite width, NaN height', w: 800, h: NaN },
      { label: '+Infinity width & height', w: Infinity, h: Infinity },
      { label: '+Infinity width, finite height', w: Infinity, h: 600 },
      { label: 'finite width, +Infinity height', w: 800, h: Infinity },
      { label: '-Infinity width & height', w: -Infinity, h: -Infinity },
      { label: '-Infinity width, finite height', w: -Infinity, h: 600 },
      { label: 'finite width, -Infinity height', w: 800, h: -Infinity },
      { label: 'Zero dimensions (0, 0)', w: 0, h: 0 },
      { label: 'Negative dimensions (-800, -600)', w: -800, h: -600 },
      { label: 'Negative width, positive height (-100, 600)', w: -100, h: 600 },
      { label: 'Positive width, negative height (800, -100)', w: 800, h: -100 },
      { label: 'Mixed NaN and Infinity (NaN, Infinity)', w: NaN, h: Infinity },
      { label: 'Mixed -Infinity and NaN (-Infinity, NaN)', w: -Infinity, h: NaN },
    ];

    ALL_8_SCENES.forEach(({ name, SceneClass }) => {
      it(`[${name}] preserves camera aspect and projection matrix under all non-finite and invalid resize inputs`, () => {
        const scene = new SceneClass();
        scene.init(container, 800, 600);

        const camera = (scene as any).camera as THREE.PerspectiveCamera;
        expect(camera).toBeDefined();

        const initialAspect = camera.aspect;
        const initialMatrixElements = [...camera.projectionMatrix.elements];

        expect(Number.isFinite(initialAspect)).toBe(true);
        expect(initialAspect).toBeGreaterThan(0);
        initialMatrixElements.forEach((val) => {
          expect(Number.isFinite(val)).toBe(true);
        });

        // Test every non-finite edge case
        for (const tc of nonFiniteTestCases) {
          expect(() => scene.resize(tc.w, tc.h)).not.toThrow();

          // Camera aspect must be strictly finite, positive, and unchanged
          expect(Number.isFinite(camera.aspect), `${name} aspect should be finite after ${tc.label}`).toBe(true);
          expect(camera.aspect, `${name} aspect should match initial after ${tc.label}`).toBe(initialAspect);

          // Camera projection matrix must contain zero NaN or Infinity elements
          const matrixElements = Array.from(camera.projectionMatrix.elements as number[]);
          const hasInvalid = matrixElements.some((v) => !Number.isFinite(v));
          expect(hasInvalid, `${name} projection matrix contains NaN/Infinity after ${tc.label}`).toBe(false);

          // Matrix must be identical to the valid state
          expect(matrixElements).toEqual(initialMatrixElements);
        }

        // Verify that after non-finite attacks, a subsequent valid resize still works properly
        scene.resize(1024, 768);
        expect(camera.aspect).toBeCloseTo(1024 / 768, 5);
        expect(Number.isFinite(camera.aspect)).toBe(true);
        Array.from(camera.projectionMatrix.elements as number[]).forEach((val) => {
          expect(Number.isFinite(val)).toBe(true);
        });

        scene.destroy();
      });
    });

    it('survives rapid adversarial non-finite resize flood (100 sequential calls) across all scenes', () => {
      ALL_8_SCENES.forEach(({ SceneClass }) => {
        const scene = new SceneClass();
        scene.init(container, 800, 600);

        const camera = (scene as any).camera as THREE.PerspectiveCamera;
        const baselineAspect = camera.aspect;

        for (let i = 0; i < 100; i++) {
          const w = i % 3 === 0 ? NaN : i % 3 === 1 ? Infinity : -Infinity;
          const h = i % 2 === 0 ? NaN : -Infinity;
          scene.resize(w, h);
        }

        expect(camera.aspect).toBe(baselineAspect);
        expect(Number.isFinite(camera.aspect)).toBe(true);
        Array.from(camera.projectionMatrix.elements as number[]).forEach((v) => {
          expect(Number.isFinite(v)).toBe(true);
        });

        scene.destroy();
      });
    });
  });

  // =========================================================================
  // TASK 2: NodeGraphScene Texture and Visual Group Disposal
  // =========================================================================
  describe('Task 2: NodeGraphScene Texture & Visual Group Disposal on updateData()', () => {
    it('disposes procedural textures and does not leak textures across successive updateData() calls', () => {
      const graph = new NodeGraphScene();
      graph.init(container, 800, 600);

      // Track texture disposal
      const textureDisposeSpy = vi.spyOn(THREE.Texture.prototype, 'dispose');

      // Call 1: initial data (5 nodes)
      graph.updateData(SEED_TRUTH_GRAPH_DATA);
      const initialNodeCount = SEED_TRUTH_GRAPH_DATA.nodes.length;
      expect((graph as any).createdTextures.length).toBe(initialNodeCount);

      // Call 2 to 20: 19 successive updateData calls
      const disposeCallsBefore = textureDisposeSpy.mock.calls.length;
      for (let i = 0; i < 19; i++) {
        graph.updateData(SEED_TRUTH_GRAPH_DATA);
      }

      // Procedural textures from previous iterations must be disposed
      const disposeCallsAfter = textureDisposeSpy.mock.calls.length;
      expect(disposeCallsAfter - disposeCallsBefore).toBeGreaterThanOrEqual(19 * initialNodeCount);

      // createdTextures array must ONLY contain textures for the CURRENT batch
      expect((graph as any).createdTextures.length).toBe(initialNodeCount);

      graph.destroy();
    });

    it('properly disposes mesh geometries and materials from all 5 visual groups during updateData()', () => {
      const graph = new NodeGraphScene();
      graph.init(container, 800, 600);

      graph.updateData(SEED_TRUTH_GRAPH_DATA);

      // Collect references to existing geometries and materials
      const existingMeshes = Array.from((graph as any).nodeMeshMap.values()) as THREE.Mesh[];
      expect(existingMeshes.length).toBeGreaterThan(0);

      const geoSpies = existingMeshes.map((m) => vi.spyOn(m.geometry, 'dispose'));
      const matSpies = existingMeshes.map((m) => vi.spyOn(m.material as THREE.Material, 'dispose'));

      // Perform update with new dataset (smaller: 2 nodes)
      const subsetData: TruthGraphData = {
        nodes: SEED_TRUTH_GRAPH_DATA.nodes.slice(0, 2),
        edges: [],
      };
      graph.updateData(subsetData);

      // Every single node mesh from the previous dataset MUST have had its geometry and material disposed
      geoSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalled();
      });
      matSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalled();
      });

      // Visual groups must now reflect exactly 2 nodes
      expect((graph as any).nodesGroup.children.length).toBe(2);
      expect((graph as any).createdTextures.length).toBe(2);

      graph.destroy();
    });

    it('handles empty, null, and malformed updateData payloads gracefully without leaking or crashing', () => {
      const graph = new NodeGraphScene();
      graph.init(container, 800, 600);
      graph.updateData(SEED_TRUTH_GRAPH_DATA);

      expect(() => graph.updateData({ nodes: [], edges: [] })).not.toThrow();
      expect((graph as any).nodesGroup.children.length).toBe(0);
      expect((graph as any).createdTextures.length).toBe(0);

      expect(() => graph.updateData(null as any)).not.toThrow();
      expect(() => graph.updateData(undefined as any)).not.toThrow();
      expect(() => graph.updateData({} as any)).not.toThrow();
      expect(() => graph.updateData({ nodes: 'not an array' } as any)).not.toThrow();

      graph.destroy();
    });
  });

  // =========================================================================
  // TASK 3: GlobeScene Arc & Beacon Material and Geometry Disposal
  // =========================================================================
  describe('Task 3: GlobeScene Arc & Beacon Material and Geometry Disposal on updateData()', () => {
    it('disposes both geometry AND material for all arcs and beacons when updateData() is called', () => {
      const globe = new GlobeScene();
      globe.init(container, 800, 600);

      // Initial data update
      globe.updateData(SEED_TRANSIT_ARCS);

      const arcsGroup = (globe as any).arcsGroup as THREE.Group;
      const beaconsGroup = (globe as any).beaconsGroup as THREE.Group;

      expect(arcsGroup.children.length).toBe(SEED_TRANSIT_ARCS.length * 2);
      expect(beaconsGroup.children.length).toBe(SEED_TRANSIT_ARCS.length * 2);

      // Collect all child geometries and materials from current arcs and beacons
      const initialArcChildren = [...arcsGroup.children] as (THREE.Line | THREE.Mesh)[];
      const initialBeaconChildren = [...beaconsGroup.children] as THREE.Mesh[];

      const arcGeoSpies = initialArcChildren.map((child) => vi.spyOn(child.geometry, 'dispose'));
      const arcMatSpies = initialArcChildren.map((child) =>
        Array.isArray(child.material)
          ? (child.material as THREE.Material[]).map((m) => vi.spyOn(m, 'dispose'))
          : [vi.spyOn(child.material as THREE.Material, 'dispose')]
      );

      const beaconGeoSpies = initialBeaconChildren.map((child) => vi.spyOn(child.geometry, 'dispose'));
      const beaconMatSpies = initialBeaconChildren.map((child) =>
        Array.isArray(child.material)
          ? (child.material as THREE.Material[]).map((m) => vi.spyOn(m, 'dispose'))
          : [vi.spyOn(child.material as THREE.Material, 'dispose')]
      );

      // Update with new set of arcs (2 arcs)
      const newArcs: MonetaryTransitArc[] = [
        {
          id: 'test-arc-1',
          type: 'PAYPAL_INFLOW',
          amount: 5000,
          currency: 'USD',
          sourceCoords: [37.7749, -122.4194],
          destCoords: [51.5074, -0.1278],
          sourceCity: 'San Francisco',
          destCity: 'London',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'test-arc-2',
          type: 'RECOVERY_CREDIT',
          amount: 12500,
          currency: 'USD',
          sourceCoords: [40.7128, -74.006],
          destCoords: [35.6762, 139.6503],
          sourceCity: 'New York',
          destCity: 'Tokyo',
          timestamp: new Date().toISOString(),
        },
      ];

      globe.updateData(newArcs);

      // 1. Verify ALL old arc geometries were disposed
      arcGeoSpies.forEach((spy, idx) => {
        expect(spy, `Arc child ${idx} geometry.dispose should have been called`).toHaveBeenCalled();
      });

      // 2. Verify ALL old arc materials were disposed
      arcMatSpies.flat().forEach((spy, idx) => {
        expect(spy, `Arc child ${idx} material.dispose should have been called`).toHaveBeenCalled();
      });

      // 3. Verify ALL old beacon geometries were disposed
      beaconGeoSpies.forEach((spy, idx) => {
        expect(spy, `Beacon child ${idx} geometry.dispose should have been called`).toHaveBeenCalled();
      });

      // 4. Verify ALL old beacon materials were disposed
      beaconMatSpies.flat().forEach((spy, idx) => {
        expect(spy, `Beacon child ${idx} material.dispose should have been called`).toHaveBeenCalled();
      });

      // 5. Verify arcsGroup and beaconsGroup children are strictly updated, not accumulating
      // 2 arcs * 2 (line + comet points) = 4
      expect(arcsGroup.children.length).toBe(4);
      // Each arc creates 2 beacons (source and dest) = 4
      expect(beaconsGroup.children.length).toBe(4);

      globe.destroy();
    });

    it('does not leak objects across 30 consecutive transit arc updates', () => {
      const globe = new GlobeScene();
      globe.init(container, 800, 600);

      const arcsGroup = (globe as any).arcsGroup as THREE.Group;
      const beaconsGroup = (globe as any).beaconsGroup as THREE.Group;

      for (let i = 0; i < 30; i++) {
        const count = (i % 5) + 1;
        const testArcs: MonetaryTransitArc[] = Array.from({ length: count }, (_, idx) => ({
          id: `burst-arc-${i}-${idx}`,
          type: 'PAYPAL_INFLOW',
          amount: 1000 * (idx + 1),
          currency: 'USD',
          sourceCoords: [20 + idx * 5, -100 + idx * 10],
          destCoords: [40 + idx * 5, 10 + idx * 10],
          sourceCity: `Source ${idx}`,
          destCity: `Dest ${idx}`,
          timestamp: new Date().toISOString(),
        }));

        globe.updateData(testArcs);

        expect(arcsGroup.children.length).toBe(count * 2);
        expect(beaconsGroup.children.length).toBe(count * 2);
      }

      // Spy on the remaining arc and beacon geometries before destroy
      const remainingArcGeos = arcsGroup.children.map((c: any) => vi.spyOn(c.geometry, 'dispose'));
      const remainingBeaconGeos = beaconsGroup.children.map((c: any) => vi.spyOn(c.geometry, 'dispose'));

      globe.destroy();

      // All remaining GPU geometries must be disposed by disposeThreeScene
      remainingArcGeos.forEach((spy) => expect(spy).toHaveBeenCalled());
      remainingBeaconGeos.forEach((spy) => expect(spy).toHaveBeenCalled());

      // Controller must null out references to prevent memory retention
      expect((globe as any).arcsGroup).toBeNull();
      expect((globe as any).beaconsGroup).toBeNull();
      expect((globe as any).scene).toBeNull();
      expect((globe as any).renderer).toBeNull();
    });

    it('gracefully tolerates adversarial transit arc coordinates without crashing or corrupting scene graph', () => {
      const globe = new GlobeScene();
      globe.init(container, 800, 600);

      const adversarialArcs: any[] = [
        { id: 'arc-nan', sourceCoords: [NaN, NaN], destCoords: [40, 50], type: 'PAYPAL_INFLOW' },
        { id: 'arc-inf', sourceCoords: [Infinity, -Infinity], destCoords: [0, 0], type: 'RECOVERY_CREDIT' },
        { id: 'arc-null', sourceCoords: null, destCoords: [10, 20], type: 'DISPUTE_HOLD' },
        { id: 'arc-undefined', destCoords: [10, 20], type: 'SUPPLIER_OUTFLOW' },
        { id: 'arc-empty', sourceCoords: [], destCoords: [], type: 'PAYPAL_INFLOW' },
      ];

      expect(() => globe.updateData(adversarialArcs)).not.toThrow();

      // Subsequent valid update clears any invalid objects and renders cleanly
      globe.updateData(SEED_TRANSIT_ARCS);
      expect((globe as any).arcsGroup.children.length).toBe(SEED_TRANSIT_ARCS.length * 2);

      globe.destroy();
    });
  });

  // =========================================================================
  // TASK 4: Lifecycle Edge Cases & Rapid Re-mount Stress
  // =========================================================================
  describe('Task 4: Comprehensive Lifecycle Robustness Across All 8 Scenes', () => {
    it('safely tolerates resize() and onPointerMove() calls before init() and after destroy()', () => {
      ALL_8_SCENES.forEach(({ name, SceneClass }) => {
        const scene = new SceneClass();

        // 1. Before init
        expect(() => scene.resize(800, 600)).not.toThrow();
        expect(() => scene.resize(NaN, NaN)).not.toThrow();
        expect(() => scene.onPointerMove(0.5, 0.5)).not.toThrow();
        expect(() => scene.onPointerMove(NaN, NaN)).not.toThrow();
        if (scene.updateData) {
          expect(() => scene.updateData(null as any)).not.toThrow();
        }

        // 2. Initialize
        scene.init(container, 800, 600);
        expect(container.querySelectorAll('canvas').length).toBe(1);

        // 3. Destroy
        scene.destroy();
        expect(container.querySelectorAll('canvas').length).toBe(0);

        // 4. After destroy
        expect(() => scene.resize(800, 600)).not.toThrow();
        expect(() => scene.resize(NaN, NaN)).not.toThrow();
        expect(() => scene.onPointerMove(0.5, 0.5)).not.toThrow();
        expect(() => scene.onPointerMove(NaN, NaN)).not.toThrow();
        if (scene.updateData) {
          expect(() => scene.updateData(null as any)).not.toThrow();
        }
        // Multiple destroy calls must be idempotent
        expect(() => scene.destroy()).not.toThrow();
      });
    });

    it('survives rapid 20x re-mount and destroy cycle on a single container without DOM leaks', () => {
      ALL_8_SCENES.forEach(({ SceneClass }) => {
        for (let i = 0; i < 20; i++) {
          const scene = new SceneClass();
          scene.init(container, 800, 600);
          expect(container.querySelectorAll('canvas').length).toBe(1);
          scene.resize(800 + i * 10, 600 + i * 5);
          scene.destroy();
          expect(container.querySelectorAll('canvas').length).toBe(0);
        }
      });
    });
  });
});
