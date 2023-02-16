import * as THREE from 'three';

import ShaderLoader from './shader_loader.mjs';

export default class Histogram {

    #loader;

    #histogrambuckets;
    #bucketsdownsample;

    #bucketmaterial;
    #histogrammaterial;

    #offscreenscene;
    #offscreencamera;
    #quad;
    #points;

    constructor(vidmgr) {
        this.#loader = new ShaderLoader();
        
        this.#createRenderTargets();
        this.#loadBucketingMaterial();
        this.#loadHistogramMaterial();
        this.#createScene();

        vidmgr.addTextureUser(this, 'videoTex');
    }

    get histogramMaterial() {
        return this.#histogrammaterial;
    }

    set videoTex(tex) {
        let num_pixels = tex.source.data.videoHeight * tex.source.data.videoWidth;

        let geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(num_pixels * 3);

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        if (this.#points) {
            this.#offscreenscene.remove(this.#points);
        }
        this.#points = new THREE.Points(geometry, this.#bucketmaterial);
        this.#offscreenscene.add(this.#points);

        this.#bucketmaterial.uniforms.tex.value = tex;
    }

    runProcessing(renderer) {
        const clearColor = renderer.getClearColor(new THREE.Color());
        renderer.setClearColor(new THREE.Color(0,0,0));
        renderer.setRenderTarget(this.#histogrambuckets);

        renderer.clear();
        for (let i = 0; i < 3; i++) {
            const c_array = [0,0,0];
            c_array[i] = 1;
            this.#bucketmaterial.uniforms.color.value.fromArray(c_array);
            renderer.render(this.#offscreenscene, this.#offscreencamera);
        }

        renderer.setRenderTarget(null);
        renderer.setClearColor(clearColor);
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

    #loadBucketingMaterial() {
        this.#bucketmaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(1.,0.,0.) },
                tex: {value: null},
            },
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneFactor,
            depthTest: false,
            depthWrite: false,
        });

        this.#loader.load('./shaders/count_buckets.vert.glsl', './shaders/count_buckets.frag.glsl', this.#bucketmaterial);
    }

    #loadHistogramMaterial() {
        this.#histogrammaterial = new THREE.ShaderMaterial({
            uniforms: {
                histo_buckets: {value: this.#histogrambuckets.texture},
                max_val: {value: null},
            }
        });

        this.#loader.load('./shaders/basic.vert.glsl', './shaders/render_histo.frag.glsl', this.#histogrammaterial);
    }

    #createScene() {
        this.#offscreenscene = new THREE.Scene();

        // processing rendering ignored camera parameters, just need one to make three.js happy
        this.#offscreencamera = new THREE.OrthographicCamera(0,1,0,1,0,1);
    }
}