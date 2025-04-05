// furnitureloader.js
import * as THREE from './lib/three/three.module.js';
import { FBXLoader } from './lib/three/loaders/FBXLoader.js';

/**
 * Creates a chair model at the specified position.
 * Returns both the chair model and its helper for selection.
 */
export function createChair(x, y, z) {
  // Create a small helper sphere (similar to light helper)
  const helper = new THREE.Group(); // Use a group instead of a mesh
  const helperSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16), // Made bigger and smoother
    new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, // Changed color to be more visible
      wireframe: true,
      transparent: true,
      opacity: 0.8
    })
  );
  helperSphere.name = 'chairHelper'; // Add name for identification
  helper.add(helperSphere);
  helper.position.set(x, y, z);
  
  // Create the FBX loader
  const fbxLoader = new FBXLoader();
  
  // Create a promise to handle the async loading
  const loadPromise = new Promise((resolve, reject) => {
    // Load the chair model
    fbxLoader.load(
      'models/chair.FBX',
      (object) => {
        console.log('Loaded FBX structure:', object);
        
        // Process the loaded model
        object.traverse((child) => {
          if (child.isMesh) {
            // Apply default material if none exists
            if (!child.material) {
              child.material = new THREE.MeshPhongMaterial({
                color: 0x808080,
                side: THREE.DoubleSide
              });
            }
          }
        });
        
        // Set the chair's position and scale
        object.position.set(0, 0, 0); // Position relative to helper
        object.scale.set(0.01, 0.01, 0.01); // Scale as before
        
        // Store references both ways for easier access
        helper.userData.chair = object;
        object.userData.helper = helper;
        helperSphere.userData.chair = object;
        
        // Add the chair to the helper
        helper.add(object);
        
        // Log the final structure
        console.log('Final helper structure:', helper);
        
        resolve({ chair: object, helper });
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Error loading chair:', error);
        reject(error);
      }
    );
  });

  // Return the helper immediately and the promise for the loaded chair
  return { 
    chair: null, // Will be set when loaded
    helper,
    loadPromise 
  };
} 