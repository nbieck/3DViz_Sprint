import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import Histogram from './histogram.mjs';
import ColorCloud from './color_cloud.mjs';

function setLayer(layer, object) {
    object.layers.set(layer);
    object.children.forEach(obj => setLayer(layer, obj));
}

export default class DataOverlay {
    #scene;
    #perspectivecamera;
    #orthocamera;
    #controller;

    #histogram;
    #colorclouds;

    constructor(vidMgr, renderer) {
        this.#scene = new THREE.Scene();
        this.#scene.background = null;

        const fov = 65;
        const aspect = 1;
        const near = 0.01;
        const far = 10;
        this.#perspectivecamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.#perspectivecamera.position.z = 3;
        this.#perspectivecamera.layers.set(1);
        this.#scene.add(this.#perspectivecamera);

        this.#orthocamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0, 1);
        this.#orthocamera.layers.set(1);
        this.#orthocamera.position.z = 0.5;
        this.#scene.add(this.#orthocamera);

        this.#controller = new OrbitControls(this.#perspectivecamera, renderer.domElement);
        this.#controller.enablePan = false;

        this.#histogram = new Histogram(vidMgr);
        setLayer(1, this.#histogram.histogramGroup);
        this.#scene.add(this.#histogram.histogramGroup);
        
        this.#colorclouds = []
        this.#colorclouds.push(new ColorCloud(ColorCloud.SRGB, false, vidMgr));
        this.#colorclouds.push(new ColorCloud(ColorCloud.SRGB, true, vidMgr));
        this.#colorclouds.push(new ColorCloud(ColorCloud.xyY, false, vidMgr));
        this.#colorclouds.push(new ColorCloud(ColorCloud.xyY, true, vidMgr));
        this.#colorclouds.push(new ColorCloud(ColorCloud.Lab, false, vidMgr));
        this.#colorclouds.push(new ColorCloud(ColorCloud.Lab, true, vidMgr));

        for (let i = 0; i < 6; i++) {
            const group = this.#colorclouds[i].cloudGroup;
            setLayer(i+2, group);
            group.scale.set(2,2,2);
            this.#scene.add(group);
        }
    }

    render(renderer) {
        let viewport = renderer.getViewport(new THREE.Vector4());

        this.#controller.update();

        this.#renderHisto(renderer);

        for (let i = 0; i < 6; i++) {
            this.#renderColorCloud(renderer, i);
        }

        renderer.setViewport(viewport);
    }

    #computeViewport(renderer, viewportRelative) {
        let size = renderer.getSize(new THREE.Vector2());

        return new THREE.Vector4(viewportRelative.x * size.x, viewportRelative.y * size.y,
            size.x * viewportRelative.z, size.y * viewportRelative.w);
    }

    #renderHisto(renderer) {
        this.#histogram.runProcessing(renderer);

        let viewport = new THREE.Vector4(0, 0.8, 1, 0.2);
        renderer.setViewport(this.#computeViewport(renderer, viewport))
        renderer.render(this.#scene, this.#orthocamera);
    }

    #renderColorCloud(renderer, i) {
        this.#perspectivecamera.layers.set(i+2);

        let viewport_rel = new THREE.Vector4(Math.floor(i / 2) * (1/3), (1 - i%2) * 0.4, 1/3, 0.4);
        let viewport = this.#computeViewport(renderer, viewport_rel);

        this.#perspectivecamera.aspect = viewport.z / viewport.w;
        this.#perspectivecamera.updateProjectionMatrix();

        renderer.setViewport(viewport);
        renderer.render(this.#scene, this.#perspectivecamera);
    }
}