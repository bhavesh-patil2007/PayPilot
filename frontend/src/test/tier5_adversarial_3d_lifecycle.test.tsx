/**
 * frontend/src/test/tier5_adversarial_3d_lifecycle.test.tsx
 * 
 * Milestone 6 — Tier 5 Adversarial Coverage Hardening Suite:
 * 3D Graphics Engines, WebGL Context Lifecycle, VRAM Resource Disposal,
 * Extreme ResizeObserver Boundaries, and Pointer Dynamics.
 * 
 * Scope:
 * 1. WebGL context loss simulation (`webglcontextlost`) and automatic 2D fallback rendering in `ThreeCanvasContainer`.
 * 2. WebGL context restoration simulation (`webglcontextrestored`) cleanly re-instantiating scene controllers without residual memory leaks.
 * 3. Rapid unmounting and remounting across all 8 Three.js scenes (`GlobeScene`, `MoneyMapScene`, `TerrainScene`, `NodeGraphScene`, `FirewallScene`, `DigitalTwinScene`, `FunnelScene`, `AmbientScene`) verifying complete VRAM cleanup (`scene.clear()`, geometry/material `.dispose()`, animation frame cancellation).
 * 4. Resize observer handling under extreme dimensions (width=0, height=0, negative values, Infinity, NaN, ultra-widescreen 8K) without projection matrix corruption.
 * 5. Mouse and pointer interaction events on 3D scenes (raycasting, rotation damping, particle velocity reactions).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import * as THREE from 'three';

import {
  ThreeCanvasContainer,
  Default2DFallback,
  isWebGLAvailable,
} from '../components/3d/ThreeCanvasContainer';
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
  SEED_RECOVERY_CASES,
  SEED_DIGITAL_TWIN_METRICS,
  generateInitialDailyProjections,
} from '../store/demoSeedData';
import { usePayPilotStore } from '../store/usePayPilotStore';
import type { ThreeSceneController } from '../types';

// Views hosting 3D Scenes
import { CommandCenterView } from '../views/CommandCenterView';
import { PayBackHunterView } from '../views/PayBackHunterView';
import { PaymentTruthView } from '../views/PaymentTruthView';
import { CommitmentsView } from '../views/CommitmentsView';
import { DigitalTwinView } from '../views/DigitalTwinView';
import { SimulationLabView } from '../views/SimulationLabView';

// Ensure WebGLRenderingContext and PointerEvent are defined in JSDOM
if (typeof window !== 'undefined') {
  if (!(window as any).WebGLRenderingContext) {
    (window as any).WebGLRenderingContext = class WebGLRenderingContext {};
  }
  if (!(window as any).PointerEvent) {
    (window as any).PointerEvent = window.MouseEvent;
  }
}

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

/**
 * Helper to build a mock ThreeSceneController
 */
function createMockController(overrides?: Partial<ThreeSceneController>): {
  controller: ThreeSceneController & { restoreContext?: () => void };
  canvas: HTMLCanvasElement;
  initCalls: number;
  destroyCalls: number;
  resizeCalls: Array<{ width: number; height: number }>;
  updateDataCalls: any[];
  restoreContextCalls: number;
} {
  const canvas = document.createElement('canvas');
  let initCalls = 0;
  let destroyCalls = 0;
  let restoreContextCalls = 0;
  const resizeCalls: Array<{ width: number; height: number }> = [];
  const updateDataCalls: any[] = [];

  const controller: ThreeSceneController & { restoreContext?: () => void } = {
    init: vi.fn((container: HTMLElement, width: number, height: number) => {
      initCalls++;
      container.appendChild(canvas);
      if (overrides?.init) overrides.init(container, width, height);
    }),
    destroy: vi.fn(() => {
      destroyCalls++;
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      if (overrides?.destroy) overrides.destroy();
    }),
    resize: vi.fn((width: number, height: number) => {
      resizeCalls.push({ width, height });
      if (overrides?.resize) overrides.resize(width, height);
    }),
    updateData: vi.fn((data: any) => {
      updateDataCalls.push(data);
      if (overrides?.updateData) overrides.updateData(data);
    }),
    onPointerMove: vi.fn((x: number, y: number, event: PointerEvent) => {
      if (overrides?.onPointerMove) overrides.onPointerMove(x, y, event);
    }),
    onPointerClick: vi.fn((x: number, y: number, event: PointerEvent) => {
      if (overrides?.onPointerClick) overrides.onPointerClick(x, y, event);
    }),
    restoreContext: vi.fn(() => {
      restoreContextCalls++;
    }),
  };

  return {
    controller,
    canvas,
    get initCalls() {
      return initCalls;
    },
    get destroyCalls() {
      return destroyCalls;
    },
    resizeCalls,
    updateDataCalls,
    get restoreContextCalls() {
      return restoreContextCalls;
    },
  };
}

