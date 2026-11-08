/**
 * frontend/src/components/3d/scenes/index.ts
 * 
 * Unified export barrel for all 8 PayPilot Three.js Scene Controllers.
 * Provides typed access to each individual controller as well as a centralized
 * factory function and lookup registry.
 */

import { ThreeSceneController } from '../../../types';

import { GlobeScene } from './GlobeScene';
import { MoneyMapScene } from './MoneyMapScene';
import { AmbientScene } from './AmbientScene';
import { TerrainScene } from './TerrainScene';
import { FunnelScene } from './FunnelScene';
import { FirewallScene } from './FirewallScene';
import { NodeGraphScene } from './NodeGraphScene';
import { DigitalTwinScene } from './DigitalTwinScene';

// Re-export individual scene controllers
export {
  GlobeScene,
  MoneyMapScene,
  AmbientScene,
  TerrainScene,
  FunnelScene,
  FirewallScene,
  NodeGraphScene,
  DigitalTwinScene,
};

// Re-export core interface
export type { ThreeSceneController };

/**
 * Union of all supported 3D scene identifier keys.
 */
export type SceneType =
  | 'globe'
  | 'money-map'
  | 'ambient'
  | 'terrain'
  | 'funnel'
  | 'firewall'
  | 'node-graph'
  | 'digital-twin';

/**
 * Type-safe scene controller constructor dictionary.
 */
export const SCENE_CONTROLLER_MAP: Record<SceneType, new () => ThreeSceneController<any>> = {
  'globe': GlobeScene,
  'money-map': MoneyMapScene,
  'ambient': AmbientScene,
  'terrain': TerrainScene,
  'funnel': FunnelScene,
  'firewall': FirewallScene,
  'node-graph': NodeGraphScene,
  'digital-twin': DigitalTwinScene,
};

/**
 * Factory utility to instantiate a scene controller dynamically by its key.
 */
export function createSceneController<T = any>(type: SceneType): ThreeSceneController<T> {
  const ControllerClass = SCENE_CONTROLLER_MAP[type];
  if (!ControllerClass) {
    throw new Error(`[PayPilot 3D] Unknown scene type: "${type}". Available types: ${Object.keys(SCENE_CONTROLLER_MAP).join(', ')}`);
  }
  return new ControllerClass();
}
