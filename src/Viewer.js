import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { setupControls } from './Controls.js';

export class Viewer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.model = null;
        this.originalMaterials = new Map();
        this.transparentMaterial = new THREE.MeshPhongMaterial({
            color: 0xeeeeee,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
        });
    }

    init() {
        this.scene.background = new THREE.Color(0x333333);

        this.camera = new THREE.PerspectiveCamera(50, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 1, 3);
        
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        const ambient = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambient);
        const light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(1, 1, 1);
        this.scene.add(light);
        
        this.controls = setupControls(this.camera, this.renderer.domElement);
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.animate();
    }

    displayModel(model) {
        this.clearScene();
        this.model = model;
        
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / maxDim;

        this.model.scale.set(scale, scale, scale);
        this.model.position.sub(center.multiplyScalar(scale));

        this.scene.add(this.model);
        
        this.model.traverse(obj => {
            if (obj.isMesh) {
                this.originalMaterials.set(obj, obj.material);
            }
        });
        
        this.controls.target.copy(this.model.position);
        this.controls.update();
    }

    setModelTransparency(isTransparent) {
        if (!this.model) return;
        this.model.traverse(obj => {
            if (obj.isMesh) {
                obj.material = isTransparent ? this.transparentMaterial : this.originalMaterials.get(obj);
            }
        });
    }

    setCameraView(view) {
        const distance = 3;
        const target = this.model ? this.model.position : new THREE.Vector3(0,0,0);
        this.controls.target.copy(target);

        switch(view) {
            case 'front':
                this.camera.position.set(target.x, target.y, target.z + distance);
                break;
            case 'top':
                this.camera.position.set(target.x, target.y + distance, target.z);
                break;
            case 'side':
                this.camera.position.set(target.x + distance, target.y, target.z);
                break;
            case 'perspective':
                this.camera.position.set(target.x + distance * 0.7, target.y + distance * 0.7, target.z + distance * 0.7);
                break;
        }
        this.camera.lookAt(target);
        this.controls.update();
    }

    getIntersection(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);

        if (!this.model) return null;
        const intersects = this.raycaster.intersectObject(this.model, true);
        return intersects.length > 0 ? intersects[0] : null;
    }

    clearScene() {
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
            this.originalMaterials.clear();
        }
    }

    onWindowResize() {
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

