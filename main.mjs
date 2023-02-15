import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import VideoManager from './video_manager.mjs';

let canvas;
let renderer, scene, camera, controls;

let stats, settings;
let vidMgr;

function init() {
    canvas = document.querySelector('#c');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    vidMgr = new VideoManager();

    window.addEventListener("click", onclick, true);

    const fov = 75;
    const aspect = canvas.innerWidth / canvas.innerHeight;
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 5;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window); // optional

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    const mat = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
    vidMgr.addTextureUser(mat, 'map');

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat);
    scene.add(mesh);

    createGui();
}

function createGui() {
    const gui = new GUI();

    settings = {};
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function animateScene(time) {

}

function render(time) {
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    stats.update();
    controls.update();
    animateScene(time);
    renderer.render(scene, camera);
}

init();
renderer.setAnimationLoop(render);
