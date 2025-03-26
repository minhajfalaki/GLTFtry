// rectLight.js
import * as THREE from '../../lib/three/three.module.js';
import { RectAreaLight } from '../../lib/three/three.module.js';
import { RectAreaLightHelper } from '../../lib/three/helpers/RectAreaLightHelper.js';

export function createRectLight(x, y, z) {
  // Create the rectangular light
  const width = 10;
  const height = 5;
  const intensity = 50;
  const rectLight = new RectAreaLight(0xff0000, intensity, width, height);
  rectLight.position.set(x, y, z);
  rectLight.lookAt(x, y - 1, z); // Point slightly downward

  // Create a helper
  const lightHelper = new RectAreaLightHelper(rectLight);

  return { light: rectLight, helper: lightHelper };
} 