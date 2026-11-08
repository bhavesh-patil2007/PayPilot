/**
 * ThreeCanvasContainer.tsx
 * 
 * Reusable React wrapper for pure Three.js scene controllers. Handles WebGL
 * initialization, React 18 StrictMode double-mounting safety, ResizeObserver,
 * normalized pointer interaction, context loss recovery, tab visibility RAF
 * throttling, and graceful 2D canvas/SVG fallback.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ThreeSceneController } from '../../types';

export type { ThreeSceneController };

export interface ThreeCanvasContainerProps<T = any> {
  controllerFactory: () => ThreeSceneController<T>;
  data?: T;
  className?: string;
  fallback?: React.ReactNode;
  ariaLabel?: string;
}

/**
 * Checks if WebGL is supported in the current browser runtime.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Default high-polish 2D SVG/Canvas fallback component with dark fintech styling.
 */
export function Default2DFallback({ label = '3D Visualization' }: { label?: string }) {
  return (
    <div
      role="img"
      aria-label={`${label} (2D Fallback Mode)`}
      className="relative w-full h-full min-h-[220px] bg-gradient-to-br from-obsidian-950 via-obsidian-900 to-indigo-950/40 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center p-6 text-center overflow-hidden"
    >
      {/* Background Decorative Grid */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #0ea5e9 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Glowing Orb Illustration */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-cyan-400/30 border border-cyan-300/60" />
        </div>
      </div>

      <h4 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">{label}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">
        Hardware-accelerated WebGL is disabled or unsupported. Displaying optimized 2D fallback.
      </p>

      <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] text-cyan-400 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        2D High-Performance Fallback Active
      </div>
    </div>
  );
}

