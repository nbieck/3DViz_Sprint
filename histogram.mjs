import * as THREE from 'three';

import ShaderLoader from './shader_loader.mjs';

export default class Histogram {

    #loader;

    #histogrambuckets;
    #histogrammax;

    #histogrammaterial;

    constructor(vidmgr) {
        this.#loader = new ShaderLoader();

        this.#createTmpHisto();
        this.#loadHistogramMaterial();
    }

    get histogramMaterial() {
        return this.#histogrammaterial;
    }

    #createTmpHisto() {
        const width = 256;
        const stride = 4;

        const data = new Float32Array(width * stride);

        for (let i = 0; i < width; i++) {
            data[i*stride] = i;
            data[i*stride+1] = (i+128)%256;
            data[i*stride+2] = (i+32)%256;
        }

        this.#histogrambuckets = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat, THREE.FloatType);
        this.#histogrambuckets.needsUpdate = true;
        
        const maxData = new Float32Array(4);
        maxData[0] = 255;
        this.#histogrammax = new THREE.DataTexture(maxData, 1, 1, THREE.RGBAFormat, THREE.FloatType);
        this.#histogrammax.needsUpdate = true;
    }

    #loadHistogramMaterial() {
        this.#histogrammaterial = new THREE.ShaderMaterial({
            uniforms: {
                histo_buckets: {value: this.#histogrambuckets},
                max_val: {value: this.#histogrammax},
            }
        });

        this.#loader.load('./shaders/basic.vert.glsl', './shaders/render_histo.frag.glsl', this.#histogrammaterial);
    }
}