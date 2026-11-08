/**
 * threeDisposal.ts
 * 
 * Comprehensive recursive VRAM and GPU resource disposal utility for Three.js.
 * Frees geometries, materials, textures, render targets, and forces WebGL
 * context eviction to prevent browser WebGL context exhaustion across SPA route transitions.
 */

import * as THREE from 'three';

/**
 * Standard texture properties checked on Three.js materials.
 */
const TEXTURE_KEYS = [
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

/**
 * Disposes a single Three.js texture safely.
 */
export function disposeTexture(texture: THREE.Texture | null | undefined): void {
  if (!texture || typeof texture.dispose !== 'function') return;
  try {
    if ((texture as any).image && typeof (texture as any).image.close === 'function') {
      (texture as any).image.close();
    }
    texture.dispose();
  } catch (err) {
    console.warn('[threeDisposal] Failed to dispose texture:', err);
  }
}

/**
 * Disposes a single Three.js material and all textures bound to its properties or uniforms.
 */
export function disposeMaterial(material: THREE.Material | null | undefined): void {
  if (!material) return;

  // 1. Dispose bound standard textures
  for (const key of TEXTURE_KEYS) {
    const tex = (material as any)[key];
    if (tex && (tex as THREE.Texture).isTexture) {
      disposeTexture(tex);
      (material as any)[key] = null;
    }
  }

  // 2. Dispose custom ShaderMaterial uniforms
  if ((material as THREE.ShaderMaterial).uniforms) {
    const uniforms = (material as THREE.ShaderMaterial).uniforms;
    for (const uniformName of Object.keys(uniforms)) {
      const u = uniforms[uniformName];
      if (u && u.value && (u.value as THREE.Texture).isTexture) {
        disposeTexture(u.value);
        u.value = null;
      }
    }
  }

  // 3. Dispose the material program itself
  try {
    material.dispose();
  } catch (err) {
    console.warn('[threeDisposal] Failed to dispose material:', err);
  }
}

/**
 * Traverses an Object3D hierarchy and disposes geometries, materials, and textures.
 */
export function disposeObject3D(object: THREE.Object3D): void {
  if (!object) return;

  object.traverse((child: THREE.Object3D) => {
    // Handle Meshes, Points, and Lines
    if (
      (child as THREE.Mesh).isMesh ||
      (child as THREE.Points).isPoints ||
      (child as THREE.Line).isLine
    ) {
      const item = child as THREE.Mesh;

      // Dispose Geometry
      if (item.geometry) {
        try {
          item.geometry.dispose();
        } catch (err) {
          console.warn('[threeDisposal] Failed to dispose geometry:', err);
        }
      }

      // Dispose Material(s)
      if (item.material) {
        if (Array.isArray(item.material)) {
          item.material.forEach((mat) => disposeMaterial(mat));
        } else {
          disposeMaterial(item.material);
        }
      }
    }

    // Handle InstancedMesh buffers
    if ((child as THREE.InstancedMesh).isInstancedMesh) {
      const instanced = child as THREE.InstancedMesh;
      if (instanced.instanceMatrix) {
        instanced.instanceMatrix.needsUpdate = false;
      }
      if (instanced.instanceColor) {
        instanced.instanceColor.needsUpdate = false;
      }
    }

    // Handle Light Shadows
    if ((child as THREE.Light).isLight) {
      const light = child as THREE.Light;
      if (light.shadow && light.shadow.map) {
        light.shadow.map.dispose();
        light.shadow.map = null;
      }
    }
  });
}

/**
 * Complete teardown of an entire Three.js Scene and WebGLRenderer.
 * Evicts scene graph, render lists, and forces browser context reclamation.
 */
export function disposeThreeScene(
  scene: THREE.Scene,
  renderer?: THREE.WebGLRenderer | null,
  renderTargets: THREE.WebGLRenderTarget[] = []
): void {
  if (!scene) return;

  // 1. Dispose all objects in the scene graph
  disposeObject3D(scene);

  // 2. Remove all children from scene
  while (scene.children.length > 0) {
    const child = scene.children[0];
    scene.remove(child);
  }

  // 3. Dispose custom Render Targets
  for (const target of renderTargets) {
    if (target && typeof target.dispose === 'function') {
      try {
        if (target.texture) target.texture.dispose();
        target.dispose();
      } catch (err) {
        console.warn('[threeDisposal] Failed to dispose render target:', err);
      }
    }
  }

  // 4. Teardown WebGLRenderer and reclaim browser context slot
  if (renderer) {
    try {
      renderer.renderLists?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();

      // Explicitly trigger WEBGL_lose_context extension to free slot immediately
      const gl = renderer.getContext();
      if (gl && typeof (gl as any).getExtension === 'function') {
        const loseContextExt = gl.getExtension('WEBGL_lose_context');
        if (loseContextExt && typeof loseContextExt.loseContext === 'function') {
          loseContextExt.loseContext();
        }
      }

      // Remove canvas from DOM if still attached
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    } catch (err) {
      console.warn('[threeDisposal] Renderer disposal encountered minor error:', err);
    }
  }
}
