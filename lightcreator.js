// lightcreator.js
import * as THREE from 'https://minhajfalaki.github.io/GLTFtry/lib/three/three.module.js';

/**
 * Creates a red point light at the specified position.
 * Also returns a small helper so you can see the light in the scene.
 */
export function createRedPointLight(x, y, z) {
  // 1. Create the point light
  const pointLight = new THREE.PointLight(0xff0000, 50, 20,2);
  pointLight.position.set(x, y, z);

  // 2. Create a helper (a small wireframe sphere)
  //    The second parameter is the sphere size in world units
  const lightHelper = new THREE.PointLightHelper(pointLight, 0.5, 0xff0000);

  // Return both so the caller can add them to the scene
  return { light: pointLight, helper: lightHelper };
}
