// modelInteraction.js
import * as THREE from 'lib/three/three.module.js';
import { TransformControls } from 'lib/three/controls/TransformControls.js';
import { createRedPointLight } from './lightcreator.js';

export function setupModelInteraction(scene, camera, renderer, orbitControls) {
  // 1. Create the red point light and helper from lightcreator.js
  const { light, helper } = createRedPointLight(310, 0, -20);
  scene.add(light);
  scene.add(helper);

  // 2. Create a TransformControls instance (do NOT add it directly to the scene)
  const transformControls = new TransformControls(camera, renderer.domElement);

  // Instead of scene.add(transformControls), we attach it to the light when selected
  // and then add its helper (gizmo) to the scene.
  let activeGizmo = null; // To store the helper that we add

  // Raycaster and mouse vector for selection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function updateMouse(event) {
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
  }

  // On pointerdown, check if the user clicked on the light's helper.
  renderer.domElement.addEventListener('pointerdown', (event) => {
    updateMouse(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(helper, true);
    if (intersects.length > 0) {
      // Attach TransformControls to the light
      transformControls.attach(light);
      // Get the helper (gizmo) for TransformControls
      const gizmo = transformControls.getHelper();
      // Optionally, set a name so we can identify it later
      gizmo.name = "transformGizmo";
      // Add the helper to the scene if not already added
      if (!activeGizmo) {
        scene.add(gizmo);
        activeGizmo = gizmo;
      }
    } else {
      // If clicking elsewhere, detach TransformControls and remove helper if present
      transformControls.detach();
      if (activeGizmo) {
        scene.remove(activeGizmo);
        activeGizmo = null;
      }
    }
  });

  // Disable OrbitControls while dragging TransformControls
  transformControls.addEventListener('dragging-changed', (event) => {
    if (orbitControls) orbitControls.enabled = !event.value;
  });

  // Optionally, listen to transform changes if you need to update something else
  transformControls.addEventListener('change', () => {
    // For example, re-render the scene if needed
    renderer.render(scene, camera);
  });

  // Return references in case you need them later
  return { light, helper, transformControls };
}
