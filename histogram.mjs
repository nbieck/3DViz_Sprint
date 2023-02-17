import * as THREE from 'three';

import ShaderLoader from './shader_loader.mjs';

export default class Histogram {

    #loader;

    #histogrambuckets;
    #bucketsdownsample;

    #bucketmaterial;
    #downsamplematerial;
    #histogrammaterial;

    #histogroup;

    #offscreenscene;
    #offscreencamera;
    #quad;
    #points;

    constructor(vidmgr) {
        this.#loader = new ShaderLoader();
        
        this.#createRenderTargets();
        this.#loadBucketingMaterial();
        this.#loadDownsampleMaterial();
        this.#loadHistogramMaterial();
        this.#createScene();
        this.#createGroup();

        vidmgr.addTextureUser(this, 'videoTex');
    }

    get histogramGroup() {
        return this.#histogroup;
    }

    set videoTex(tex) {
        console.log(tex.userData.width);
        console.log(tex.userData.height);
        let num_pixels = tex.userData.height * tex.userData.width;

        let geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(num_pixels * 3);

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        if (this.#points) {
            this.#offscreenscene.remove(this.#points);
            this.#points.geometry.dispose();
        }
        this.#points = new THREE.Points(geometry, this.#bucketmaterial);
        this.#offscreenscene.add(this.#points);

        this.#bucketmaterial.uniforms.tex.value = tex;
    }

    runProcessing(renderer) {
        const clearColor = renderer.getClearColor(new THREE.Color());
        renderer.setClearColor(new THREE.Color(0,0,0));

        if (this.#points) {
            this.#computeBuckets(renderer);
            this.#downsample(renderer);
        }

        renderer.setClearColor(clearColor);
    }

    #computeBuckets(renderer) {
        renderer.setRenderTarget(this.#histogrambuckets);
        this.#quad.visible = false;
        this.#points.visible = true;
        renderer.clear();
        for (let i = 0; i < 3; i++) {
            const c_array = [0,0,0];
            c_array[i] = 1;
            this.#bucketmaterial.uniforms.color.value.fromArray(c_array);
            renderer.render(this.#offscreenscene, this.#offscreencamera);
        }
        renderer.setRenderTarget(null);
    }

    #downsample(renderer) {
        this.#quad.visible = true;
        this.#points.visible = false;

        for (let i = 3; i >= 0; i--) {
            renderer.setRenderTarget(this.#bucketsdownsample[i]);

            if (i == 3) {
                this.#downsamplematerial.uniforms.tex.value = this.#histogrambuckets.texture;
            }
            else {
                this.#downsamplematerial.uniforms.tex.value = this.#bucketsdownsample[i+1].texture;
            }

            renderer.clear();
            renderer.render(this.#offscreenscene, this.#offscreencamera);
        }
        renderer.setRenderTarget(null);
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

    #loadDownsampleMaterial() {
        this.#downsamplematerial = new THREE.ShaderMaterial({
            uniforms: {
                tex: {value: null},
            }
        });

        this.#loader.load('./shaders/pass_through.vert.glsl', './shaders/maxpool_x4.frag.glsl', this.#downsamplematerial);
    }

    #loadHistogramMaterial() {
        this.#histogrammaterial = new THREE.ShaderMaterial({
            uniforms: {
                histo_buckets: {value: this.#histogrambuckets.texture},
                max_val: {value: this.#bucketsdownsample[0].texture},
            }
        });

        this.#loader.load('./shaders/basic.vert.glsl', './shaders/render_histo.frag.glsl', this.#histogrammaterial);
    }

    #createScene() {
        this.#offscreenscene = new THREE.Scene();

        // processing rendering ignored camera parameters, just need one to make three.js happy
        this.#offscreencamera = new THREE.OrthographicCamera(0,1,0,1,0,1);
        this.#offscreenscene.add(this.#offscreencamera);

        this.#quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.#downsamplematerial);
        this.#quad.visible = false;
        this.#offscreenscene.add(this.#quad);
    }

    #createGroup() {
        this.#histogroup = new THREE.Group();
        this.#histogroup.name = "Histogram";

        this.#histogroup.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), this.#histogrammaterial));
        const background = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.5,
        }));
        background.position.z = -0.01;
        this.#histogroup.add(background);
    }
}