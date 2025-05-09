import * as THREE from './lib/three/three.module.js';
import { OrbitControls } from './lib/three/controls/OrbitControls.js';
import { GLTFLoader } from './lib/three/loaders/GLTFLoader.js';
import { setupModelInteraction } from './modelInteraction.js';
import { setupCameraCollision } from './js/interaction/cameraCollision.js';
import { MenuManager } from './js/menus/menuManager.js';

// 1. Create Scene, Camera, Renderer
const scene = new THREE.Scene();
const modelPosition = new THREE.Vector3(300, -100, 0); // Model's actual position
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.background = new THREE.Color(0xffffff);
camera.lookAt(modelPosition);

// We'll use this as a default target for keyboard control, if needed.
const defaultTarget = new THREE.Vector3(300, -100, 0);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Use pointerdown and pointerup to detect true clicks vs drags
let pointerDownPos = null;

// 2. Create Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Now attach pointer events on the renderer's DOM element
renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDownPos = { x: event.clientX, y: event.clientY };
});
renderer.domElement.addEventListener('pointerup', (event) => {
  if (pointerDownPos) {
    const dx = event.clientX - pointerDownPos.x;
    const dy = event.clientY - pointerDownPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // If the pointer moved less than 5 pixels, treat as a click
    if (dist < 5) {
      // Convert pointer coordinates to normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const clickedPoint = intersects[0].point;
        // Update OrbitControls target only on a true click
        controls.target.copy(clickedPoint);
        controls.update();
      }
    }
  }
  pointerDownPos = null;
});

// 3. Add OrbitControls for Navigation
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false; // Disable damping for now
controls.zoomSpeed = 0.1;
controls.rotateSpeed = 0.1;
controls.screenSpacePanning = true;
controls.target.set(310, -10, -50);
controls.update();
controls.minDistance = 0.1;
controls.maxDistance = 1000;

// 4. Add Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 5);
scene.add(mainLight);

// Initialize MenuManager
const menuManager = new MenuManager(scene, camera);

// Setup model interaction
setupModelInteraction(scene, camera, renderer, controls, menuManager);

// Setup camera collision
setupCameraCollision(camera, controls, menuManager);

// 5. Create a LoadingManager to track progress of all assets
const loadingOverlay = document.getElementById('loadingOverlay');
const progressText = document.getElementById('progressText');
const progressRingCircle = document.querySelector('.progress-ring__circle');

const manager = new THREE.LoadingManager(
  // onLoad
  () => {
    setProgress(100);
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  },
  // onProgress
  (url, itemsLoaded, itemsTotal) => {
    const percentComplete = Math.round((itemsLoaded / itemsTotal) * 100);
    setProgress(percentComplete);
  },
  // onError
  (url) => {
    console.error('Error loading: ' + url);
  }
);

let highProgressStart = null;

function setProgress(percent) {
  // Clamp percentage between 0 and 100
  percent = Math.min(Math.max(percent, 0), 100);
  if (progressText) {
    progressText.textContent = `${Math.round(percent)}%`;
  }
  if (progressRingCircle) {
    const radius = progressRingCircle.r.baseVal.value; // should be 50
    const circumference = 2 * Math.PI * radius; // ~314
    const offset = circumference - (percent / 100) * circumference;
    progressRingCircle.style.strokeDashoffset = offset;
  }
  
  // If progress is 98% or above, record when that started
  if (percent >= 98) {
    if (!highProgressStart) {
      highProgressStart = Date.now();
    } else {
      const elapsed = Date.now() - highProgressStart;
      if (elapsed > 10000) { // 10 seconds
        // Force progress complete and hide overlay
        console.warn("Forcing progress complete due to timeout.");
        if (loadingOverlay) {
          loadingOverlay.style.display = 'none';
        }
      }
    }
  } else {
    // Reset if progress goes below 98%
    highProgressStart = null;
  }
}


// 6. Load the GLTF Model using the LoadingManager
const loader = new GLTFLoader(manager);
loader.load(
  'assets2/model.gltf',
  (gltf) => {
    scene.add(gltf.scene);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2));
    camera.position.set(center.x - 2, center.y + maxDim / 100, cameraDistance / 100 - 20);
    camera.lookAt(center);
  },
  // Remove the old onProgress callback since the manager handles it
  undefined,
  (error) => {
    console.error('Error loading GLTF model:', error);
  }
);

// 7. Handle Window Resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 8. Keyboard Control Setup
// We'll move both the camera and the OrbitControls target together.
const moveSpeed = 0.05;
const keyState = {};
window.addEventListener('keydown', (event) => {
  keyState[event.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (event) => {
  keyState[event.key.toLowerCase()] = false;
});
function updateCameraPosition() {
  const translation = new THREE.Vector3();
  if (keyState['w'] || keyState['arrowup']) {
    translation.z -= moveSpeed;
  }
  if (keyState['s'] || keyState['arrowdown']) {
    translation.z += moveSpeed;
  }
  if (keyState['a'] || keyState['arrowleft']) {
    translation.x -= moveSpeed;
  }
  if (keyState['d'] || keyState['arrowright']) {
    translation.x += moveSpeed;
  }
  if (keyState['q']) {
    translation.y += moveSpeed;
  }
  if (keyState['e']) {
    translation.y -= moveSpeed;
  }
  if (translation.lengthSq() > 0) {
    // Convert translation from local to world space based on camera orientation
    translation.applyQuaternion(camera.quaternion);
    // Move both camera and target together
    camera.position.add(translation);
    controls.target.add(translation);
    controls.update();
  }
}

// 9. Animation Loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update camera position based on keyboard input
  updateCameraPosition();
  
  // Update helpers that need it
  menuManager.helpersNeedingUpdate.forEach(helper => {
    if (helper && helper.update) {
      helper.update();
    }
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();
