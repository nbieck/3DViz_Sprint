import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import VideoManager from './video_manager.mjs';
import DataOverlay from './data_overlay.mjs';

let canvas;
let renderer, scene, camera;
let dataOverlay;

let stats;
let vidMgr;

function init() {
    THREE.Cache.enabled = true;

    canvas = document.querySelector('#c');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.autoClear = false;

    vidMgr = new VideoManager();
    dataOverlay = new DataOverlay(vidMgr, renderer);

    window.addEventListener("click", onclick, true);

    const fov = 75;
    const aspect = canvas.innerWidth / canvas.innerHeight;
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 5;

    scene = new THREE.Scene();
    vidMgr.addTextureUser(scene, 'background');

    stats = new Stats();
    document.body.appendChild(stats.dom);
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

function render(time) {
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }


    stats.update();
    vidMgr.doPreprocess(renderer);

    renderer.clear();
    renderer.render(scene, camera);
    dataOverlay.render(renderer);
}

init();
renderer.setAnimationLoop(render);
