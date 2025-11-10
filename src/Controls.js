import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function setupControls(camera, domElement) {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    
    // For mobile, adjust touch controls if needed
    controls.enablePan = true;
    
    // Clamp vertical rotation
    controls.maxPolarAngle = Math.PI; // Allow looking from bottom
    controls.minPolarAngle = 0;

    return controls;
}