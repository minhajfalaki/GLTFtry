// menuManager.js
import * as THREE from '../../lib/three/three.module.js';
import { createPointLight } from '../loaders/pointLight.js';
import { createRectLight } from '../loaders/rectLight.js';
import { createSpotLight } from '../loaders/spotLight.js';
import { createChair } from '../loaders/chair.js';
import { createSofa } from '../loaders/sofa.js';
import { createDiningTable } from '../loaders/diningTable.js';
import { createDiningChair } from '../loaders/diningChair.js';
import { createCollisionBox } from '../loaders/collisionBox.js';
import { calculateSpawnPosition } from '../utils/spawner.js';

export class MenuManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.activeSubmenu = null;
    this.lights = []; // Store all created lights
    this.furniture = []; // Store all created furniture
    this.collisionBoxes = []; // Store all collision boxes
    this.transformControls = null; // Will be set by modelInteraction.js
    this.collisionTransformControls = null; // Will be set by collisionInteraction.js
    this.history = null; // Will be set by modelInteraction.js
    this.collisionHistory = null; // Will be set by collisionInteraction.js
    this.setupMenus();
  }

  setupMenus() {
    // Create main menu buttons
    const menuButtons = document.createElement('div');
    menuButtons.className = 'menu-buttons';
    document.body.appendChild(menuButtons);

    // Add Light button
    const addLightBtn = document.createElement('button');
    addLightBtn.className = 'menu-button';
    addLightBtn.textContent = 'Add Light';
    addLightBtn.onclick = () => this.showLightMenu();
    menuButtons.appendChild(addLightBtn);

    // Add Furniture button
    const addFurnitureBtn = document.createElement('button');
    addFurnitureBtn.className = 'menu-button';
    addFurnitureBtn.textContent = 'Add Furniture';
    addFurnitureBtn.onclick = () => this.showFurnitureMenu();
    menuButtons.appendChild(addFurnitureBtn);

    // Add Collision button
    const addCollisionBtn = document.createElement('button');
    addCollisionBtn.className = 'menu-button';
    addCollisionBtn.textContent = 'Add Collision';
    addCollisionBtn.onclick = () => this.handleCollisionSelection();
    menuButtons.appendChild(addCollisionBtn);

    // Create submenus
    this.createLightSubmenu();
    this.createFurnitureSubmenu();

    // Close submenus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-buttons') && !e.target.closest('.submenu')) {
        this.hideAllSubmenus();
      }
    });
  }

  createLightSubmenu() {
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.id = 'lightSubmenu';
    document.body.appendChild(submenu);

    const lightTypes = [
      { name: 'Point Light', icon: 'assets/icons/point-light.svg' },
      { name: 'Rectangular Light', icon: 'assets/icons/rect-light.svg' },
      { name: 'Spot Light', icon: 'assets/icons/spot-light.svg' }
    ];

    lightTypes.forEach(type => {
      const item = document.createElement('div');
      item.className = 'submenu-item';
      item.innerHTML = `
        <img src="${type.icon}" alt="${type.name}">
        <span>${type.name}</span>
      `;
      item.onclick = () => this.handleLightSelection(type.name);
      submenu.appendChild(item);
    });
  }

  createFurnitureSubmenu() {
    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.id = 'furnitureSubmenu';
    document.body.appendChild(submenu);

    const roomTypes = [
      { name: 'Living Room', icon: 'assets/icons/living-room.svg' },
      { name: 'Bed Room', icon: 'assets/icons/bed-room.svg' },
      { name: 'Kitchen', icon: 'assets/icons/kitchen.svg' }
    ];

    roomTypes.forEach(type => {
      const item = document.createElement('div');
      item.className = 'submenu-item';
      item.innerHTML = `
        <img src="${type.icon}" alt="${type.name}">
        <span>${type.name}</span>
      `;
      item.onclick = () => this.showFurnitureGrid(type.name);
      submenu.appendChild(item);
    });
  }

  createFurnitureGrid(roomType) {
    const grid = document.createElement('div');
    grid.className = 'submenu furniture-grid';
    grid.id = 'furnitureGrid';
    document.body.appendChild(grid);

    const furniture = {
      'Living Room': [
        { name: 'Chair', thumbnail: 'assets/thumbnails/chair.svg' },
        { name: 'Sofa', thumbnail: 'assets/thumbnails/sofa.svg' },
        { name: 'Dining Table', thumbnail: 'assets/thumbnails/dining-table.svg' },
        { name: 'Dining Chair', thumbnail: 'assets/thumbnails/dining-chair.svg' }
      ]
      // Add other room types later
    };

    furniture[roomType]?.forEach(item => {
      const furnitureItem = document.createElement('div');
      furnitureItem.className = 'furniture-item';
      furnitureItem.innerHTML = `
        <img src="${item.thumbnail}" alt="${item.name}">
        <span>${item.name}</span>
      `;
      furnitureItem.onclick = () => this.handleFurnitureSelection(roomType, item.name);
      grid.appendChild(furnitureItem);
    });

    return grid;
  }

  showLightMenu() {
    this.hideAllSubmenus();
    const submenu = document.getElementById('lightSubmenu');
    submenu.style.display = 'block';
    submenu.style.top = '70px';
    submenu.style.right = '20px';
    this.activeSubmenu = submenu;
  }

  showFurnitureMenu() {
    this.hideAllSubmenus();
    const submenu = document.getElementById('furnitureSubmenu');
    submenu.style.display = 'block';
    submenu.style.top = '70px';
    submenu.style.right = '20px';
    this.activeSubmenu = submenu;
  }

  showFurnitureGrid(roomType) {
    this.hideAllSubmenus();
    const grid = this.createFurnitureGrid(roomType);
    grid.style.display = 'grid';
    grid.style.top = '70px';
    grid.style.right = '20px';
    this.activeSubmenu = grid;
  }

  hideAllSubmenus() {
    document.querySelectorAll('.submenu').forEach(submenu => {
      submenu.style.display = 'none';
    });
    this.activeSubmenu = null;
  }

  handleLightSelection(type) {
    // Calculate position using the spawner utility
    const position = calculateSpawnPosition(this.camera, this.scene);

    let lightSetup;
    switch(type) {
      case 'Point Light':
        lightSetup = createPointLight(position.x, position.y, position.z);
        break;
      case 'Rectangular Light':
        lightSetup = createRectLight(position.x, position.y, position.z);
        break;
      case 'Spot Light':
        lightSetup = createSpotLight(position.x, position.y, position.z);
        // Add the target to the scene for spot lights
        if (lightSetup.target) {
          this.scene.add(lightSetup.target);
        }
        break;
      default:
        console.warn('Unknown light type:', type);
        return;
    }

    // Add the light and helper to the scene
    this.scene.add(lightSetup.light);
    this.scene.add(lightSetup.helper);
    this.lights.push(lightSetup);

    // Save state after adding new light
    if (this.history) {
      this.history.push();
    }

    this.hideAllSubmenus();
  }

  handleFurnitureSelection(roomType, furnitureName) {
    // Calculate position using the spawner utility
    const position = calculateSpawnPosition(this.camera, this.scene);

    let furnitureSetup;
    switch(furnitureName) {
      case 'Chair':
        furnitureSetup = createChair(position.x, position.y, position.z);
        break;
      case 'Sofa':
        furnitureSetup = createSofa(position.x, position.y, position.z);
        break;
      case 'Dining Table':
        furnitureSetup = createDiningTable(position.x, position.y, position.z);
        break;
      case 'Dining Chair':
        furnitureSetup = createDiningChair(position.x, position.y, position.z);
        break;
      default:
        console.warn('Unknown furniture type:', furnitureName);
        return;
    }

    // Add the furniture to the scene
    this.scene.add(furnitureSetup.helper);
    this.furniture.push(furnitureSetup);

    // Save state after adding new furniture
    if (this.history) {
      this.history.push();
    }

    this.hideAllSubmenus();
  }

  handleCollisionSelection() {
    // Calculate position using the spawner utility
    const position = calculateSpawnPosition(this.camera, this.scene);

    // Create a new collision box
    const collisionSetup = createCollisionBox(
      position.x,
      position.y,
      position.z,
      2, // default width
      2, // default height
      2  // default depth
    );

    // Add the collision box and helper to the scene
    this.scene.add(collisionSetup.collisionBox);
    this.scene.add(collisionSetup.helper);
    this.collisionBoxes.push(collisionSetup);

    // Save state after adding new collision box
    if (this.collisionHistory) {
      this.collisionHistory.push();
    }

    this.hideAllSubmenus();
  }

  // Add this new method to set the transform controls
  setTransformControls(transformControls) {
    this.transformControls = transformControls;
  }

  // Add this new method to set the history
  setHistory(history) {
    this.history = history;
  }

  // Add these new methods for collision box management
  setCollisionTransformControls(transformControls) {
    this.collisionTransformControls = transformControls;
  }

  setCollisionHistory(history) {
    this.collisionHistory = history;
  }

  // Rename this method to avoid conflict with the light creation method
  handleLightClick(event) {
    if (!this.transformControls) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, this.camera);

    // Check intersections with all light helpers
    const allObjects = this.lights.map(l => l.helper);
    const intersects = raycaster.intersectObjects(allObjects, true);

    if (intersects.length > 0) {
      // Find the topmost parent that is a light helper
      let selectedHelper = intersects[0].object;
      while (selectedHelper && !this.lights.some(l => l.helper === selectedHelper)) {
        selectedHelper = selectedHelper.parent;
      }
      
      // Find the corresponding light
      const selectedLight = this.lights.find(l => l.helper === selectedHelper);
      
      if (selectedLight) {
        this.transformControls.attach(selectedLight.light);
        // Add the transform gizmo to the scene
        const gizmo = this.transformControls.getHelper();
        gizmo.name = "transformGizmo";
        this.scene.add(gizmo);
      }
    } else {
      // If clicking elsewhere, detach TransformControls
      this.transformControls.detach();
      const gizmo = this.scene.getObjectByName("transformGizmo");
      if (gizmo) {
        this.scene.remove(gizmo);
      }
    }
  }
} 