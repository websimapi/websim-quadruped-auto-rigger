import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export class ModelLoader {
    constructor(viewer) {
        this.viewer = viewer;
        this.gltfLoader = new GLTFLoader();
        this.fbxLoader = new FBXLoader();
        this.objLoader = new OBJLoader();
    }

    async load(file) {
        const url = URL.createObjectURL(file);
        const extension = file.name.split('.').pop().toLowerCase();

        return new Promise((resolve, reject) => {
            let loader;
            if (extension === 'glb' || extension === 'gltf') {
                loader = this.gltfLoader;
            } else if (extension === 'fbx') {
                loader = this.fbxLoader;
            } else if (extension === 'obj') {
                loader = this.objLoader;
            } else {
                reject(new Error('Unsupported file format'));
                return;
            }

            loader.load(url, (result) => {
                URL.revokeObjectURL(url);
                const model = result.scene || result;
                resolve(model);
            }, undefined, (error) => {
                URL.revokeObjectURL(url);
                reject(error);
            });
        });
    }
}