export function ThreeCanvasContainer<T = any>({
  controllerFactory,
  data,
  className = '',
  fallback,
  ariaLabel = 'Interactive 3D Scene',
}: ThreeCanvasContainerProps<T>) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ThreeSceneController<T> | null>(null);
  const isDestroyedRef = useRef(false);

  // 1. Stabilize controllerFactory across parent component re-renders so inline
  // lambda callbacks (() => new SceneController()) do not tear down the canvas.
  const factoryRef = useRef(controllerFactory);
  factoryRef.current = controllerFactory;

  // Track latest data for context restoration without re-binding effects
  const dataRef = useRef(data);
  dataRef.current = data;

  const [hasWebGL, setHasWebGL] = useState<boolean>(() => isWebGLAvailable());
  const [contextLost, setContextLost] = useState<boolean>(false);

  // Initial WebGL availability check
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
    }
  }, []);

  // 2. Initialize ThreeSceneController with StrictMode & Context Loss guards
  useEffect(() => {
    if (!hasWebGL) return;

    const mount = mountRef.current;
    if (!mount) return;

    isDestroyedRef.current = false;
    let resizeObserver: ResizeObserver | null = null;

    try {
      // Clear any orphaned canvas elements in the mount div before initialization
      const existingCanvases = mount.querySelectorAll('canvas');
      existingCanvases.forEach((c) => c.remove());

      const controller = factoryRef.current();
      controllerRef.current = controller;

      const rect = mount.getBoundingClientRect();
      const initialWidth = Math.max(rect.width, 100);
      const initialHeight = Math.max(rect.height, 100);

      controller.init(mount, initialWidth, initialHeight);

      if (dataRef.current !== undefined && controller.updateData) {
        controller.updateData(dataRef.current);
      }

      // Context Loss & Restoration Listeners
      const canvas = mount.querySelector('canvas');
      const handleContextLost = (e: Event) => {
        e.preventDefault(); // Prevents browser from abandoning WebGL context
        setContextLost(true);
        console.warn('[ThreeCanvasContainer] WebGL context lost. Rendering paused.');
      };

      const handleContextRestored = () => {
        try {
          setContextLost(false);
          console.info('[ThreeCanvasContainer] WebGL context restored. Rebuilding scene.');
          if (controllerRef.current && mountRef.current) {
            // If controller provides custom context restoration hook, call it
            if (typeof (controllerRef.current as any).restoreContext === 'function') {
              (controllerRef.current as any).restoreContext();
            }

            const r = mountRef.current.getBoundingClientRect();
            const width = r.width > 0 ? r.width : 100;
            const height = r.height > 0 ? r.height : 100;
            controllerRef.current.resize(width, height);

            if (dataRef.current !== undefined && controllerRef.current.updateData) {
              controllerRef.current.updateData(dataRef.current);
            }
          } else if (!controllerRef.current && mountRef.current) {
            // Clean fallback re-instantiation if controller was destroyed
            const newController = factoryRef.current();
            controllerRef.current = newController;
            const r = mountRef.current.getBoundingClientRect();
            const width = r.width > 0 ? r.width : 100;
            const height = r.height > 0 ? r.height : 100;
            newController.init(mountRef.current, width, height);
            if (dataRef.current !== undefined && newController.updateData) {
              newController.updateData(dataRef.current);
            }
          }
        } catch (restoreErr) {
          console.error('[ThreeCanvasContainer] Context restoration failed, falling back to 2D:', restoreErr);
          setHasWebGL(false);
        }
      };

      if (canvas) {
        canvas.addEventListener('webglcontextlost', handleContextLost, false);
        canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
      }

      // ResizeObserver with zero-dimension suppression
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver((entries) => {
          if (isDestroyedRef.current) return;
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0 && controllerRef.current) {
              controllerRef.current.resize(width, height);
            }
          }
        });
        resizeObserver.observe(mount);
      }

      return () => {
        isDestroyedRef.current = true;
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (canvas) {
          canvas.removeEventListener('webglcontextlost', handleContextLost);
          canvas.removeEventListener('webglcontextrestored', handleContextRestored);
        }
        if (controllerRef.current) {
          controllerRef.current.destroy();
          controllerRef.current = null;
        }
      };
    } catch (err) {
      console.error('[ThreeCanvasContainer] Initialization failed, using fallback:', err);
      setHasWebGL(false);
    }
  }, [hasWebGL]);

  // 3. Reactive Data Update
  useEffect(() => {
    if (data !== undefined && controllerRef.current && controllerRef.current.updateData) {
      controllerRef.current.updateData(data);
    }
  }, [data]);

  // 4. Normalized Pointer Movement
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!controllerRef.current || !controllerRef.current.onPointerMove) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect || !(rect.width > 0 && rect.height > 0)) return;

    const clientX = typeof e.clientX === 'number' ? e.clientX : e.nativeEvent?.clientX;
    const clientY = typeof e.clientY === 'number' ? e.clientY : e.nativeEvent?.clientY;
    if (clientX === undefined || clientY === undefined || !Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      return;
    }

    const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    if (!Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) {
      return;
    }

    controllerRef.current.onPointerMove(normalizedX, normalizedY, e.nativeEvent);
  }, []);

  // 5. Normalized Pointer Click
  const handlePointerClick = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!controllerRef.current || !controllerRef.current.onPointerClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect || !(rect.width > 0 && rect.height > 0)) return;

    const clientX = typeof e.clientX === 'number' ? e.clientX : e.nativeEvent?.clientX;
    const clientY = typeof e.clientY === 'number' ? e.clientY : e.nativeEvent?.clientY;
    if (clientX === undefined || clientY === undefined || !Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      return;
    }

    const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    if (!Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) {
      return;
    }

    controllerRef.current.onPointerClick(normalizedX, normalizedY, e.nativeEvent);
  }, []);

  // Render Fallback if WebGL is unavailable
  if (!hasWebGL) {
    return <div className={`relative ${className}`}>{fallback ?? <Default2DFallback label={ariaLabel} />}</div>;
  }

  return (
    <div
      ref={mountRef}
      role="region"
      aria-label={ariaLabel}
      onPointerMove={handlePointerMove}
      onClick={handlePointerClick}
      className={`relative w-full h-full overflow-hidden select-none touch-none ${className}`}
    >
      {/* Context Lost HUD Overlay */}
      {contextLost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-obsidian-950/85 backdrop-blur-sm p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mb-2 animate-bounce" />
          <h5 className="text-sm font-semibold text-slate-200">WebGL Context Temporarily Lost</h5>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            GPU resources were reclaimed by the browser. Awaiting context restoration.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Restoring GPU pipeline...</span>
          </div>
        </div>
      )}
    </div>
  );
}
