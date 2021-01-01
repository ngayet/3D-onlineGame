import * as THREE from '../node_modules/three/build/three.module.js';
import Stats from '../node_modules/three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from '../node_modules/three/examples/jsm/libs/dat.gui.module.js';

import { deepClone , preventLongPressMenu } from './utils.js';

// ==========================================
// =============== INIT VIEW ================
// ==========================================
const scene = new THREE.Scene();

// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
document.getElementById('render').appendChild(renderer.domElement);

// camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight / 0.7, 0.1, 200);
camera.position.set(20, 40, 20);
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI * 0.5;
controls.minDistance = 1;
controls.maxDistance = 500;
controls.target = new THREE.Vector3(0, 10, 0)
controls.object.lookAt(0, 10, 0);



// light
// let ambientLight
// {
//     ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.3); // soft white light
//     scene.add(ambientLight);
// }

let pointLight;
{
    const color = 0xFFFFFF;
    const intensity = 2;
    pointLight = new THREE.PointLight(color, intensity);
    pointLight.position.set(5, 13, 0);
    scene.add(pointLight);
    // const helper = new THREE.PointLightHelper(pointLight);
    // scene.add(helper);
}

// background
scene.background = new THREE.Color(0x505050);



//resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight / 0.7;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
}

// ==========================================
// =============== INIT DEBUG ===============
// ==========================================

// performance monitor
THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);
const stats = new Stats();
document.getElementById('render').appendChild(stats.dom);

// guides
function addLinesGuide(length = 40, width = 3) {
    length *= 0.5;
    const lineX = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
            [new THREE.Vector3(length, 0, 0), new THREE.Vector3(-length, 0, 0)]
        ),
        new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: width }));
    const lineY = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
            [new THREE.Vector3(0, length, 0), new THREE.Vector3(0, -length, 0)]
        ),
        new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: width }));
    const lineZ = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
            [new THREE.Vector3(0, 0, length), new THREE.Vector3(0, 0, -length)]
        ),
        new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: width }));
    scene.add(lineX, lineY, lineZ);
}
addLinesGuide()

// ==========================================
// ============== ORGANISATION ==============
// ==========================================
//data perso
const characters = [];
const Obj3D_gltf = {};
const animations_gltf = {};
class Character {
    constructor() {
        this.scene;
        this.mixer;
    }
}
// ==========================================
// =========== Static Object Init ===========
// ==========================================
let boardMesh;
let board;
{
    let width = 30;
    let height = 20;
    let canvas = document.createElement("canvas");
    canvas.height = height * 30;
    canvas.width = width * 30;
    board = canvas.getContext("2d");
    board.font = "60pt ubuntu";
    board.fillRect(0, 0, width * 30, height * 30);
    board.fillStyle = "white";
    board.fillText("Bonne année !", 145, 80);


    let texture = new THREE.Texture(canvas);
    texture.magFilter = THREE.LinearMipmapLinearFilter;
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneBufferGeometry(width, height);
    boardMesh = new THREE.Mesh(geometry, material)
    boardMesh.position.x = -10;
    boardMesh.position.y = 10;
    boardMesh.position.z = -6;
    boardMesh.rotation.y = 1.57079632679;
    scene.add(boardMesh)
}
let img = new Image();
img.src = '../assets/images/money.svg'
board.drawImage(img, 80, 100);
// var cssRenderer = new CSS3DRenderer();
// cssRenderer.setSize( window.innerWidth, window.innerHeight*0.7 );
// cssRenderer.domElement.style.position = 'absolute';
// cssRenderer.domElement.style.top = 0;
// document.getElementById('render').appendChild(cssRenderer.domElement);

// ==========================================
// ========== Load a glTF resource ==========
// ==========================================
const loader = new GLTFLoader();
loader.load(
    // resource URL
    '../assets/game.glb',
    // called when the resource is loaded
    function (gltf) {

        gltf.scene.children.forEach(child => {

            Obj3D_gltf[child.name] = child;
        });
        gltf.animations.forEach(animation => {

            animations_gltf[animation.name] = animation;
        });

        scene.add(Obj3D_gltf['ground']);
        Obj3D_gltf['castle'].position.z = 10;
        scene.add(Obj3D_gltf['castle']);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.log('An error happened:' + error);
    }
);

// ==========================================
// ================== GUI ===================
// ==========================================
const gui = new GUI();
var options = {
    speed: 1
};


gui.add(options, 'speed', 0.1, 4);

// ==========================================
// ============= RENDER UPDATE ==============
// ==========================================
function render(time) {
    // update stat
    stats.update();
    // update mixer
    characters.forEach(element => {
        element.scene.position.z += (Math.random()) * 0.1 * options.speed;
        if (element.scene.position.z > 9) { scene.remove(characters.shift().scene); }
        else {
            // element.scene.position.x += (Math.random() - 0.5) * 0.1 * options.speed;
            element.mixer.update(0.01 * options.speed);
        }
    });
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);

// ==========================================
// ===== LISTENER OUT OF CANVAS (button) ====
// ==========================================
const delay = ms => new Promise(res => setTimeout(res, ms));

// BUTTON ADD
preventLongPressMenu(document.querySelector('input#add'));
let buttonAddMousedown = false;
let buttonAddFocus = false;
{
    let b = document.querySelector('input#add');
    b.addEventListener("mouseup", function () { buttonAddMousedown = false; });
    b.addEventListener("touchend", function () { buttonAddMousedown = false; });
    b.addEventListener("touchcancel", function () { buttonAddMousedown = false; });
    b.addEventListener("mouseout", function (e) { buttonAddFocus = false; });
    async function addChar(event) {
        buttonAddMousedown = true;
        buttonAddFocus = true;
        do {
            let char = new Character();
            char.scene = deepClone(Obj3D_gltf["Armature"]);
            char.scene.position.x = (Math.random() - 0.5) * 5 - 1;
            char.scene.position.y = 0.3;
            char.scene.position.z = -20;
            scene.add(char.scene)
            char.mixer = new THREE.AnimationMixer(char.scene);
            char.mixer.clipAction(animations_gltf['Walk']).play();
            characters.push(char);
            await delay(50);
        } while (buttonAddMousedown && buttonAddFocus);
    }
    b.addEventListener("mousedown", addChar);
    b.addEventListener("touchstart", addChar);
}

// BUTTON DELETE
preventLongPressMenu(document.querySelector('input#del'));
let buttonDeleteMousedown = false;
let buttonDeleteFocus = false;
{
    let b = document.querySelector('input#del');
    b.addEventListener("mouseup", function () { buttonDeleteMousedown = false; });
    b.addEventListener("touchend", function () { buttonDeleteMousedown = false; });
    b.addEventListener("mouseout", function () { buttonDeleteFocus = false; });
    async function delChar() {
        let char;
        buttonDeleteMousedown = true;
        buttonDeleteFocus = true;
        do {
            char = characters.shift();
            if (char) { scene.remove(char.scene); }
            await delay(100);
        } while (buttonDeleteMousedown && buttonDeleteFocus && char);
    };
    b.addEventListener("mousedown", delChar);
    b.addEventListener("touchstart", delChar);
}