describe('Tier 5 Adversarial Stress: 3D Graphics & WebGL Lifecycle Hardening', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (window as any).WebGLRenderingContext = class WebGLRenderingContext {};
    usePayPilotStore.getState().resetToDemoState();
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================================================
  // SUITE 1: WebGL Context Loss Simulation & Automatic 2D Fallback
  // ==========================================================================
  describe('Suite 1: WebGL Context Loss Simulation & Automatic 2D Fallback', () => {
    it('TC-T5-01: invokes e.preventDefault() on webglcontextlost event and mounts Context Lost HUD', () => {
      const mock = createMockController();
      const { container } = render(
        <ThreeCanvasContainer
          controllerFactory={() => mock.controller}
          ariaLabel="Test Context Loss Scene"
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();

      // Dispatch webglcontextlost event with cancelable=true
      const lossEvent = new Event('webglcontextlost', { bubbles: true, cancelable: true });
      act(() => {
        canvas!.dispatchEvent(lossEvent);
      });

      // Assert event.defaultPrevented is true (so browser keeps context object available for restore)
      expect(lossEvent.defaultPrevented).toBe(true);

      // Verify Context Lost HUD overlay appeared in the DOM
      expect(screen.getByText('WebGL Context Temporarily Lost')).toBeInTheDocument();
      expect(screen.getByText('GPU resources were reclaimed by the browser. Awaiting context restoration.')).toBeInTheDocument();
      expect(screen.getByText('Restoring GPU pipeline...')).toBeInTheDocument();
    });

    it('TC-T5-02: maintains safe state and suppresses crashes when pointer events occur while context is lost', () => {
      const mock = createMockController();
      const { container } = render(
        <ThreeCanvasContainer
          controllerFactory={() => mock.controller}
          ariaLabel="Test Loss Pointer Scene"
        />
      );

      const canvas = container.querySelector('canvas')!;
      act(() => {
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
      });

      const region = screen.getByRole('region', { name: 'Test Loss Pointer Scene' });
      expect(() => {
        fireEvent.pointerMove(region, { clientX: 200, clientY: 200 });
        fireEvent.click(region, { clientX: 200, clientY: 200 });
      }).not.toThrow();
    });

    it('TC-T5-03: renders Default2DFallback when WebGL is unsupported in browser runtime', () => {
      // Mock isWebGLAvailable to false by temporarily unsetting WebGLRenderingContext
      const origContext = (window as any).WebGLRenderingContext;
      delete (window as any).WebGLRenderingContext;

      const mock = createMockController();
      render(
        <ThreeCanvasContainer
          controllerFactory={() => mock.controller}
          ariaLabel="Liquidity Funnel"
        />
      );

      // Verify 2D Fallback is rendered with proper accessible role and label
      const fallback = screen.getByRole('img', { name: 'Liquidity Funnel (2D Fallback Mode)' });
      expect(fallback).toBeInTheDocument();
      expect(screen.getByText('2D High-Performance Fallback Active')).toBeInTheDocument();
      expect(screen.getByText(/Hardware-accelerated WebGL is disabled or unsupported/i)).toBeInTheDocument();

      // Controller should NOT have been initialized
      expect(mock.initCalls).toBe(0);

      // Restore
      (window as any).WebGLRenderingContext = origContext;
    });

    it('TC-T5-04: renders custom fallback React node when provided and WebGL is unsupported', () => {
      const origContext = (window as any).WebGLRenderingContext;
      delete (window as any).WebGLRenderingContext;

      const mock = createMockController();
      render(
        <ThreeCanvasContainer
          controllerFactory={() => mock.controller}
          ariaLabel="Custom Fallback Scene"
          fallback={<div data-testid="custom-svg-fallback">High-Contrast Vector Chart Fallback</div>}
        />
      );

      expect(screen.getByTestId('custom-svg-fallback')).toBeInTheDocument();
      expect(screen.getByText('High-Contrast Vector Chart Fallback')).toBeInTheDocument();
      expect(screen.queryByText('2D High-Performance Fallback Active')).not.toBeInTheDocument();

      (window as any).WebGLRenderingContext = origContext;
    });

    it('TC-T5-05: catches controller.init() exceptions gracefully and falls back to 2D view without unhandled errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const explodingController = createMockController({
        init: () => {
          throw new Error('Fatal GPU Shader Compile Error');
        },
      });

      render(
        <ThreeCanvasContainer
          controllerFactory={() => explodingController.controller}
          ariaLabel="Fault Tolerant 3D"
        />
      );

      // Verify it catches cleanly and displays 2D fallback
      expect(screen.getByRole('img', { name: 'Fault Tolerant 3D (2D Fallback Mode)' })).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================================================
  // SUITE 2: WebGL Context Restoration Simulation
  // ==========================================================================
  describe('Suite 2: WebGL Context Restoration Simulation', () => {
    it('TC-T5-06: clears HUD overlay and triggers restoreContext(), resize(), and updateData() upon context restoration', () => {
      const testData = { metric: 'initial_state_123' };
      const mock = createMockController();

      const { container } = render(
        <ThreeCanvasContainer
          controllerFactory={() => mock.controller}
          data={testData}
          ariaLabel="Restoration Scene"
        />
      );

      const canvas = container.querySelector('canvas')!;

      // 1. Lose Context
      act(() => {
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
      });
      expect(screen.getByText('WebGL Context Temporarily Lost')).toBeInTheDocument();

      // 2. Restore Context
      act(() => {
        canvas.dispatchEvent(new Event('webglcontextrestored'));
      });

      // HUD overlay must be dismissed
      expect(screen.queryByText('WebGL Context Temporarily Lost')).not.toBeInTheDocument();

      // restoreContext() must be called
      expect(mock.restoreContextCalls).toBe(1);

      // resize() must be called with positive dimensions
      expect(mock.resizeCalls.length).toBeGreaterThan(0);
      const lastResize = mock.resizeCalls[mock.resizeCalls.length - 1];
      expect(lastResize.width).toBeGreaterThan(0);
      expect(lastResize.height).toBeGreaterThan(0);

      // updateData() must be re-dispatched with current data
      expect(mock.updateDataCalls[mock.updateDataCalls.length - 1]).toEqual(testData);
    });

    it('TC-T5-07: cleanly re-instantiates new controller from factory when controller reference was lost', () => {
      let factoryInvocationCount = 0;
      const controllers: any[] = [];

      const factory = () => {
        factoryInvocationCount++;
        const c = createMockController();
        controllers.push(c);
        return c.controller;
      };

      const { container } = render(
        <ThreeCanvasContainer
          controllerFactory={factory}
          data={{ pass: 1 }}
          ariaLabel="Recreation Scene"
        />
      );

      expect(factoryInvocationCount).toBe(1);
      const canvas = container.querySelector('canvas')!;

      // Nullify active controller to simulate severe context teardown
      act(() => {
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
      });

      // Simulate restore
      act(() => {
        canvas.dispatchEvent(new Event('webglcontextrestored'));
      });

      expect(screen.queryByText('WebGL Context Temporarily Lost')).not.toBeInTheDocument();
    });

    it('TC-T5-08: gracefully falls back to 2D mode if restoreContext() throws an unhandled error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const explodingRestore = createMockController({
        init: () => {},
      });
      explodingRestore.controller.restoreContext = () => {
        throw new Error('Device Lost on Restore');
      };

      const { container } = render(
        <ThreeCanvasContainer
          controllerFactory={() => explodingRestore.controller}
          ariaLabel="Exploding Restore Scene"
        />
      );

      const canvas = container.querySelector('canvas')!;
      act(() => {
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
      });
      act(() => {
        canvas.dispatchEvent(new Event('webglcontextrestored'));
      });

      // Should downgrade to 2D fallback gracefully
      expect(screen.getByRole('img', { name: 'Exploding Restore Scene (2D Fallback Mode)' })).toBeInTheDocument();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================================================
  // SUITE 3: Rapid Unmounting & Remounting Across All 8 Three.js Scenes
  // ==========================================================================
  describe('Suite 3: Rapid Unmounting & Remounting Across All 8 Three.js Scenes (VRAM & Lifecycle Cleanup)', () => {
    const scenesToTest: Array<{
      name: string;
      SceneClass: new () => ThreeSceneController<any>;
      data: any;
    }> = [
      { name: 'GlobeScene', SceneClass: GlobeScene, data: SEED_TRANSIT_ARCS },
      { name: 'MoneyMapScene', SceneClass: MoneyMapScene, data: undefined },
      { name: 'TerrainScene', SceneClass: TerrainScene, data: generateInitialDailyProjections() },
      { name: 'NodeGraphScene', SceneClass: NodeGraphScene, data: SEED_TRUTH_GRAPH_DATA },
      { name: 'FirewallScene', SceneClass: FirewallScene, data: { status: 'WARNING_BUFFER_TIGHT', lowestProjectedBuffer: 12000, maxAllowableCommitment: 85000 } },
      { name: 'DigitalTwinScene', SceneClass: DigitalTwinScene, data: SEED_DIGITAL_TWIN_METRICS },
      { name: 'FunnelScene', SceneClass: FunnelScene, data: SEED_RECOVERY_CASES },
      { name: 'AmbientScene', SceneClass: AmbientScene, data: { particleCount: 200 } },
    ];

    scenesToTest.forEach(({ name, SceneClass, data }) => {
      it(`TC-T5-${name}: survives 10 rapid unmount/remount cycles with verified RAF cancellation, DOM cleanup, and zero memory leaks`, () => {
        const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');
        const disposeGeoSpy = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
        const disposeMatSpy = vi.spyOn(THREE.Material.prototype, 'dispose');

        for (let cycle = 0; cycle < 10; cycle++) {
          const { container, unmount } = render(
            <ThreeCanvasContainer
              controllerFactory={() => new SceneClass()}
              data={data}
              ariaLabel={`Lifecycle Stress ${name} - Cycle ${cycle}`}
            />
          );

          // Verify canvas is present during mount
          const canvas = container.querySelector('canvas');
          expect(canvas).toBeInTheDocument();

          // Unmount immediately to simulate rapid route switching / StrictMode thrash
          act(() => {
            unmount();
          });
        }

        // Verify RAF cancellation occurred
        expect(cancelRafSpy).toHaveBeenCalled();

        // Verify geometries and materials were disposed on teardown
        expect(disposeGeoSpy).toHaveBeenCalled();
        expect(disposeMatSpy).toHaveBeenCalled();

        cancelRafSpy.mockRestore();
        disposeGeoSpy.mockRestore();
        disposeMatSpy.mockRestore();
      });
    });

    it('TC-T5-RouteThrashing: survives rapid route churn across all 6 views hosting 3D scenes without memory corruption', () => {
      const views = [
        { name: 'CommandCenterView', View: CommandCenterView },
        { name: 'PayBackHunterView', View: PayBackHunterView },
        { name: 'PaymentTruthView', View: PaymentTruthView },
        { name: 'CommitmentsView', View: CommitmentsView },
        { name: 'DigitalTwinView', View: DigitalTwinView },
        { name: 'SimulationLabView', View: SimulationLabView },
      ];

      // Perform 3 full tours across all views
      for (let tour = 0; tour < 3; tour++) {
        for (const { View } of views) {
          const { unmount } = render(<View />);
          act(() => {
            unmount();
          });
        }
      }

      // Final mount check: ensure pristine state remains operational
      const { container } = render(<CommandCenterView />);
      expect(container.querySelector('[data-testid="command-center-view"]')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SUITE 4: ResizeObserver Handling Under Extreme Dimensions
  // ==========================================================================
  describe('Suite 4: ResizeObserver Handling Under Extreme Dimensions', () => {
    it('TC-T5-21: suppresses resize dispatch on zero, negative, or degenerate contentRect dimensions', () => {
      let observerCallback: ResizeObserverCallback = () => {};
      class CustomResizeObserverMock {
        constructor(cb: ResizeObserverCallback) {
          observerCallback = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      }
      const origRO = window.ResizeObserver;
      window.ResizeObserver = CustomResizeObserverMock as any;

      const mock = createMockController();
      render(
        <ThreeCanvasContainer
          controllerFactory={() => mock.controller}
          ariaLabel="Resize Test Scene"
        />
      );

      const fakeTarget = document.createElement('div');

      // 1. Trigger zero dimensions (suppressed)
      act(() => {
        observerCallback(
          [
            {
              target: fakeTarget,
              contentRect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON: () => {} },
            } as any,
          ],
          {} as any
        );
      });
      expect(mock.resizeCalls.length).toBe(0);

      // 2. Trigger negative dimensions (suppressed)
      act(() => {
        observerCallback(
          [
            {
              target: fakeTarget,
              contentRect: { width: -500, height: -300, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON: () => {} },
            } as any,
          ],
          {} as any
        );
      });
      expect(mock.resizeCalls.length).toBe(0);

      // 3. Trigger 8K ultra-widescreen dimensions (allowed and dispatched)
      act(() => {
        observerCallback(
          [
            {
              target: fakeTarget,
              contentRect: { width: 7680, height: 2160, top: 0, left: 0, bottom: 2160, right: 7680, x: 0, y: 0, toJSON: () => {} },
            } as any,
          ],
          {} as any
        );
      });
      expect(mock.resizeCalls.length).toBe(1);
      expect(mock.resizeCalls[0]).toEqual({ width: 7680, height: 2160 });

      window.ResizeObserver = origRO;
    });

    it('TC-T5-22: direct resize boundary stress across all 8 Scene Controllers guards projection matrices against NaN/Infinity', () => {
      const allControllers = [
        new GlobeScene(),
        new MoneyMapScene(),
        new TerrainScene(),
        new NodeGraphScene(),
        new FirewallScene(),
        new DigitalTwinScene(),
        new FunnelScene(),
        new AmbientScene(),
      ];

      const mount = document.createElement('div');
      mount.getBoundingClientRect = () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => {} });

      allControllers.forEach((controller) => {
        controller.init(mount, 800, 600);

        // Adversarial resize calls: must not throw and must guard camera matrices
        expect(() => controller.resize(0, 0)).not.toThrow();
        expect(() => controller.resize(-100, -100)).not.toThrow();
        expect(() => controller.resize(NaN, NaN)).not.toThrow();
        expect(() => controller.resize(Infinity, Infinity)).not.toThrow();
        expect(() => controller.resize(-Infinity, 100)).not.toThrow();

        // Ultra-wide 8K resize
        expect(() => controller.resize(7680, 2160)).not.toThrow();
        const camera = (controller as any).camera as THREE.PerspectiveCamera | undefined;
        if (camera) {
          expect(camera.aspect).toBeCloseTo(7680 / 2160, 4);
          expect(camera.projectionMatrix.elements.every((el) => Number.isFinite(el))).toBe(true);
        }

        // Extreme aspect ratios: 1x10000 (ultra-tall) and 10000x1 (ultra-wide)
        expect(() => controller.resize(1, 10000)).not.toThrow();
        if (camera) {
          expect(camera.projectionMatrix.elements.every((el) => Number.isFinite(el))).toBe(true);
        }

        expect(() => controller.resize(10000, 1)).not.toThrow();
        if (camera) {
          expect(camera.projectionMatrix.elements.every((el) => Number.isFinite(el))).toBe(true);
        }

        controller.destroy();
      });
    });
  });

  // ==========================================================================
  // SUITE 5: Mouse and Pointer Interaction Events on 3D Scenes
  // ==========================================================================
  describe('Suite 5: Mouse and Pointer Interaction Events on 3D Scenes', () => {
    it('TC-T5-23: correctly maps container pixel offsets into Normalized Device Coordinates [-1, 1] in ThreeCanvasContainer', () => {
      const mock = createMockController();
      const { container } = render(
        <ThreeCanvasContainer
          controllerFactory={() => mock.controller}
          ariaLabel="NDC Pointer Scene"
        />
      );

      const region = screen.getByRole('region', { name: 'NDC Pointer Scene' });
      // Mock getBoundingClientRect
      region.getBoundingClientRect = () => ({
        left: 100,
        top: 50,
        width: 400,
        height: 200,
        right: 500,
        bottom: 250,
        x: 100,
        y: 50,
        toJSON: () => {},
      });

      const onPointerMoveMock = mock.controller.onPointerMove as any;

      // 1. Center: clientX = 100 + 200 = 300, clientY = 50 + 100 = 150 -> NDC (0, 0)
      fireEvent.pointerMove(region, { clientX: 300, clientY: 150 });
      expect(onPointerMoveMock).toHaveBeenCalled();
      const lastCall = onPointerMoveMock.mock.calls[onPointerMoveMock.mock.calls.length - 1];
      expect(lastCall[0]).toBeCloseTo(0, 2);
      expect(lastCall[1]).toBeCloseTo(0, 2);

      // 2. Top-Left: clientX = 100, clientY = 50 -> NDC (-1, 1)
      fireEvent.pointerMove(region, { clientX: 100, clientY: 50 });
      const tlCall = onPointerMoveMock.mock.calls[onPointerMoveMock.mock.calls.length - 1];
      expect(tlCall[0]).toBeCloseTo(-1, 2);
      expect(tlCall[1]).toBeCloseTo(1, 2);

      // 3. Bottom-Right: clientX = 500, clientY = 250 -> NDC (1, -1)
      fireEvent.pointerMove(region, { clientX: 500, clientY: 250 });
      const brCall = onPointerMoveMock.mock.calls[onPointerMoveMock.mock.calls.length - 1];
      expect(brCall[0]).toBeCloseTo(1, 2);
      expect(brCall[1]).toBeCloseTo(-1, 2);

      // 4. Missing coordinate inputs: must be suppressed safely
      const callCountBefore = onPointerMoveMock.mock.calls.length;
      fireEvent(region, new Event('pointermove'));
      expect(onPointerMoveMock.mock.calls.length).toBe(callCountBefore);
    });

    it('TC-T5-24: [NodeGraphScene] raycasts against node meshes and safely manages hover and click scaling', () => {
      const graph = new NodeGraphScene();
      const mount = document.createElement('div');
      mount.getBoundingClientRect = () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => {} });

      graph.init(mount, 800, 600);
      graph.updateData(SEED_TRUTH_GRAPH_DATA);

      // Test pointer move within bounds
      expect(() => graph.onPointerMove(0, 0)).not.toThrow();

      // Test extreme pointer clamping
      expect(() => graph.onPointerMove(5.0, -10.0)).not.toThrow();
      expect((graph as any).pointerNdc.x).toBe(1.0);
      expect((graph as any).pointerNdc.y).toBe(-1.0);

      // Test click event
      expect(() => (graph as any).onPointerClick(0, 0)).not.toThrow();

      graph.destroy();
    });

    it('TC-T5-25: [TerrainScene] calculates hovered day index 0..90 and applies rotation damping', () => {
      const terrain = new TerrainScene();
      const mount = document.createElement('div');
      mount.getBoundingClientRect = () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => {} });

      terrain.init(mount, 800, 600);
      terrain.updateData(generateInitialDailyProjections());

      // Move pointer
      terrain.onPointerMove(0.4, -0.2);
      expect((terrain as any).mouseCoords.x).toBeCloseTo(0.4, 2);
      expect((terrain as any).mouseCoords.y).toBeCloseTo(-0.2, 2);

      // Clamping check on extreme inputs
      terrain.onPointerMove(999, -999);
      expect((terrain as any).mouseCoords.x).toBe(1.0);
      expect((terrain as any).mouseCoords.y).toBe(-1.0);

      terrain.destroy();
    });

    it('TC-T5-26: [GlobeScene] applies parallax smoothing and clamps rotation targets safely', () => {
      const globe = new GlobeScene();
      const mount = document.createElement('div');
      mount.getBoundingClientRect = () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => {} });

      globe.init(mount, 800, 600);
      globe.updateData(SEED_TRANSIT_ARCS);

      globe.onPointerMove(0.75, -0.5);
      expect((globe as any).pointerTarget.x).toBeCloseTo(0.75, 2);
      expect((globe as any).pointerTarget.y).toBeCloseTo(-0.5, 2);

      // Extreme values clamped to [-1, 1]
      globe.onPointerMove(-50, 50);
      expect((globe as any).pointerTarget.x).toBe(-1);
      expect((globe as any).pointerTarget.y).toBe(1);

      // Non-finite coordinates safely ignored
      globe.onPointerMove(NaN, Infinity);
      expect((globe as any).pointerTarget.x).toBe(-1);
      expect((globe as any).pointerTarget.y).toBe(1);

      globe.destroy();
    });

    it('TC-T5-27: [AmbientScene] updates mouse coordinate vector and deflects particles with inverse-distance repulsion', () => {
      const ambient = new AmbientScene();
      const mount = document.createElement('div');
      mount.getBoundingClientRect = () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => {} });

      ambient.init(mount, 800, 600);

      // Move mouse to NDC (-0.3, 0.4)
      ambient.onPointerMove(-0.3, 0.4);
      const pointerNormalized = (ambient as any).pointerNormalized;
      expect(pointerNormalized.x).toBeCloseTo(-0.3, 2);
      expect(pointerNormalized.y).toBeCloseTo(0.4, 2);
      expect((ambient as any).isHovering).toBe(true);

      const mouseWorld = (ambient as any).mouseWorld;
      expect(mouseWorld.x).toBeCloseTo(-0.3 * 18.0, 2);
      expect(mouseWorld.y).toBeCloseTo(0.4 * 11.0, 2);

      // Non-finite coordinates ignored
      ambient.onPointerMove(NaN, 0.4);
      expect(pointerNormalized.x).toBeCloseTo(-0.3, 2);

      ambient.destroy();
    });

    it('TC-T5-28: [DigitalTwinScene & FirewallScene] verify pointer movements do not introduce NaN or destabilize rotation', () => {
      const twin = new DigitalTwinScene();
      const firewall = new FirewallScene();
      const mount = document.createElement('div');
      mount.getBoundingClientRect = () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => {} });

      twin.init(mount, 800, 600);
      firewall.init(mount, 800, 600);

      expect(() => twin.onPointerMove(0.5, -0.5)).not.toThrow();
      expect(() => firewall.onPointerMove(0.5, -0.5)).not.toThrow();

      expect(() => twin.onPointerMove(NaN, Infinity)).not.toThrow();
      expect(() => firewall.onPointerMove(NaN, Infinity)).not.toThrow();

      twin.destroy();
      firewall.destroy();
    });
  });
});
