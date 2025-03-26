// spotLight.js
import * as THREE from '../../lib/three/three.module.js';

export function createSpotLight(x, y, z) {
  // Create the spot light
  const spotLight = new THREE.SpotLight(0xff0000, 50);
  spotLight.position.set(x, y, z);
  spotLight.angle = Math.PI / 6; // 30 degrees
  spotLight.penumbra = 0.1;
  spotLight.decay = 2;
  spotLight.distance = 20;
  
  // Point the light downward
  spotLight.target.position.set(x, y - 1, z);

  // Create a helper
  const lightHelper = new THREE.SpotLightHelper(spotLight);

  return { 
    light: spotLight, 
    helper: lightHelper,
    target: spotLight.target // Need to add this to the scene as well
  };
} 