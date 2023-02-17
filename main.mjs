import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import VideoManager from './video_manager.mjs';
import Histogram from './histogram.mjs';
import ColorCloud from './color_cloud.mjs';

let canvas;
let renderer, scene, camera, controls;

let stats, settings;
let vidMgr;
let histo;

function init() {
    THREE.Cache.enabled = true;

    canvas = document.querySelector('#c');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.autoClear = false;

    vidMgr = new VideoManager();
    histo = new Histogram(vidMgr);
    let cloudRGB = new ColorCloud(ColorCloud.SRGB, false, vidMgr);

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
    vidMgr.addTextureUser(scene, 'background');

    stats = new Stats();
    document.body.appendChild(stats.dom);

    const histoGroup = histo.histogramGroup;
    histoGroup.position.set(-2,2,0);
    histoGroup.scale.x = 2;
    scene.add(histoGroup);

    cloudRGB.cloudGroup.position.set(2,0,0);
    cloudRGB.cloudGroup.rotation.set(Math.PI / 4, -Math.PI / 4, 0)
    cloudRGB.cloudGroup.scale.set(2,2,2);
    scene.add(cloudRGB.cloudGroup);

    createGui();
}

function onclick(ev) {
    if (vidMgr.canChangeFacing) {
        vidMgr.changeFacing();
    }
    else {
        console.log("Couldn't change facing.");
    }
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

    vidMgr.doPreprocess(renderer);
    histo.runProcessing(renderer);

    renderer.clear();
    renderer.render(scene, camera);
}

init();
renderer.setAnimationLoop(render);
