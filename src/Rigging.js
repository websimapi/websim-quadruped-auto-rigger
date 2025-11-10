import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const CAT_MARKERS = [
    { name: 'Nose', color: 0xff0000 },
    { name: 'Neck', color: 0xff8800 },
    { name: 'Withers (Shoulder Top)', color: 0xffff00 },
    { name: 'Tail Base', color: 0x00ff00 },
    { name: 'Front Left Paw', color: 0x00ffff },
    { name: 'Front Right Paw', color: 0x0000ff },
    { name: 'Back Left Paw', color: 0xff00ff },
    { name: 'Back Right Paw', color: 0xffffff },
];

export class Rigging {
    constructor(viewer) {
        this.viewer = viewer;
        this.markers = new Map();
        this.markerMeshes = new THREE.Group();
        this.currentMarkerIndex = 0;
        this.viewer.scene.add(this.markerMeshes);
        this.skeletonHelper = null;
        this.transformControls = null;
    }

    placeNextMarker(position) {
        if (this.currentMarkerIndex >= CAT_MARKERS.length) return;

        const markerInfo = CAT_MARKERS[this.currentMarkerIndex];
        const markerName = markerInfo.name;

        let markerMesh = this.markers.get(markerName);
        if (!markerMesh) {
            const geometry = new THREE.SphereGeometry(0.03, 16, 16);
            const material = new THREE.MeshBasicMaterial({ color: markerInfo.color });
            markerMesh = new THREE.Mesh(geometry, material);
            this.markerMeshes.add(markerMesh);
            this.markers.set(markerName, markerMesh);
        }

        markerMesh.position.copy(position);
        this.currentMarkerIndex++;
    }

    getCurrentMarkerName() {
        if (this.currentMarkerIndex < CAT_MARKERS.length) {
            return CAT_MARKERS[this.currentMarkerIndex].name;
        }
        return null;
    }

    areAllMarkersPlaced() {
        return this.currentMarkerIndex >= CAT_MARKERS.length;
    }

    createSkeleton() {
        this.markerMeshes.visible = false;

        // This is a simplified skeleton generation logic.
        // A real implementation would be much more complex.
        const bones = [];
        const createBone = (name, parent, position) => {
            const bone = new THREE.Bone();
            bone.name = name;
            bone.position.copy(position);
            if (parent) parent.add(bone);
            bones.push(bone);
            return bone;
        };

        const m = (name) => this.markers.get(name).position;

        const tailBasePos = m('Tail Base');
        const neckPos = m('Neck');
        const withersPos = m('Withers (Shoulder Top)');

        // Spine
        const hip = createBone('Hip', null, tailBasePos);
        const spine1 = createBone('Spine1', hip, new THREE.Vector3().lerpVectors(tailBasePos, withersPos, 0.5));
        const chest = createBone('Chest', spine1, withersPos);
        const neck = createBone('Neck', chest, neckPos);
        const head = createBone('Head', neck, m('Nose'));

        // Front Legs
        const fl_shoulder = createBone('FL_Shoulder', chest, m('Withers (Shoulder Top)').clone().add(new THREE.Vector3(0.1, -0.1, 0)));
        const fl_paw = createBone('FL_Paw', fl_shoulder, m('Front Left Paw'));

        const fr_shoulder = createBone('FR_Shoulder', chest, m('Withers (Shoulder Top)').clone().add(new THREE.Vector3(-0.1, -0.1, 0)));
        const fr_paw = createBone('FR_Paw', fr_shoulder, m('Front Right Paw'));

        // Back Legs
        const bl_hip = createBone('BL_Hip', hip, m('Tail Base').clone().add(new THREE.Vector3(0.1, 0, 0)));
        const bl_paw = createBone('BL_Paw', bl_hip, m('Back Left Paw'));

        const br_hip = createBone('BR_Hip', hip, m('Tail Base').clone().add(new THREE.Vector3(-0.1, 0, 0)));
        const br_paw = createBone('BR_Paw', br_hip, m('Back Right Paw'));

        const skeleton = new THREE.Skeleton(bones);
        this.skeletonHelper = new THREE.SkeletonHelper(hip); // Hip is the root
        this.viewer.scene.add(this.skeletonHelper);

        this.setupJointControls(bones);
    }

    setupJointControls(bones) {
        const jointGroup = new THREE.Group();
        this.viewer.scene.add(jointGroup);

        this.transformControls = new TransformControls(this.viewer.camera, this.viewer.renderer.domElement);
        this.viewer.scene.add(this.transformControls);
        this.transformControls.setMode('translate');
        this.transformControls.setSize(0.5);

        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.viewer.controls.enabled = !event.value;
        });

        const jointGeo = new THREE.SphereGeometry(0.02, 16, 16);
        const jointMat = new THREE.MeshBasicMaterial({ color: 0x00aaff, depthTest: false, transparent: true, opacity: 0.8 });

        bones.forEach(bone => {
            const jointSphere = new THREE.Mesh(jointGeo, jointMat);
            jointSphere.userData.bone = bone;
            jointGroup.add(jointSphere);
        });

        // Use animation loop to update sphere positions
        const updateSpheres = () => {
            const worldPos = new THREE.Vector3();
            jointGroup.children.forEach(sphere => {
                sphere.userData.bone.getWorldPosition(worldPos);
                sphere.position.copy(worldPos);
            });
            requestAnimationFrame(updateSpheres);
        };
        updateSpheres();

        this.viewer.renderer.domElement.addEventListener('click', (event) => {
            if (this.transformControls.object) return;
            const intersect = this.viewer.getIntersection(event);
            if (intersect && intersect.object.userData.bone) {
                this.transformControls.attach(intersect.object);
            } else {
                 this.transformControls.detach();
            }
        }, false);
    }

    reset() {
        this.markers.clear();
        this.markerMeshes.children.forEach(c => c.geometry.dispose() && c.material.dispose());
        this.markerMeshes.clear();
        this.currentMarkerIndex = 0;

        if (this.skeletonHelper) {
            this.viewer.scene.remove(this.skeletonHelper);
            this.skeletonHelper = null;
        }
        if (this.transformControls) {
            this.transformControls.dispose();
            this.viewer.scene.remove(this.transformControls);
            this.transformControls = null;
        }
    }
}