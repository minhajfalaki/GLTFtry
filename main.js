import * as THREE from './node_modules/three/build/three.module.js';

import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';

import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';


// 1. Create Scene, Camera, Renderer
const scene = new THREE.Scene();
const modelPosition = new THREE.Vector3(300, -100, 0); // Model’s actual position
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Move the camera slightly away from the model and above
// camera.position.set(30, 0, 0); // Set the camera position
// camera.rotation.set(-0.402, -0.630, -0.245); // Set the rotation
scene.background = new THREE.Color(0xffffff); // Change to any color (hex)
// const axesHelper = new THREE.AxesHelper(50); // Adjust size as needed
// scene.add(axesHelper);

// Make the camera look at the model
camera.lookAt(modelPosition);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
    // Convert mouse click position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast a ray from the camera to the clicked position
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with the model
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clickedPoint = intersects[0].point; // Get the first intersected point

        // Set OrbitControls' target to the clicked point
        controls.target.copy(clickedPoint);
        controls.update(); // Update the controls
    }
});

 // Adjust camera position

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Add OrbitControls for Navigation
const controls = new OrbitControls(camera, renderer.domElement);


controls.enableDamping = true;  // Smooth movement
controls.dampingFactor = 0.05;
controls.zoomSpeed = 0.1; // Reduce zoom speed (default is 1.0)
controls.screenSpacePanning = true;
controls.target.set(310, -10, -50);
controls.update();
controls.minDistance = 0.1;       // Minimum zoom-in distance
controls.maxDistance = 1000;      // Maximum zoom-out distance


// 3. Add Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft global light
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 5);
scene.add(mainLight);

// 4. Load the GLTF Model
const loader = new GLTFLoader();
loader.load('assets2/model.gltf', (gltf) => {
    scene.add(gltf.scene);
    // Compute the bounding box of the loaded model
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2));

    camera.position.set(center.x-2, center.y -10 + maxDim / 100, cameraDistance / 100-20);  // Move closer
    camera.lookAt(center);
});

// 5. Handle Window Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


console.log("Camera Position:", camera.position);
console.log("Camera Rotation:", camera.rotation);

// 6. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();  // Required for damping
    renderer.render(scene, camera);
}
animate();
