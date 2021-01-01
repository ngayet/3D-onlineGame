import * as THREE from '../node_modules/three/build/three.module.js';

// Deep clone of a THREE.Object3D
export function deepClone(srcObject3D) {
    const clone = srcObject3D.clone(true);

    const skinnedMeshes = {};

    srcObject3D.traverse(node => {
        if (node.isSkinnedMesh) {
            skinnedMeshes[node.name] = node;
        }
    });

    const cloneBones = {};
    const cloneSkinnedMeshes = {};

    clone.traverse(node => {
        if (node.isBone) {
            cloneBones[node.name] = node;
        }

        if (node.isSkinnedMesh) {
            cloneSkinnedMeshes[node.name] = node;
        }
    });

    for (let name in skinnedMeshes) {
        const skinnedMesh = skinnedMeshes[name];
        const skeleton = skinnedMesh.skeleton;
        const cloneSkinnedMesh = cloneSkinnedMeshes[name];

        const orderedCloneBones = [];

        for (let i = 0; i < skeleton.bones.length; ++i) {
            const cloneBone = cloneBones[skeleton.bones[i].name];
            orderedCloneBones.push(cloneBone);
        }

        cloneSkinnedMesh.bind(
            new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
            cloneSkinnedMesh.matrixWorld);
    }
    return clone;
}

// Prevent long press menu from android devices
function absorbEvent_(event) {
    var e = event || window.event;
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
}
// Prevent long press menu from android devices
export function preventLongPressMenu(node) {
    node.ontouchstart = absorbEvent_;
    node.ontouchmove = absorbEvent_;
    node.ontouchend = absorbEvent_;
    node.ontouchcancel = absorbEvent_;
}