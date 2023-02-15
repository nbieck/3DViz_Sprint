import * as THREE from 'three';

import ShaderLoader from './shader_loader.mjs';

export default class Histogram {

    #loader;

    #histogrambuckets;
    #bucketsdownsample;

    #histogrammaterial;

    constructor(vidmgr) {
        this.#loader = new ShaderLoader();
        
        this.#createRenderTargets();
        this.#loadHistogramMaterial();
    }

    get histogramMaterial() {
        return this.#histogrammaterial;
    }

    runProcessing(renderer) {

    }

    #createRenderTargets() {
        this.#histogrambuckets = new THREE.WebGLRenderTarget(256, 1, {
            magFilter: THREE.NearestFilter,
            minFilter: THREE.NearestFilter,
            type: THREE.FloatType
        });
        
        this.#bucketsdownsample = [];
        for (let i = 0; i < 4; i++) {
            this.#bucketsdownsample.push(this.#histogrambuckets.clone());
            this.#bucketsdownsample[i].setSize(Math.pow(4, i), 1);
        }
    }

    #loadHistogramMaterial() {
        this.#histogrammaterial = new THREE.ShaderMaterial({
            uniforms: {
                histo_buckets: {value: null},
                max_val: {value: null},
            }
        });

        this.#loader.load('./shaders/basic.vert.glsl', './shaders/render_histo.frag.glsl', this.#histogrammaterial);
    }
}