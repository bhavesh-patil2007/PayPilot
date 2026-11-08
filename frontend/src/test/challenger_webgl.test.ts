/**
 * challenger_webgl.test.ts
 * 
 * Empirical Adversarial Challenger Test Suite:
 * Stress-testing WebGL Lifecycle, ThreeCanvasContainer, Resource Disposal,
 * Context Loss HUD, Zero-Dimension Resizing, and 2D Fallbacks.
 */

import React from 'react';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  ThreeCanvasContainer,
  Default2DFallback,
  isWebGLAvailable,
} from '../components/3d/ThreeCanvasContainer';
import {
  disposeThreeScene,
  disposeObject3D,
  disposeMaterial,
  disposeTexture,
} from '../components/3d/utils/threeDisposal';
import type { ThreeSceneController } from '../types';

// Ensure WebGLRenderingContext and PointerEvent are defined in JSDOM so isWebGLAvailable() evaluates true
if (typeof window !== 'undefined') {
  if (!(window as any).WebGLRenderingContext) {
    (window as any).WebGLRenderingContext = class WebGLRenderingContext {};
  }
  if (!(window as any).PointerEvent) {
    (window as any).PointerEvent = window.MouseEvent;
  }
}

/**
 * Helper to build a mock ThreeSceneController that attaches a real canvas
 */
function createMockController(overrides?: Partial<ThreeSceneController>): {
  controller: ThreeSceneController;
  canvas: HTMLCanvasElement;
  initCalls: number;
  destroyCalls: number;
  resizeCalls: Array<{ width: number; height: number }>;
  updateDataCalls: any[];
} {
  const canvas = document.createElement('canvas');
  let initCalls = 0;
  let destroyCalls = 0;
  const resizeCalls: Array<{ width: number; height: number }> = [];
  const updateDataCalls: any[] = [];

  const controller: ThreeSceneController = {
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
  };
}

