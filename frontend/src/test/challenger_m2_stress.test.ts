/**
 * frontend/src/test/challenger_m2_stress.test.ts
 * 
 * Empirical Adversarial Challenger Test Suite (Milestone 2 - Challenger 1):
 * High-stress lifecycle thrashing, boundary dimension resilience, data flooding,
 * adversarial non-finite pointer inputs, and VRAM leak detection across all 8 Three.js scene controllers.
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
  SCENE_CONTROLLER_MAP,
  createSceneController,
  SceneType,
} from '../components/3d/scenes';
import {
  SEED_TRANSIT_ARCS,
  SEED_TRUTH_GRAPH_DATA,
  SEED_DIGITAL_TWIN_METRICS,
  SEED_RECOVERY_CASES,
  generateInitialDailyProjections,
} from '../store/demoSeedData';
import type { ThreeSceneController } from '../types';

// Polyfill WebGL context in JSDOM for Three.js WebGLRenderer compatibility
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

const mockPointerEvent = {} as PointerEvent;

interface SceneStressManifest {
  type: SceneType;
  name: string;
  SceneClass: new () => ThreeSceneController<any>;
  validFixture: any;
}

const ALL_SCENES: SceneStressManifest[] = [
  {
    type: 'globe',
    name: 'GlobeScene',
    SceneClass: GlobeScene,
    validFixture: SEED_TRANSIT_ARCS,
  },
  {
    type: 'money-map',
    name: 'MoneyMapScene',
    SceneClass: MoneyMapScene,
    validFixture: undefined,
  },
  {
    type: 'ambient',
    name: 'AmbientScene',
    SceneClass: AmbientScene,
    validFixture: { particleDensity: 'dense', maxDistance: 4.5, baseSpeed: 0.08 },
  },
  {
    type: 'terrain',
    name: 'TerrainScene',
    SceneClass: TerrainScene,
    validFixture: generateInitialDailyProjections(),
  },
  {
    type: 'funnel',
    name: 'FunnelScene',
    SceneClass: FunnelScene,
    validFixture: SEED_RECOVERY_CASES,
  },
  {
    type: 'firewall',
    name: 'FirewallScene',
    SceneClass: FirewallScene,
    validFixture: { status: 'WARNING_BUFFER_TIGHT', lowestProjectedBuffer: 12000, maxAllowableCommitment: 85000 },
  },
  {
    type: 'node-graph',
    name: 'NodeGraphScene',
    SceneClass: NodeGraphScene,
    validFixture: SEED_TRUTH_GRAPH_DATA,
  },
  {
    type: 'digital-twin',
    name: 'DigitalTwinScene',
    SceneClass: DigitalTwinScene,
    validFixture: SEED_DIGITAL_TWIN_METRICS,
  },
];

describe('Empirical Adversarial Stress & Lifecycle Thrashing (Milestone 2 - Challenger 1)', () => {
  let container: HTMLDivElement;
  let cancelRafSpy: any;

  beforeEach(() => {
    container = createMockContainer(800, 600);
    cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  // ==========================================================================
  // SUITE 1: Rapid Lifecycle Thrashing (100 Cycles per Controller)
  // ==========================================================================
  describe('Suite 1: Rapid Lifecycle Thrashing (100 Mount/Resize/Update/Destroy Cycles)', () => {
    ALL_SCENES.forEach(({ type, SceneClass, validFixture }) => {
      it(`[${type}] survives 100 consecutive mount, resize, updateData, and unmount cycles without leaking DOM or dangling frames`, () => {
        const initialCancelCount = cancelRafSpy.mock.calls.length;

        for (let cycle = 0; cycle < 100; cycle++) {
          const controller = new SceneClass();

          // 1. Mount
          controller.init(container, 800, 600);
          expect(container.children.length).toBeGreaterThanOrEqual(1);

          // 2. Resize
          controller.resize(800 + (cycle % 50), 600 + (cycle % 40));

          // 3. Update data
          if (controller.updateData) {
            controller.updateData(validFixture);
          }

          // 4. Pointer move
          if (controller.onPointerMove) {
            controller.onPointerMove(0.1 * (cycle % 10), -0.1 * (cycle % 10), mockPointerEvent);
          }

          // 5. Unmount / Destroy
          controller.destroy();

          // Invariant: canvas must be detached from container
          expect(container.children.length).toBe(0);
        }

        // Invariant: cancelAnimationFrame was called on every cycle
        const cancelCount = cancelRafSpy.mock.calls.length - initialCancelCount;
        expect(cancelCount).toBeGreaterThanOrEqual(100);
      });
    });

    it('survives 100 rapid interleaved cycles randomly thrashing across all 8 scene controllers in the same DOM container', () => {
      for (let i = 0; i < 100; i++) {
        const manifest = ALL_SCENES[i % ALL_SCENES.length];
        const controller = new manifest.SceneClass();

        controller.init(container, 800, 600);
        expect(container.querySelector('canvas')).not.toBeNull();

        controller.resize(640, 480);
        if (controller.updateData) {
          controller.updateData(manifest.validFixture);
        }
        if (controller.onPointerMove) {
          controller.onPointerMove(Math.sin(i), Math.cos(i), mockPointerEvent);
        }

        controller.destroy();
        expect(container.children.length).toBe(0);
      }
    });

    it('guarantees double-destroy idempotency across all 8 controllers', () => {
      ALL_SCENES.forEach(({ SceneClass }) => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);
        controller.destroy();
        // Second and third calls must be completely safe no-ops
        expect(() => controller.destroy()).not.toThrow();
        expect(() => controller.destroy()).not.toThrow();
        expect(container.children.length).toBe(0);
      });
    });

    it('handles simulated React 18 StrictMode mount -> immediate unmount -> re-mount cleanly', () => {
      ALL_SCENES.forEach(({ SceneClass, validFixture }) => {
        // StrictMode: init -> destroy -> init -> normal usage -> destroy
        const controller = new SceneClass();
        controller.init(container, 800, 600);
        controller.destroy();
        expect(container.children.length).toBe(0);

        const controller2 = new SceneClass();
        controller2.init(container, 800, 600);
        expect(container.children.length).toBe(1);
        if (controller2.updateData) controller2.updateData(validFixture);
        controller2.resize(800, 600);
        controller2.destroy();
        expect(container.children.length).toBe(0);
      });
    });
  });

  // ==========================================================================
  // SUITE 2: Boundary Zero, Negative, Micro, and Extreme Dimension Resizing
  // ==========================================================================
  describe('Suite 2: Boundary Zero, Negative, Micro, and Extreme Dimension Resizing', () => {
    ALL_SCENES.forEach(({ type, SceneClass }) => {
      it(`[${type}] gracefully handles zero, negative, micro, and extreme dimensions without throwing`, () => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);

        // Zero dimensions
        expect(() => controller.resize(0, 0)).not.toThrow();
        expect(() => controller.resize(0, 600)).not.toThrow();
        expect(() => controller.resize(800, 0)).not.toThrow();

        // Negative dimensions
        expect(() => controller.resize(-100, -50)).not.toThrow();
        expect(() => controller.resize(-1, -1)).not.toThrow();
        expect(() => controller.resize(-99999, -99999)).not.toThrow();

        // Micro-fractional dimensions
        expect(() => controller.resize(0.0001, 0.0001)).not.toThrow();
        expect(() => controller.resize(1e-7, 1e-7)).not.toThrow();

        // Massive dimensions
        expect(() => controller.resize(10000, 8000)).not.toThrow();
        expect(() => controller.resize(999999, 999999)).not.toThrow();

        // Verify camera aspect after valid resize remains finite and positive
        controller.resize(1024, 768);
        const cam = (controller as any).camera;
        if (cam && cam.projectionMatrix) {
          expect(Number.isFinite(cam.aspect)).toBe(true);
          expect(cam.aspect).toBeGreaterThan(0);
          cam.projectionMatrix.elements.forEach((val: number) => {
            expect(Number.isFinite(val)).toBe(true);
          });
        }

        controller.destroy();
      });

      it(`[${type}] guards against non-finite NaN resize: resize(NaN, NaN) preserves camera matrix and valid aspect ratio`, () => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);
        controller.resize(800, 600);

        const cam = (controller as any).camera;
        if (cam) {
          const originalAspect = cam.aspect;
          // Pass NaN to resize
          controller.resize(NaN, NaN);

          // Empirical check: resize(NaN, NaN) must NOT pollute camera aspect with NaN
          const aspectIsNaN = Number.isNaN(cam.aspect);
          const hasNaNInMatrix = Array.from(cam.projectionMatrix.elements as number[]).some(Number.isNaN);

          // Guard successfully blocks NaN: aspect and matrix are preserved
          expect(aspectIsNaN).toBe(false);
          expect(hasNaNInMatrix).toBe(false);
          expect(cam.aspect).toBe(originalAspect);
        }

        controller.destroy();
      });
    });

    it('survives rapid dimension oscillation stress (50 consecutive alternating resizes)', () => {
      ALL_SCENES.forEach(({ SceneClass }) => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);

        const dimensions = [
          [0, 0],
          [-100, -200],
          [1920, 1080],
          [0.01, 0.01],
          [10000, 8000],
          [3840, 2160],
          [1, 1],
          [-50, 600],
        ];

        for (let i = 0; i < 50; i++) {
          const [w, h] = dimensions[i % dimensions.length];
          expect(() => controller.resize(w, h)).not.toThrow();
        }

        // End with a normal resize to verify recovery
        controller.resize(800, 600);
        const cam = (controller as any).camera;
        if (cam && cam.aspect) {
          expect(Number.isFinite(cam.aspect)).toBe(true);
          expect(cam.aspect).toBeGreaterThan(0);
        }

        controller.destroy();
      });
    });
  });

  // ==========================================================================
  // SUITE 3: Malformed, Empty, and Pathological updateData() Flooding
  // ==========================================================================
  describe('Suite 3: Malformed, Empty, and Pathological updateData() Flooding', () => {
    ALL_SCENES.forEach(({ type, SceneClass, validFixture }) => {
      it(`[${type}] endures 100 rapid consecutive updateData() calls with valid fixtures`, () => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);

        for (let i = 0; i < 100; i++) {
          expect(() => {
            if (controller.updateData) controller.updateData(validFixture);
          }).not.toThrow();
        }

        controller.destroy();
      });

      it(`[${type}] safely ignores empty objects, empty arrays, null, and undefined`, () => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);

        if (controller.updateData) {
          expect(() => controller.updateData!({})).not.toThrow();
          expect(() => controller.updateData!([])).not.toThrow();
          expect(() => controller.updateData!(null as any)).not.toThrow();
          expect(() => controller.updateData!(undefined as any)).not.toThrow();
        }

        controller.destroy();
      });

      it(`[${type}] endures primitive types passed to updateData() without crashing`, () => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);

        if (controller.updateData) {
          expect(() => controller.updateData!('corrupted string payload' as any)).not.toThrow();
          expect(() => controller.updateData!(999999 as any)).not.toThrow();
          expect(() => controller.updateData!(true as any)).not.toThrow();
          expect(() => controller.updateData!(false as any)).not.toThrow();
        }

        controller.destroy();
      });

      it(`[${type}] endures circular object structures without call stack overflow`, () => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);

        const circularObj: any = { name: 'circular' };
        circularObj.self = circularObj;

        if (controller.updateData) {
          expect(() => controller.updateData!(circularObj)).not.toThrow();
        }

        controller.destroy();
      });
    });

    describe('Deep Domain-Specific Pathological Payloads', () => {
      it('GlobeScene tolerates arcs with non-finite coordinates, null points, and missing properties', () => {
        const globe = new GlobeScene();
        globe.init(container, 800, 600);

        const pathologicalArcs: any = [
          { id: 'BAD-1', sourceCoords: [NaN, Infinity], destCoords: [0, 0], type: 'UNKNOWN' },
          { id: 'BAD-2', sourceCoords: null, destCoords: undefined },
          { id: 'BAD-3' },
          null,
          undefined,
          { id: 'BAD-4', sourceCoords: [1e15, -1e15], destCoords: [90, 180] },
        ];

        // Filter out top-level nulls to test inner property resilience
        expect(() => globe.updateData(pathologicalArcs.filter(Boolean))).not.toThrow();
        globe.destroy();
      });

      it('MoneyMapScene tolerates flows with unmapped node IDs and negative/infinite amounts', () => {
        const moneyMap = new MoneyMapScene();
        moneyMap.init(container, 800, 600);

        const pathologicalData: any = {
          nodes: [
            { id: 'N1', label: 'Node 1', tier: 0, type: 'INFLOW', amount: NaN, position: [0, 0, 0], colorHex: 0xffffff },
            { id: 'N2', label: 'Node 2', tier: 3, type: 'OUTFLOW', amount: -50000, position: [1, 1, 1], colorHex: 0xff0000 },
          ],
          flows: [
            { id: 'F1', sourceId: 'NON_EXISTENT_SRC', targetId: 'NON_EXISTENT_TGT', volume: Infinity, speed: NaN, colorHex: 0x000000 },
          ],
        };

        expect(() => moneyMap.updateData(pathologicalData)).not.toThrow();
        moneyMap.destroy();
      });

      it('TerrainScene tolerates cash projections with NaN, Infinity, and inverted dates', () => {
        const terrain = new TerrainScene();
        terrain.init(container, 800, 600);

        const pathologicalProjections: any = [
          { day: 0, date: '2024-11-06', balance: NaN, inFlow: 0, outFlow: 0, netCash: 0 },
          { day: 1, date: 'invalid-date', balance: -99999999, inFlow: Infinity, outFlow: -Infinity, netCash: 0 },
          { day: 2, date: '', balance: 100000000, inFlow: 0, outFlow: 0, netCash: 0 },
        ];

        expect(() => terrain.updateData(pathologicalProjections)).not.toThrow();
        terrain.destroy();
      });

      it('NodeGraphScene tolerates missing node lists, empty graph, and invalid edge endpoints', () => {
        const graph = new NodeGraphScene();
        graph.init(container, 800, 600);

        // Empty graph
        expect(() => graph.updateData({ nodes: [], edges: [] })).not.toThrow();

        // Edges connecting non-existent nodes
        const invalidEdgesGraph: any = {
          nodes: [{ id: 'NODE-A', type: 'PAYPAL_TX', status: 'VERIFIED', label: 'A', amount: 100 }],
          edges: [{ id: 'E-1', source: 'NODE-A', target: 'NODE-GHOST', status: 'VERIFIED' }],
        };
        expect(() => graph.updateData(invalidEdgesGraph)).not.toThrow();

        graph.destroy();
      });

      it('FirewallScene tolerates unrecognised status strings and non-finite buffer amounts', () => {
        const firewall = new FirewallScene();
        firewall.init(container, 800, 600);

        expect(() => firewall.updateData({
          status: 'MALFORMED_UNRECOGNIZED_STATUS' as any,
          lowestProjectedBuffer: NaN,
          maxAllowableCommitment: -Infinity,
        })).not.toThrow();

        firewall.destroy();
      });

      it('DigitalTwinScene tolerates negative liquidity balances and extreme pulse state values', () => {
        const twin = new DigitalTwinScene();
        twin.init(container, 800, 600);

        expect(() => twin.updateData({
          healthScore: NaN,
          pulseState: 'SUPERNOVA_EXPLODING' as any,
          pulseFrequencyHz: -10,
          liquidity: {
            totalLiquidCash: -50000,
            paypalAvailableBalance: NaN,
            bankOperatingChecking: -10000,
            emergencyReserveSavings: Infinity,
          },
        })).not.toThrow();

        twin.destroy();
      });
    });
  });

  // ==========================================================================
  // SUITE 4: Adversarial Non-Finite Pointer Inputs
  // ==========================================================================
  describe('Suite 4: Adversarial Non-Finite Pointer Inputs', () => {
    ALL_SCENES.forEach(({ type, SceneClass }) => {
      it(`[${type}] endures NaN, Infinity, -Infinity, and extreme pointer coordinates in onPointerMove()`, () => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);

        if (controller.onPointerMove) {
          // Non-finite coordinates
          expect(() => controller.onPointerMove!(NaN, NaN, mockPointerEvent)).not.toThrow();
          expect(() => controller.onPointerMove!(Infinity, -Infinity, mockPointerEvent)).not.toThrow();
          expect(() => controller.onPointerMove!(-Infinity, Infinity, mockPointerEvent)).not.toThrow();
          expect(() => controller.onPointerMove!(NaN, 0.5, mockPointerEvent)).not.toThrow();
          expect(() => controller.onPointerMove!(0.5, Infinity, mockPointerEvent)).not.toThrow();

          // Out of bounds extreme coordinates
          expect(() => controller.onPointerMove!(1e20, -1e20, mockPointerEvent)).not.toThrow();
          expect(() => controller.onPointerMove!(-999999, 999999, mockPointerEvent)).not.toThrow();

          // Nullish coordinates
          expect(() => controller.onPointerMove!(undefined as any, null as any, mockPointerEvent)).not.toThrow();
        }

        controller.destroy();
      });

      it(`[${type}] preserves finite scene transform and camera matrices after adversarial pointer inputs`, () => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);

        if (controller.onPointerMove) {
          controller.onPointerMove(NaN, Infinity, mockPointerEvent);
          controller.onPointerMove(1e25, -1e25, mockPointerEvent);
          controller.onPointerMove(0.5, 0.5, mockPointerEvent); // Reset to normal
        }

        // Check camera matrices remain finite
        const cam = (controller as any).camera;
        if (cam) {
          cam.updateMatrixWorld(true);
          cam.matrixWorld.elements.forEach((val: number) => {
            expect(Number.isFinite(val)).toBe(true);
          });
        }

        // Check scene group rotation
        const root = (controller as any).rootGroup || (controller as any).globeGroup;
        if (root && root.rotation) {
          expect(Number.isFinite(root.rotation.x)).toBe(true);
          expect(Number.isFinite(root.rotation.y)).toBe(true);
          expect(Number.isFinite(root.rotation.z)).toBe(true);
        }

        controller.destroy();
      });
    });

    it('endures adversarial inputs into onPointerClick() where implemented', () => {
      const clickScenes = [MoneyMapScene, TerrainScene, FunnelScene, NodeGraphScene];
      clickScenes.forEach((SceneClass) => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);

        if (typeof (controller as any).onPointerClick === 'function') {
          expect(() => (controller as any).onPointerClick(NaN, NaN, mockPointerEvent)).not.toThrow();
          expect(() => (controller as any).onPointerClick(Infinity, -Infinity, mockPointerEvent)).not.toThrow();
          expect(() => (controller as any).onPointerClick(1e20, -1e20, mockPointerEvent)).not.toThrow();
          expect(() => (controller as any).onPointerClick(0, 0, mockPointerEvent)).not.toThrow();
        }

        controller.destroy();
      });
    });
  });

  // ==========================================================================
  // SUITE 5: Resource & VRAM Disposal Integrity Under Churn
  // ==========================================================================
  describe('Suite 5: Resource & VRAM Disposal Integrity Under Churn', () => {
    it('repeated init() -> destroy() on the exact same DOM element never leaks orphan canvases', () => {
      ALL_SCENES.forEach(({ SceneClass }) => {
        for (let i = 0; i < 5; i++) {
          const controller = new SceneClass();
          controller.init(container, 800, 600);
          expect(container.querySelectorAll('canvas').length).toBe(1);
          controller.destroy();
          expect(container.querySelectorAll('canvas').length).toBe(0);
        }
      });
    });

    it('disposes materials and geometries without throwing WebGL errors', () => {
      const disposeGeoSpy = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
      const disposeMatSpy = vi.spyOn(THREE.Material.prototype, 'dispose');

      ALL_SCENES.forEach(({ SceneClass, validFixture }) => {
        const controller = new SceneClass();
        controller.init(container, 800, 600);
        if (controller.updateData) controller.updateData(validFixture);
        controller.destroy();
      });

      // At least some geometries and materials must have been disposed across all 8 scenes
      expect(disposeGeoSpy).toHaveBeenCalled();
      expect(disposeMatSpy).toHaveBeenCalled();
    });

    it('[NodeGraphScene] verifies geometry disposal: clearVisualGroups() disposes mesh geometries on teardown', () => {
      const graph = new NodeGraphScene();
      graph.init(container, 800, 600);
      graph.updateData(SEED_TRUTH_GRAPH_DATA);

      // Track node meshes
      const meshes = Array.from((graph as any).nodeMeshMap.values()) as THREE.Mesh[];
      expect(meshes.length).toBeGreaterThan(0);

      const geoDisposeSpies = meshes.map((m) => vi.spyOn(m.geometry, 'dispose'));

      graph.destroy();

      // Empirical check: Individual node geometries must be disposed when clearVisualGroups() tears down
      const disposedCount = geoDisposeSpies.filter((spy) => spy.mock.calls.length > 0).length;
      expect(disposedCount).toBe(meshes.length);
    });

    it('[NodeGraphScene] verifies texture management: createdTextures is disposed and bounded across updateData() calls', () => {
      const graph = new NodeGraphScene();
      graph.init(container, 800, 600);

      // Update 5 times
      for (let i = 0; i < 5; i++) {
        graph.updateData(SEED_TRUTH_GRAPH_DATA);
      }
      const texturesAfterUpdates = (graph as any).createdTextures?.length || 0;

      // Label sprites allocate textures per active node and dispose previous ones on each updateData call
      expect(texturesAfterUpdates).toBe(SEED_TRUTH_GRAPH_DATA.nodes.length);

      graph.destroy();
    });
  });
});
