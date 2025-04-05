/**
 * Build Process for Three.js Scene
 * This module handles the complete build workflow, including baking and preparing
 * the scene for presentation mode.
 */

import * as THREE from '../../lib/three/three.module.js';
import { bakeScene } from '../bake/bakeUtility.js';

// Build process state
const buildState = {
    isBuilding: false,
    originalScene: null,
    presentationScene: null,
    buildProgress: 0,
    currentStep: '',
    error: null
};

/**
 * Creates a simplified presentation version of the scene
 * @param {THREE.Scene} scene - The original scene
 * @returns {THREE.Scene} A new scene optimized for presentation
 */
function createPresentationScene(scene) {
    const presentationScene = new THREE.Scene();
    
    // Copy scene properties
    presentationScene.background = scene.background;
    presentationScene.environment = scene.environment;
    presentationScene.fog = scene.fog;
    
    // Clone all objects except lights and helpers
    scene.traverse(object => {
        if (object.isMesh && !object.isHelper) {
            const clone = object.clone();
            presentationScene.add(clone);
        }
    });
    
    return presentationScene;
}

/**
 * Optimizes the scene for presentation mode
 * @param {THREE.Scene} scene - The scene to optimize
 */
function optimizeScene(scene) {
    scene.traverse(object => {
        if (object.isMesh) {
            // Optimize geometry
            if (object.geometry) {
                object.geometry.computeVertexNormals();
                object.geometry.computeTangents();
            }
            
            // Optimize materials
            if (object.material) {
                // Disable real-time features
                object.material.needsUpdate = true;
                object.material.dispose = () => {}; // Prevent material disposal
                
                // Optimize textures
                if (object.material.map) {
                    object.material.map.anisotropy = 16;
                    object.material.map.needsUpdate = true;
                }
                
                if (object.material.normalMap) {
                    object.material.normalMap.anisotropy = 16;
                    object.material.normalMap.needsUpdate = true;
                }
                
                // Disable shadows for better performance
                object.castShadow = false;
                object.receiveShadow = false;
            }
        }
    });
}

/**
 * Creates a build progress UI
 * @returns {HTMLElement} The progress UI element
 */
function createBuildProgressUI() {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        padding: 20px;
        border-radius: 8px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
        min-width: 300px;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        text-align: center;
    `;
    title.textContent = 'Building Scene';

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        width: 100%;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        margin: 10px 0;
        overflow: hidden;
    `;

    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
        width: 0%;
        height: 100%;
        background: #4CAF50;
        transition: width 0.3s ease;
    `;
    progressFill.id = 'build-progress-fill';

    const status = document.createElement('div');
    status.style.cssText = `
        font-size: 14px;
        margin: 10px 0;
        text-align: center;
    `;
    status.id = 'build-status';

    const details = document.createElement('div');
    details.style.cssText = `
        font-size: 12px;
        color: #aaa;
        text-align: center;
    `;
    details.id = 'build-details';

    progressBar.appendChild(progressFill);
    container.appendChild(title);
    container.appendChild(progressBar);
    container.appendChild(status);
    container.appendChild(details);

    return container;
}

/**
 * Updates the build progress UI
 * @param {number} progress - Current progress (0-100)
 * @param {string} step - Current build step
 * @param {string} details - Additional details
 */
function updateBuildProgress(progress, step, details) {
    const progressFill = document.getElementById('build-progress-fill');
    const status = document.getElementById('build-status');
    const detailsElement = document.getElementById('build-details');

    if (progressFill) progressFill.style.width = `${progress}%`;
    if (status) status.textContent = step;
    if (detailsElement) detailsElement.textContent = details;
}

/**
 * Main build process function
 * @param {THREE.Scene} scene - The original scene to build
 * @returns {Promise<THREE.Scene>} A promise that resolves with the optimized presentation scene
 */
export async function buildScene(scene) {
    if (buildState.isBuilding) {
        throw new Error('Build process already running');
    }

    buildState.isBuilding = true;
    buildState.originalScene = scene;
    buildState.error = null;

    // Create and show progress UI
    const progressUI = createBuildProgressUI();
    document.body.appendChild(progressUI);

    try {
        // Step 1: Create presentation scene
        updateBuildProgress(0, 'Creating presentation scene', 'Initializing...');
        buildState.presentationScene = createPresentationScene(scene);
        buildState.buildProgress = 20;

        // Step 2: Bake lighting
        updateBuildProgress(20, 'Baking lighting', 'Calculating lightmaps...');
        await bakeScene(buildState.presentationScene);
        buildState.buildProgress = 60;

        // Step 3: Optimize scene
        updateBuildProgress(60, 'Optimizing scene', 'Applying optimizations...');
        optimizeScene(buildState.presentationScene);
        buildState.buildProgress = 100;

        // Clean up
        document.body.removeChild(progressUI);
        buildState.isBuilding = false;

        return buildState.presentationScene;
    } catch (error) {
        buildState.error = error;
        buildState.isBuilding = false;
        document.body.removeChild(progressUI);
        throw error;
    }
}

/**
 * Cancels the current build process
 */
export function cancelBuild() {
    if (buildState.isBuilding) {
        buildState.isBuilding = false;
        // Additional cleanup can be added here
    }
}

/**
 * Gets the current build state
 * @returns {Object} The current build state
 */
export function getBuildState() {
    return { ...buildState };
} 