describe('Adversarial Stress Test: WebGL Lifecycle, Resource Disposal & Context Recovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (window as any).WebGLRenderingContext = class WebGLRenderingContext {};
  });

  afterEach(() => {
    cleanup();
  });

  // =========================================================================
  // 1. RAPID MOUNTING & UNMOUNTING STRESS TEST (100 CYCLES)
  // =========================================================================
  describe('1. Rapid Mounting & Unmounting Stress (100 Cycles)', () => {
    it('survives 100 rapid mount and unmount cycles without memory leaks or dangling listeners', () => {
      const totalCycles = 100;
      let totalCreated = 0;
      let totalDestroyed = 0;

      for (let i = 0; i < totalCycles; i++) {
        const { controller } = createMockController({
          init: () => {
            totalCreated++;
          },
          destroy: () => {
            totalDestroyed++;
          },
        });

        const { unmount } = render(
          React.createElement(ThreeCanvasContainer, {
            controllerFactory: () => controller,
            ariaLabel: `Stress Cycle ${i}`,
          })
        );

        // Immediate unmount simulating rapid route switches / tab thrashing
        unmount();
      }

      expect(totalCreated).toBe(totalCycles);
      expect(totalDestroyed).toBe(totalCycles);
    });

    it('handles interleaved rapid data updates and unmounts without calling destroyed controllers', () => {
      const { controller } = createMockController();
      const capturedData: number[] = [];
      controller.updateData = vi.fn((data: number) => {
        capturedData.push(data);
      });
      const stableFactory = () => controller;

      const { rerender, unmount } = render(
        React.createElement(ThreeCanvasContainer, {
          controllerFactory: stableFactory,
          data: 1,
        })
      );

      // Rapidly push 49 updates (2 through 50)
      for (let d = 2; d <= 50; d++) {
        rerender(
          React.createElement(ThreeCanvasContainer, {
            controllerFactory: stableFactory,
            data: d,
          })
        );
      }

      // Initial mount calls updateData in init effect + reactive data effect (2), plus 49 reactive updates = 51
      expect(capturedData.length).toBe(51);
      expect(capturedData[capturedData.length - 1]).toBe(50);

      // Unmount
      unmount();
      expect(controller.destroy).toHaveBeenCalledTimes(1);
    });

    it('simulates React 18 StrictMode double-mount without orphan resource duplication', () => {
      const { controller } = createMockController();
      const factory = vi.fn(() => controller);

      // Mount 1
      const { unmount } = render(
        React.createElement(ThreeCanvasContainer, { controllerFactory: factory })
      );
      // Unmount 1
      unmount();

      // Mount 2
      const { unmount: unmount2 } = render(
        React.createElement(ThreeCanvasContainer, { controllerFactory: factory })
      );

      expect(factory).toHaveBeenCalledTimes(2);
      expect(controller.init).toHaveBeenCalledTimes(2);
      expect(controller.destroy).toHaveBeenCalledTimes(1);

      // Final unmount
      unmount2();
      expect(controller.destroy).toHaveBeenCalledTimes(2);
    });

    it('empirically verifies factoryRef prevents canvas teardown and controller re-init across parent re-renders with fresh lambda references', () => {
      const { controller, canvas } = createMockController();
      const capturedUpdates: number[] = [];
      controller.updateData = vi.fn((data: number) => {
        capturedUpdates.push(data);
      });

      // Simulates parent component that passes a new inline arrow function on every re-render
      const ParentWrapper = ({ count }: { count: number }) => {
        return React.createElement(ThreeCanvasContainer, {
          controllerFactory: () => controller, // Brand new lambda reference every render!
          data: count,
          ariaLabel: 'Parent Rerender Test',
        });
      };

      const { rerender, container, unmount } = render(React.createElement(ParentWrapper, { count: 0 }));

      const mountDiv = container.querySelector('[role="region"]') as HTMLElement;
      expect(mountDiv).toBeInTheDocument();
      expect(mountDiv.contains(canvas)).toBe(true);
      expect(controller.init).toHaveBeenCalledTimes(1);
      expect(controller.destroy).toHaveBeenCalledTimes(0);

      // Re-render parent 50 times with new count state and fresh lambda factory
      for (let i = 1; i <= 50; i++) {
        rerender(React.createElement(ParentWrapper, { count: i }));
      }

      // Assert that canvas was NEVER torn down or removed
      expect(mountDiv.contains(canvas)).toBe(true);
      expect(controller.init).toHaveBeenCalledTimes(1);
      expect(controller.destroy).toHaveBeenCalledTimes(0);
      expect(capturedUpdates[capturedUpdates.length - 1]).toBe(50);

      // Final unmount should destroy cleanly exactly once
      unmount();
      expect(controller.destroy).toHaveBeenCalledTimes(1);
      expect(mountDiv.contains(canvas)).toBe(false);
    });
  });

  // =========================================================================
  // 2. RESOURCE DISPOSAL UTILITY ADVERSARIAL STRESS TEST (threeDisposal.ts)
  // =========================================================================
  describe('2. Comprehensive VRAM & Resource Disposal Engine (threeDisposal.ts)', () => {
    it('recursively disposes complex nested scene hierarchies (Groups, Meshes, Points, Lines)', () => {
      const scene = new THREE.Scene();
      const rootGroup = new THREE.Group();
      scene.add(rootGroup);

      const subGroup = new THREE.Group();
      rootGroup.add(subGroup);

      // 1. Mesh with BufferGeometry and Material
      const meshGeom = new THREE.BoxGeometry(1, 1, 1);
      const meshMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(meshGeom, meshMat);
      subGroup.add(mesh);

      // 2. Points with BufferGeometry and PointsMaterial
      const pointsGeom = new THREE.BufferGeometry();
      const pointsMat = new THREE.PointsMaterial({ size: 2 });
      const points = new THREE.Points(pointsGeom, pointsMat);
      subGroup.add(points);

      // 3. Line with BufferGeometry and LineBasicMaterial
      const lineGeom = new THREE.BufferGeometry();
      const lineMat = new THREE.LineBasicMaterial({ color: 0x0000ff });
      const line = new THREE.Line(lineGeom, lineMat);
      rootGroup.add(line);

      // Spies
      const meshGeomSpy = vi.spyOn(meshGeom, 'dispose');
      const meshMatSpy = vi.spyOn(meshMat, 'dispose');
      const pointsGeomSpy = vi.spyOn(pointsGeom, 'dispose');
      const pointsMatSpy = vi.spyOn(pointsMat, 'dispose');
      const lineGeomSpy = vi.spyOn(lineGeom, 'dispose');
      const lineMatSpy = vi.spyOn(lineMat, 'dispose');

      disposeThreeScene(scene);

      expect(meshGeomSpy).toHaveBeenCalledTimes(1);
      expect(meshMatSpy).toHaveBeenCalledTimes(1);
      expect(pointsGeomSpy).toHaveBeenCalledTimes(1);
      expect(pointsMatSpy).toHaveBeenCalledTimes(1);
      expect(lineGeomSpy).toHaveBeenCalledTimes(1);
      expect(lineMatSpy).toHaveBeenCalledTimes(1);
      expect(scene.children.length).toBe(0);
    });

    it('disposes multi-material arrays and every texture across all standard texture slots', () => {
      const scene = new THREE.Scene();
      const geom = new THREE.PlaneGeometry(2, 2);

      const textureKeys = [
        'map',
        'normalMap',
        'bumpMap',
        'roughnessMap',
        'metalnessMap',
        'alphaMap',
        'emissiveMap',
        'specularMap',
        'envMap',
        'lightMap',
        'aoMap',
        'displacementMap',
        'clearcoatMap',
        'clearcoatRoughnessMap',
        'gradientMap',
      ] as const;

      const mat1 = new THREE.MeshStandardMaterial();
      const textureSpies: any[] = [];

      textureKeys.forEach((key) => {
        const tex = new THREE.Texture();
        const spy = vi.spyOn(tex, 'dispose');
        textureSpies.push(spy);
        (mat1 as any)[key] = tex;
      });

      const mat2 = new THREE.MeshBasicMaterial();
      const tex2 = new THREE.Texture();
      const tex2Spy = vi.spyOn(tex2, 'dispose');
      textureSpies.push(tex2Spy);
      mat2.map = tex2;

      // Multi-material mesh
      const mesh = new THREE.Mesh(geom, [mat1, mat2]);
      scene.add(mesh);

      disposeThreeScene(scene);

      // Verify all textures disposed
      textureSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalled();
      });

      // Verify texture references nulled on materials
      textureKeys.forEach((key) => {
        expect((mat1 as any)[key]).toBeNull();
      });
      expect(mat2.map).toBeNull();
    });

    it('disposes textures bound to custom ShaderMaterial uniforms', () => {
      const scene = new THREE.Scene();
      const geom = new THREE.SphereGeometry(1, 16, 16);

      const uniformTex1 = new THREE.Texture();
      const uniformTex2 = new THREE.Texture();
      const spy1 = vi.spyOn(uniformTex1, 'dispose');
      const spy2 = vi.spyOn(uniformTex2, 'dispose');

      const shaderMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 1.0 }, // Primitive, should not crash
          uNullTex: { value: null }, // Null, should not crash
          uTextureA: { value: uniformTex1 },
          uTextureB: { value: uniformTex2 },
        },
      });

      const mesh = new THREE.Mesh(geom, shaderMat);
      scene.add(mesh);

      disposeThreeScene(scene);

      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(1);
      expect(shaderMat.uniforms.uTextureA.value).toBeNull();
      expect(shaderMat.uniforms.uTextureB.value).toBeNull();
    });

    it('calls image.close() if texture wraps an ImageBitmap or closeable image', () => {
      const tex = new THREE.Texture();
      const closeMock = vi.fn();
      (tex as any).image = { close: closeMock };

      const spy = vi.spyOn(tex, 'dispose');
      disposeTexture(tex);

      expect(closeMock).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('handles InstancedMesh flags and Light shadow maps without crashing', () => {
      const scene = new THREE.Scene();

      // InstancedMesh
      const geom = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshBasicMaterial();
      const instanced = new THREE.InstancedMesh(geom, mat, 5);
      scene.add(instanced);

      // Light with shadow map
      const light = new THREE.DirectionalLight();
      const shadowMap = new THREE.WebGLRenderTarget(512, 512);
      const shadowDisposeSpy = vi.spyOn(shadowMap, 'dispose');
      light.shadow.map = shadowMap as any;
      scene.add(light);

      disposeThreeScene(scene);

      expect(shadowDisposeSpy).toHaveBeenCalledTimes(1);
      expect(light.shadow.map).toBeNull();
      expect(scene.children.length).toBe(0);
    });

    it('disposes custom WebGLRenderTargets array and associated textures', () => {
      const scene = new THREE.Scene();
      const rt1 = new THREE.WebGLRenderTarget(256, 256);
      const rt2 = new THREE.WebGLRenderTarget(512, 512);

      const spy1 = vi.spyOn(rt1, 'dispose');
      const spy2 = vi.spyOn(rt2, 'dispose');
      const texSpy1 = vi.spyOn(rt1.texture, 'dispose');
      const texSpy2 = vi.spyOn(rt2.texture, 'dispose');

      disposeThreeScene(scene, null, [rt1, rt2]);

      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(1);
      expect(texSpy1).toHaveBeenCalledTimes(1);
      expect(texSpy2).toHaveBeenCalledTimes(1);
    });

    it('evicts WebGL context via WEBGL_lose_context extension and detaches canvas DOM', () => {
      const scene = new THREE.Scene();
      const containerDiv = document.createElement('div');
      const canvas = document.createElement('canvas');
      containerDiv.appendChild(canvas);
      document.body.appendChild(containerDiv);

      const loseContextMock = vi.fn();
      const mockRenderer: any = {
        domElement: canvas,
        renderLists: { dispose: vi.fn() },
        dispose: vi.fn(),
        forceContextLoss: vi.fn(),
        getContext: () => ({
          getExtension: (ext: string) => {
            if (ext === 'WEBGL_lose_context') {
              return { loseContext: loseContextMock };
            }
            return null;
          },
        }),
      };

      disposeThreeScene(scene, mockRenderer);

      expect(mockRenderer.renderLists.dispose).toHaveBeenCalledTimes(1);
      expect(mockRenderer.dispose).toHaveBeenCalledTimes(1);
      expect(mockRenderer.forceContextLoss).toHaveBeenCalledTimes(1);
      expect(loseContextMock).toHaveBeenCalledTimes(1);
      expect(canvas.parentNode).toBeNull(); // Detached from DOM

      document.body.removeChild(containerDiv);
    });

    it('gracefully tolerates errors during disposal without throwing', () => {
      const scene = new THREE.Scene();
      const faultyGeom = new THREE.BufferGeometry();
      vi.spyOn(faultyGeom, 'dispose').mockImplementation(() => {
        throw new Error('Corrupt GPU Buffer Reference');
      });

      const faultyMat = new THREE.MeshBasicMaterial();
      vi.spyOn(faultyMat, 'dispose').mockImplementation(() => {
        throw new Error('Material shader program already released');
      });

      const mesh = new THREE.Mesh(faultyGeom, faultyMat);
      scene.add(mesh);

      expect(() => {
        disposeThreeScene(scene);
      }).not.toThrow();

      // Graceful handling of null/undefined
      expect(() => disposeObject3D(null as any)).not.toThrow();
      expect(() => disposeMaterial(null)).not.toThrow();
      expect(() => disposeTexture(null)).not.toThrow();
      expect(() => disposeThreeScene(null as any)).not.toThrow();
    });
  });

  // =========================================================================
  // 3. WEBGL CONTEXT LOSS & RESTORATION HUD LIFECYCLE
  // =========================================================================
  describe('3. WebGL Context Loss Handling & Restoration HUD', () => {
    it('intercepts webglcontextlost, executes event.preventDefault(), and renders recovery HUD', () => {
      const { controller, canvas } = createMockController();

      render(
        React.createElement(ThreeCanvasContainer, {
          controllerFactory: () => controller,
          ariaLabel: 'Context Loss Test Scene',
        })
      );

      // Verify initial state: no context loss HUD
      expect(screen.queryByText(/WebGL Context Temporarily Lost/i)).toBeNull();

      // Trigger WebGL context loss event
      const contextLostEvent = new Event('webglcontextlost', {
        bubbles: true,
        cancelable: true,
      });

      act(() => {
        canvas.dispatchEvent(contextLostEvent);
      });

      // Assert event.preventDefault() was called
      expect(contextLostEvent.defaultPrevented).toBe(true);

      // Assert Recovery HUD is rendered
      expect(screen.getByText(/WebGL Context Temporarily Lost/i)).toBeInTheDocument();
      expect(
        screen.getByText(/GPU resources were reclaimed by the browser. Awaiting context restoration./i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Restoring GPU pipeline.../i)).toBeInTheDocument();
    });

    it('restores scene and dismisses HUD on webglcontextrestored', () => {
      const { controller, canvas } = createMockController();

      const { container } = render(
        React.createElement(ThreeCanvasContainer, {
          controllerFactory: () => controller,
          data: { testState: 'active' },
        })
      );

      // 1. Lose context
      const lostEvent = new Event('webglcontextlost', { cancelable: true });
      act(() => {
        canvas.dispatchEvent(lostEvent);
      });
      expect(screen.getByText(/WebGL Context Temporarily Lost/i)).toBeInTheDocument();

      // Mock mount dimensions
      const mountDiv = container.querySelector('[role="region"]') as HTMLElement;
      vi.spyOn(mountDiv, 'getBoundingClientRect').mockReturnValue({
        width: 640,
        height: 480,
        top: 0,
        left: 0,
        right: 640,
        bottom: 480,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // 2. Restore context
      const restoredEvent = new Event('webglcontextrestored');
      act(() => {
        canvas.dispatchEvent(restoredEvent);
      });

      // HUD dismissed
      expect(screen.queryByText(/WebGL Context Temporarily Lost/i)).toBeNull();

      // Controller resize and updateData called
      expect(controller.resize).toHaveBeenCalledWith(640, 480);
      expect(controller.updateData).toHaveBeenCalledWith({ testState: 'active' });
    });

    it('endures rapid repeated context loss/restore cycles without UI deadlock', () => {
      const { controller, canvas } = createMockController();

      render(
        React.createElement(ThreeCanvasContainer, {
          controllerFactory: () => controller,
        })
      );

      for (let i = 0; i < 5; i++) {
        // Lose
        const lost = new Event('webglcontextlost', { cancelable: true });
        act(() => {
          canvas.dispatchEvent(lost);
        });
        expect(lost.defaultPrevented).toBe(true);
        expect(screen.getByText(/WebGL Context Temporarily Lost/i)).toBeInTheDocument();

        // Restore
        const restored = new Event('webglcontextrestored');
        act(() => {
          canvas.dispatchEvent(restored);
        });
        expect(screen.queryByText(/WebGL Context Temporarily Lost/i)).toBeNull();
      }
    });
  });

  // =========================================================================
  // 4. ZERO-DIMENSION & BOUNDARY RESIZING RESILIENCE
  // =========================================================================
  describe('4. Zero-Dimension & Boundary Resizing Resilience', () => {
    let savedResizeObserver: any;
    let observerCallback: ((entries: any[]) => void) | null = null;

    beforeEach(() => {
      savedResizeObserver = window.ResizeObserver;
      observerCallback = null;

      class TestResizeObserver {
        constructor(cb: (entries: any[]) => void) {
          observerCallback = cb;
        }
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      }

      window.ResizeObserver = TestResizeObserver as any;
    });

    afterEach(() => {
      window.ResizeObserver = savedResizeObserver;
    });

    it('suppresses zero and negative dimension resize events to avoid NaN aspect ratios', () => {
      const { controller } = createMockController();

      render(
        React.createElement(ThreeCanvasContainer, {
          controllerFactory: () => controller,
        })
      );

      expect(observerCallback).toBeDefined();

      // Zero dimensions
      act(() => {
        observerCallback?.([{ contentRect: { width: 0, height: 0 } }]);
      });
      expect(controller.resize).not.toHaveBeenCalled();

      // Negative dimensions
      act(() => {
        observerCallback?.([{ contentRect: { width: -100, height: -50 } }]);
      });
      expect(controller.resize).not.toHaveBeenCalled();

      // Partial zero
      act(() => {
        observerCallback?.([{ contentRect: { width: 500, height: 0 } }]);
      });
      expect(controller.resize).not.toHaveBeenCalled();

      // Legitimate positive dimensions
      act(() => {
        observerCallback?.([{ contentRect: { width: 1024, height: 768 } }]);
      });
      expect(controller.resize).toHaveBeenCalledWith(1024, 768);
    });

    it('clamps initial container dimensions to minimum 100px if getBoundingClientRect returns 0', () => {
      const { controller } = createMockController();

      render(
        React.createElement(ThreeCanvasContainer, {
          controllerFactory: () => controller,
        })
      );

      // JSDOM getBoundingClientRect returns 0x0 by default
      // ThreeCanvasContainer applies Math.max(rect.width, 100)
      expect(controller.init).toHaveBeenCalledWith(expect.anything(), 100, 100);
    });

    it('guards normalized pointer calculations against division by zero on 0x0 container', () => {
      const { controller } = createMockController();

      const { container } = render(
        React.createElement(ThreeCanvasContainer, {
          controllerFactory: () => controller,
        })
      );

      const mountDiv = container.querySelector('[role="region"]') as HTMLElement;
      vi.spyOn(mountDiv, 'getBoundingClientRect').mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Fire pointer movement and click
      fireEvent.pointerMove(mountDiv, { clientX: 50, clientY: 50 });
      fireEvent.click(mountDiv, { clientX: 50, clientY: 50 });

      // Controller pointer handlers must NOT be called with NaN/division by zero
      expect(controller.onPointerMove).not.toHaveBeenCalled();
      expect(controller.onPointerClick).not.toHaveBeenCalled();
    });

    it('calculates exact OpenGL normalized device coordinates (-1 to +1) on valid dimensions', () => {
      const { controller } = createMockController();

      const { container } = render(
        React.createElement(ThreeCanvasContainer, {
          controllerFactory: () => controller,
        })
      );

      const mountDiv = container.querySelector('[role="region"]') as HTMLElement;
      vi.spyOn(mountDiv, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 200,
        top: 50,
        left: 100,
        right: 500,
        bottom: 250,
        x: 100,
        y: 50,
        toJSON: () => {},
      });

      // Top-Left: clientX = 100, clientY = 50 -> expected (-1, 1)
      fireEvent.pointerMove(mountDiv, { clientX: 100, clientY: 50 });
      expect(controller.onPointerMove).toHaveBeenLastCalledWith(-1, 1, expect.anything());

      // Center: clientX = 300, clientY = 150 -> expected (0, 0)
      fireEvent.pointerMove(mountDiv, { clientX: 300, clientY: 150 });
      const lastMove = (controller.onPointerMove as any).mock.calls.at(-1);
      expect(lastMove[0]).toBeCloseTo(0);
      expect(lastMove[1]).toBeCloseTo(0);

      // Bottom-Right: clientX = 500, clientY = 250 -> expected (1, -1)
      fireEvent.pointerMove(mountDiv, { clientX: 500, clientY: 250 });
      expect(controller.onPointerMove).toHaveBeenLastCalledWith(1, -1, expect.anything());

      // Center Click
      fireEvent.click(mountDiv, { clientX: 300, clientY: 150 });
      const lastClick = (controller.onPointerClick as any).mock.calls.at(-1);
      expect(lastClick[0]).toBeCloseTo(0);
      expect(lastClick[1]).toBeCloseTo(0);
    });

    it('empirically verifies non-finite pointer events (NaN, Infinity, -Infinity, null, undefined) do NOT produce NaN coordinates', () => {
      const { controller } = createMockController();

      const { container } = render(
        React.createElement(ThreeCanvasContainer, {
          controllerFactory: () => controller,
        })
      );

      const mountDiv = container.querySelector('[role="region"]') as HTMLElement;
      vi.spyOn(mountDiv, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 200,
        top: 0,
        left: 0,
        right: 400,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      const adversarialCoords = [
        { x: NaN, y: 100 },
        { x: 200, y: NaN },
        { x: Infinity, y: 100 },
        { x: 200, y: Infinity },
        { x: -Infinity, y: 100 },
        { x: 200, y: -Infinity },
        { x: undefined, y: 100 },
        { x: 200, y: undefined },
      ];

      for (const coords of adversarialCoords) {
        const moveEv = new Event('pointermove', { bubbles: true, cancelable: true });
        Object.defineProperty(moveEv, 'clientX', { value: coords.x });
        Object.defineProperty(moveEv, 'clientY', { value: coords.y });
        fireEvent(mountDiv, moveEv);

        const clickEv = new Event('click', { bubbles: true, cancelable: true });
        Object.defineProperty(clickEv, 'clientX', { value: coords.x });
        Object.defineProperty(clickEv, 'clientY', { value: coords.y });
        fireEvent(mountDiv, clickEv);
      }

      // Ensure that controller pointer methods were NEVER invoked with any of the adversarial inputs
      expect(controller.onPointerMove).not.toHaveBeenCalled();
      expect(controller.onPointerClick).not.toHaveBeenCalled();

      // Now fire valid event and ensure it STILL works correctly
      fireEvent.pointerMove(mountDiv, { clientX: 200, clientY: 100 });
      expect(controller.onPointerMove).toHaveBeenCalledTimes(1);
      const callArgs = (controller.onPointerMove as any).mock.calls[0];
      expect(callArgs[0]).toBeCloseTo(0);
      expect(callArgs[1]).toBeCloseTo(0);
      expect(Number.isFinite(callArgs[0])).toBe(true);
      expect(Number.isFinite(callArgs[1])).toBe(true);
    });
  });

  // =========================================================================
  // 5. 2D FALLBACK ROBUSTNESS & GRACEFUL DEGRADATION
  // =========================================================================
  describe('5. 2D Fallback Robustness & Fault Isolation', () => {
    it('renders Default2DFallback when WebGL is unavailable in browser context', () => {
      delete (window as any).WebGLRenderingContext;

      try {
        const { controller } = createMockController();
        render(
          React.createElement(ThreeCanvasContainer, {
            controllerFactory: () => controller,
            ariaLabel: 'Fallback Globe Effect',
          })
        );

        // Fallback elements
        expect(screen.getByRole('img')).toBeInTheDocument();
        expect(screen.getByText('Fallback Globe Effect')).toBeInTheDocument();
        expect(screen.getByText(/2D High-Performance Fallback Active/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Hardware-accelerated WebGL is disabled or unsupported./i)
        ).toBeInTheDocument();

        // Controller should not have been initialized
        expect(controller.init).not.toHaveBeenCalled();
      } finally {
        (window as any).WebGLRenderingContext = class WebGLRenderingContext {};
      }
    });

    it('renders custom fallback node when provided and WebGL is unavailable', () => {
      delete (window as any).WebGLRenderingContext;

      try {
        const customFallback = React.createElement(
          'div',
          { 'data-testid': 'custom-fallback' },
          'Custom 2D Chart View'
        );

        const { controller } = createMockController();
        render(
          React.createElement(ThreeCanvasContainer, {
            controllerFactory: () => controller,
            fallback: customFallback,
          })
        );

        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
        expect(screen.getByText('Custom 2D Chart View')).toBeInTheDocument();
      } finally {
        (window as any).WebGLRenderingContext = class WebGLRenderingContext {};
      }
    });

    it('catches runtime exception in controllerFactory or init and gracefully falls back to 2D view', () => {
      const crashingFactory = () => {
        throw new Error('Fatal GPU Pipeline Crash on Init');
      };

      // Suppress expected console.error during test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        React.createElement(ThreeCanvasContainer, {
          controllerFactory: crashingFactory as any,
          ariaLabel: 'Crashing Scene Test',
        })
      );

      // Container caught error and switched to 2D fallback without crashing React root
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByText('Crashing Scene Test')).toBeInTheDocument();
      expect(screen.getByText(/2D High-Performance Fallback Active/i)).toBeInTheDocument();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ThreeCanvasContainer] Initialization failed, using fallback:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
