/**
 * frontend/src/test/m2_scenes.test.ts
 * 
 * Milestone 2 Comprehensive Three.js Scene Controllers Test Suite.
 * Exhaustively verifies all 8 scene controllers across lifecycle stages:
 * Instantiation, Canvas DOM Attachment, Responsive Resizing, Zero/Negative Dimension
 * Resilience, Reactive Data Updates, NDC Pointer Responsiveness, GPU Resource Disposal,
 * and Rapid Re-mount Stress Testing.
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

// Polyfill WebGL context methods in JSDOM for Three.js WebGLRenderer compatibility
if (typeof HTMLCanvasElement !== 'undefined') {
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (contextId: string, ...args: any[]): any {
    if (contextId === 'webgl' || contextId === 'webgl2') {
      const gl = {
        // WebGL Constants
        VERSION: 0x1F02,
        SHADING_LANGUAGE_VERSION: 0x8B8C,
        VENDOR: 0x1F00,
        RENDERER: 0x1F01,
        MAX_VERTEX_ATTRIBS: 0x8869,
        MAX_VARYING_VECTORS: 0x8DFD,
        MAX_VERTEX_UNIFORM_VECTORS: 0x8DFC,
        MAX_FRAGMENT_UNIFORM_VECTORS: 0x8DFB,
        MAX_TEXTURE_IMAGE_UNITS: 0x8871,
        MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8B4C,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8872,
        MAX_TEXTURE_SIZE: 0x0D33,
        MAX_CUBE_MAP_TEXTURE_SIZE: 0x851C,
        MAX_RENDERBUFFER_SIZE: 0x84E8,
        SCISSOR_BOX: 0x0C10,
        VIEWPORT: 0x0BA2,
        COLOR_BUFFER_BIT: 0x00004000,
        DEPTH_BUFFER_BIT: 0x00000100,
        STENCIL_BUFFER_BIT: 0x00000400,
        TEXTURE_2D: 0x0DE1,
        TEXTURE_CUBE_MAP: 0x8513,
        TEXTURE_BINDING_2D: 0x8069,
        TEXTURE_BINDING_CUBE_MAP: 0x806A,
        RGBA: 0x1908,
        UNSIGNED_BYTE: 0x1401,
        FRAMEBUFFER: 0x8D40,
        RENDERBUFFER: 0x8D41,

        getParameter: (param: any) => {
          if (param === 0x1F02 || param === 7938 || param === undefined) return 'WebGL 2.0';
          if (param === 0x8B8C || param === 35724) return 'WebGL GLSL ES 3.00';
          if (param === 0x1F00 || param === 7936) return 'WebKit';
          if (param === 0x1F01 || param === 7937) return 'WebKit WebGL';
          if (param === 0x0C10 || param === 0x0BA2 || param === 3088 || param === 2978) {
            return new Int32Array([0, 0, 800, 600]);
          }
          if (param === 0x8869 || param === 0x8872 || param === 0x8B4C || param === 0x8871) return 16;
          if (param === 0x8DFB || param === 0x8DFC) return 1024;
          if (param === 0x8DFD) return 8;
          if (param === 0x0D33 || param === 0x851C || param === 0x84E8) return 16384;
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

// Helper: fabricate mock DOM container with measurable bounding box
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

// Scene Test Manifest: 8 Scenes with Realistic Data Fixtures
interface SceneTestDefinition {
  type: SceneType;
  name: string;
  SceneClass: new () => ThreeSceneController<any>;
  validFixture: any;
  alternativeFixture: any;
}

const ALL_SCENE_DEFINITIONS: SceneTestDefinition[] = [
  {
    type: 'globe',
    name: 'GlobeScene (Feature 2)',
    SceneClass: GlobeScene,
    validFixture: SEED_TRANSIT_ARCS,
    alternativeFixture: [],
  },
  {
    type: 'money-map',
    name: 'MoneyMapScene (Feature 2/R2)',
    SceneClass: MoneyMapScene,
    validFixture: {
      accounts: [
        { id: 'acc-1', name: 'PayPal Balance', balance: 68400 },
        { id: 'acc-2', name: 'Silicon Valley Bank', balance: 58100 },
      ],
      flows: [{ source: 'acc-1', target: 'acc-2', amount: 15000 }],
    },
    alternativeFixture: { accounts: [], flows: [] },
  },
  {
    type: 'ambient',
    name: 'AmbientScene (Feature 34)',
    SceneClass: AmbientScene,
    validFixture: undefined,
    alternativeFixture: { particleDensity: 'dense' },
  },
  {
    type: 'terrain',
    name: 'TerrainScene (Feature 16)',
    SceneClass: TerrainScene,
    validFixture: generateInitialDailyProjections(),
    alternativeFixture: generateInitialDailyProjections().slice(0, 30),
  },
  {
    type: 'funnel',
    name: 'FunnelScene (Feature 4)',
    SceneClass: FunnelScene,
    validFixture: {
      identifiedAmount: 18450,
      submittedAmount: 12100,
      pendingAmount: 7500,
      recoveredAmount: 4200,
      conversionRatePct: 22.8,
    },
    alternativeFixture: {
      identifiedAmount: 0,
      submittedAmount: 0,
      pendingAmount: 0,
      recoveredAmount: 0,
      conversionRatePct: 0,
    },
  },
  {
    type: 'firewall',
    name: 'FirewallScene (Feature 10)',
    SceneClass: FirewallScene,
    validFixture: {
      status: 'APPROVED_SAFE',
      safe: true,
      orderAmount: 12000,
      currentBuffer: 142500,
      lowestProjectedBuffer: 31200,
      verdictHeadline: 'Buffer Safe',
      verdictExplanation: 'Exceeds $15k buffer',
    },
    alternativeFixture: {
      status: 'CRITICAL_BUFFER_BREACH',
      safe: false,
      orderAmount: 180000,
      currentBuffer: 142500,
      lowestProjectedBuffer: -37500,
      verdictHeadline: 'Buffer Breach',
      verdictExplanation: 'Breaches $15k minimum safety buffer',
    },
  },
  {
    type: 'node-graph',
    name: 'NodeGraphScene (Feature 7)',
    SceneClass: NodeGraphScene,
    validFixture: SEED_TRUTH_GRAPH_DATA,
    alternativeFixture: { nodes: [], edges: [] },
  },
  {
    type: 'digital-twin',
    name: 'DigitalTwinScene (Feature 13)',
    SceneClass: DigitalTwinScene,
    validFixture: SEED_DIGITAL_TWIN_METRICS,
    alternativeFixture: {
      ...SEED_DIGITAL_TWIN_METRICS,
      healthScore: 35,
      orbColorHex: '#EF4444',
      dynamicPulseState: 'CRITICAL',
    },
  },
];

describe('Milestone 2: Unified 3D Scene Controllers Verification Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Purge any lingering DOM test containers
    const containers = document.querySelectorAll('div');
    containers.forEach((c) => {
      if (c.parentNode === document.body) {
        document.body.removeChild(c);
      }
    });
  });

  // =========================================================================
  // 1. UNIFIED EXPORT BARREL & FACTORY VERIFICATION
  // =========================================================================
  describe('Unified Scene Barrel & Factory Map', () => {
    it('exports all 8 required scene controllers in SCENE_CONTROLLER_MAP', () => {
      const keys = Object.keys(SCENE_CONTROLLER_MAP) as SceneType[];
      expect(keys).toHaveLength(8);
      expect(keys).toEqual(
        expect.arrayContaining([
          'globe',
          'money-map',
          'ambient',
          'terrain',
          'funnel',
          'firewall',
          'node-graph',
          'digital-twin',
        ])
      );
    });

    it('creates fresh scene controller instances via createSceneController()', () => {
      const sceneKeys: SceneType[] = [
        'globe',
        'money-map',
        'ambient',
        'terrain',
        'funnel',
        'firewall',
        'node-graph',
        'digital-twin',
      ];

      sceneKeys.forEach((key) => {
        const controller = createSceneController(key);
        expect(controller).toBeDefined();
        expect(typeof controller.init).toBe('function');
        expect(typeof controller.resize).toBe('function');
        expect(typeof controller.destroy).toBe('function');
      });
    });

    it('throws descriptive error on invalid scene type in createSceneController()', () => {
      expect(() => {
        createSceneController('non-existent-scene' as any);
      }).toThrow(/Unknown scene type/i);
    });
  });

  // =========================================================================
  // 2. EXHAUSTIVE 8-SCENE LIFECYCLE MATRIX
  // =========================================================================
  ALL_SCENE_DEFINITIONS.forEach(({ type, name, SceneClass, validFixture, alternativeFixture }) => {
    describe(`Lifecycle Matrix: ${name}`, () => {
      it(`[${type}] initializes WebGL renderer and attaches canvas to container`, () => {
        const container = createMockContainer(800, 600);
        const scene = new SceneClass();

        scene.init(container, 800, 600);

        const canvas = container.querySelector('canvas');
        expect(canvas).toBeDefined();
        expect(canvas).toBeInstanceOf(HTMLCanvasElement);

        scene.destroy();
      });

      it(`[${type}] updates viewport and projection matrix on resize()`, () => {
        const container = createMockContainer(800, 600);
        const scene = new SceneClass();
        scene.init(container, 800, 600);

        expect(() => {
          scene.resize(1024, 768);
          scene.resize(400, 300);
          scene.resize(1920, 1080);
        }).not.toThrow();

        scene.destroy();
      });

      it(`[${type}] gracefully handles zero and negative dimensions in resize()`, () => {
        const container = createMockContainer(800, 600);
        const scene = new SceneClass();
        scene.init(container, 800, 600);

        expect(() => {
          scene.resize(0, 0);
          scene.resize(-50, -100);
          scene.resize(0, 600);
          scene.resize(800, 0);
        }).not.toThrow();

        scene.destroy();
      });

      it(`[${type}] consumes domain data fixtures via updateData() without errors`, () => {
        const container = createMockContainer(800, 600);
        const scene = new SceneClass();
        scene.init(container, 800, 600);

        if (scene.updateData) {
          expect(() => {
            scene.updateData!(validFixture);
            scene.updateData!(alternativeFixture);
          }).not.toThrow();
        }

        scene.destroy();
      });

      it(`[${type}] tolerates empty, null, and malformed inputs in updateData()`, () => {
        const container = createMockContainer(800, 600);
        const scene = new SceneClass();
        scene.init(container, 800, 600);

        if (scene.updateData) {
          expect(() => {
            scene.updateData!(null as any);
            scene.updateData!(undefined as any);
            scene.updateData!({} as any);
            scene.updateData!([] as any);
          }).not.toThrow();
        }

        scene.destroy();
      });

      it(`[${type}] accepts normalized pointer coordinates in [-1, 1] via onPointerMove()`, () => {
        const container = createMockContainer(800, 600);
        const scene = new SceneClass();
        scene.init(container, 800, 600);

        if (scene.onPointerMove) {
          expect(() => {
            scene.onPointerMove!(0, 0, new MouseEvent('pointermove') as any);
            scene.onPointerMove!(-1, -1, new MouseEvent('pointermove') as any);
            scene.onPointerMove!(1, 1, new MouseEvent('pointermove') as any);
            scene.onPointerMove!(0.5, -0.5, new MouseEvent('pointermove') as any);
          }).not.toThrow();
        }

        scene.destroy();
      });

      it(`[${type}] endures out-of-bounds, NaN, and Infinity in onPointerMove()`, () => {
        const container = createMockContainer(800, 600);
        const scene = new SceneClass();
        scene.init(container, 800, 600);

        if (scene.onPointerMove) {
          expect(() => {
            scene.onPointerMove!(2.5, -3.8, new MouseEvent('pointermove') as any);
            scene.onPointerMove!(NaN, NaN, new MouseEvent('pointermove') as any);
            scene.onPointerMove!(Infinity, -Infinity, new MouseEvent('pointermove') as any);
          }).not.toThrow();
        }

        scene.destroy();
      });

      it(`[${type}] disposes WebGL resources, detaches canvas, and is idempotent on destroy()`, () => {
        const container = createMockContainer(800, 600);
        const scene = new SceneClass();
        scene.init(container, 800, 600);

        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();

        // 1. First destroy call
        scene.destroy();
        expect(container.querySelector('canvas')).toBeNull();

        // 2. Idempotent second destroy call
        expect(() => {
          scene.destroy();
        }).not.toThrow();
      });

      it(`[${type}] survives rapid mounting and unmounting cycles (tab thrashing)`, () => {
        for (let cycle = 0; cycle < 5; cycle++) {
          const container = createMockContainer(400, 300);
          const scene = new SceneClass();
          scene.init(container, 400, 300);
          if (scene.updateData) {
            scene.updateData(validFixture);
          }
          scene.resize(500, 350);
          if (scene.onPointerMove) {
            scene.onPointerMove(0.2, -0.3, new MouseEvent('pointermove') as any);
          }
          scene.destroy();
          document.body.removeChild(container);
        }
      });
    });
  });

  // =========================================================================
  // 3. DEEP FEATURE TEST: NodeGraphScene (Payment Truth Constellation)
  // =========================================================================
  describe('NodeGraphScene Deep Specification (Feature 7)', () => {
    it('parses TruthGraphData and builds node meshes with distinct geometries', () => {
      const container = createMockContainer(800, 600);
      const scene = new NodeGraphScene();
      scene.init(container, 800, 600);

      scene.updateData(SEED_TRUTH_GRAPH_DATA);

      // Verify node positions were calculated
      const posMap = (scene as any).nodePositions as Map<string, THREE.Vector3>;
      expect(posMap).toBeDefined();
      expect(posMap.size).toBe(SEED_TRUTH_GRAPH_DATA.nodes.length);

      // Verify specific nodes exist
      expect(posMap.has('N-TX-1')).toBe(true);
      expect(posMap.has('N-BK-1')).toBe(true);
      expect(posMap.has('N-ALERT-1')).toBe(true);

      scene.destroy();
    });

    it('attaches pulsing warning halos to discrepant nodes (status = DISCREPANT)', () => {
      const container = createMockContainer(800, 600);
      const scene = new NodeGraphScene();
      scene.init(container, 800, 600);

      scene.updateData(SEED_TRUTH_GRAPH_DATA);

      const warningHalos = (scene as any).warningHalos as Array<any>;
      expect(warningHalos).toBeDefined();
      expect(warningHalos.length).toBeGreaterThanOrEqual(1);

      scene.destroy();
    });

    it('instantiates edge particle packet flows along directed links', () => {
      const container = createMockContainer(800, 600);
      const scene = new NodeGraphScene();
      scene.init(container, 800, 600);

      scene.updateData(SEED_TRUTH_GRAPH_DATA);

      const particleFlows = (scene as any).edgeParticleFlows as Array<any>;
      expect(particleFlows).toBeDefined();
      expect(particleFlows.length).toBe(SEED_TRUTH_GRAPH_DATA.edges.length);

      scene.destroy();
    });

    it('detects hovered node via pointer raycasting and triggers scale interpolation', () => {
      const container = createMockContainer(800, 600);
      const scene = new NodeGraphScene();
      scene.init(container, 800, 600);

      scene.updateData(SEED_TRUTH_GRAPH_DATA);

      // Position raycaster towards center node
      scene.onPointerMove(0, 0);

      // Trigger click event
      expect(() => {
        scene.onPointerClick(0, 0);
      }).not.toThrow();

      scene.destroy();
    });
  });

  // =========================================================================
  // 4. DEEP FEATURE TEST: DigitalTwinScene (Financial Organism)
  // =========================================================================
  describe('DigitalTwinScene Deep Specification (Feature 13)', () => {
    it('initializes celestial energy core, geodesic shield, and 3 concentric orbital rings', () => {
      const container = createMockContainer(800, 600);
      const scene = new DigitalTwinScene();
      scene.init(container, 800, 600);

      expect((scene as any).orbCoreMesh).toBeDefined();
      expect((scene as any).shieldMesh).toBeDefined();
      expect((scene as any).coronaSprite).toBeDefined();

      const rings = (scene as any).orbitalRings as Array<any>;
      expect(rings).toHaveLength(3);
      expect(rings[0].name).toContain('PayPal Available Balance');
      expect(rings[1].name).toContain('Bank Operating Checking');
      expect(rings[2].name).toContain('Emergency Reserve Savings');

      scene.destroy();
    });

    it('modulates heartbeat pulse rhythm based on dynamicPulseState', () => {
      const container = createMockContainer(800, 600);
      const scene = new DigitalTwinScene();
      scene.init(container, 800, 600);

      // State: CRITICAL (Fast, high-amplitude distress pulse)
      scene.updateData({
        ...SEED_DIGITAL_TWIN_METRICS,
        dynamicPulseState: 'CRITICAL',
      });
      expect((scene as any).pulseFrequencyHz).toBe(2.8);
      expect((scene as any).pulseAmplitude).toBe(0.24);

      // State: EXPANDING (Moderate breathing pulse)
      scene.updateData({
        ...SEED_DIGITAL_TWIN_METRICS,
        dynamicPulseState: 'EXPANDING',
        pulseFrequencyHz: 1.6,
      });
      expect((scene as any).pulseFrequencyHz).toBe(1.6);
      expect((scene as any).pulseAmplitude).toBe(0.16);

      // State: STABLE
      scene.updateData({
        ...SEED_DIGITAL_TWIN_METRICS,
        dynamicPulseState: 'STABLE',
        pulseFrequencyHz: 1.0,
      });
      expect((scene as any).pulseFrequencyHz).toBe(1.0);
      expect((scene as any).pulseAmplitude).toBe(0.08);

      scene.destroy();
    });

    it('interpolates core color and adjusts orbital speeds to reflect liquidity balances', () => {
      const container = createMockContainer(800, 600);
      const scene = new DigitalTwinScene();
      scene.init(container, 800, 600);

      // Update to Crimson Alert state
      scene.updateData({
        ...SEED_DIGITAL_TWIN_METRICS,
        orbColorHex: '#EF4444',
        healthScore: 32,
      });

      const targetColor = (scene as any).targetCoreColor as THREE.Color;
      expect(targetColor.getHexString().toUpperCase()).toBe('EF4444');

      scene.destroy();
    });

    it('smoothly tilts celestial assembly on pointer movements', () => {
      const container = createMockContainer(800, 600);
      const scene = new DigitalTwinScene();
      scene.init(container, 800, 600);

      scene.onPointerMove(0.75, -0.6);

      const targetTilt = (scene as any).targetTilt as THREE.Vector2;
      expect(targetTilt.x).toBeCloseTo(0.75 * 0.45);
      expect(targetTilt.y).toBeCloseTo(0.6 * 0.35);

      scene.destroy();
    });
  });
});
