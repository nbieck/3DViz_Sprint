import * as THREE from 'three';

import ShaderLoader from './shader_loader.mjs';

export default class VideoManager {
    #video;
    #vidtexture;

    #downsampled;
    #downsamplemat;
    #scene;
    #cam;
    #shoulddodownsample;

    #ismobile;
    #isfront = true;
    #usable = true;

    #textureusers = [];

    #shaderloader;

    constructor() {
        this.#shaderloader = new ShaderLoader();

        this.#video = null;
        this.#vidtexture = null;

        this.#ismobile = navigator.userAgentData?.mobile;

        if (!navigator.mediaDevices?.getUserMedia) {
            console.error("Media devices not available.");
            this.#usable = false;
        }

        if (this.#usable) {
            this.#createScene();

            this.#getNewVideo();
        }
    }

    get isFront() {
        return this.#isfront;
    }

    set isFront(val) {
        if (val != this.#isfront) {
            this.changeFacing();
        }
    }

    get canChangeFacing() {
        return this.#ismobile;
    }

    get isUsable() {
        return this.#usable;
    }

    addTextureUser(obj, propertyName) {
        this.#textureusers.push({obj: obj, property: propertyName});

        if (this.#vidtexture) {
            obj[propertyName] = this.#vidtexture;
        }
    }

    removeTextureUser(obj) {
        this.#textureusers = this.#textureusers.filter(elem => elem.obj !== obj);
    }

    changeFacing() {
        if (!this.#ismobile) {
            console.error("Trying to switch camera on non-mobile platform.");
            return;
        }

        this.#isfront = !this.#isfront;
        this.#getNewVideo();
    }

    doPreprocess(renderer) {
        if (this.#shoulddodownsample) {
            renderer.setRenderTarget(this.#downsampled);
            renderer.clear();
            renderer.render(this.#scene, this.#cam);
            renderer.setRenderTarget(null);
        }
    }

    #createScene() {
        this.#downsamplemat = new THREE.ShaderMaterial({
            uniforms: {
                tex: {value: null},
            },
            depthWrite: false,
            depthTest: false,
        });
        this.#shaderloader.load('./shaders/pass_through.vert.glsl','./shaders/downsample_2x.frag.glsl', this.#downsamplemat);

        this.#scene = new THREE.Scene();
        this.#cam = new THREE.OrthographicCamera(0,1,0,1,0,1);
        this.#scene.add(this.#cam);
        this.#scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), this.#downsamplemat));
    }

    #getNewVideo() {
        if (this.#usable) {
            const constraints = this.#makeConstraints();

            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    this.#video = document.createElement("video");
                    this.#video.srcObject = stream;
                    this.#video.play();

                    this.#video.onloadeddata = this.#createVidTexture.bind(this);
                });
        }
    }

    #makeConstraints() {
        const constraints = {
            video: {
                width: 1280,
                height: 720,
                facingMode: this.#isfront ? 'user' : 'environment',
            }
        };

        return constraints;
    }

    #createVidTexture() {
        if (this.#vidtexture) {
            this.#vidtexture.dispose();
        }
        if (this.#downsampled) {
            this.#downsampled.dispose();
        }

        this.#vidtexture = new THREE.VideoTexture(this.#video);
        this.#vidtexture.minFilter = THREE.NearestFilter;
        this.#vidtexture.maxFilter = THREE.NearestFilter;
        this.#vidtexture.generateMipmaps = false;
        this.#vidtexture.format = THREE.RGBAFormat;

        this.#vidtexture.userData.width = this.#video.videoWidth;
        this.#vidtexture.userData.height = this.#video.videoHeight;

        if (this.#video.videoWidth * this.#video.videoHeight > 1920*1080) {
            this.#shoulddodownsample = true;
            this.#downsampled = new THREE.WebGLRenderTarget(this.#video.videoWidth / 2, this.#video.videoHeight / 2);
            this.#downsampled.texture.userData.width = this.#downsampled.width;
            this.#downsampled.texture.userData.height = this.#downsampled.height;
            this.#downsamplemat.uniforms.tex.value = this.#vidtexture;
        }

        this.#updateUsers();

        this.#video.play();
    }

    #updateUsers() {
        console.log("Updated texture within video clients");
        this.#textureusers.forEach(elem => {
            if (this.#shoulddodownsample) {
                elem.obj[elem.property] = this.#downsampled.texture;
            }
            else {
                elem.obj[elem.property] = this.#vidtexture;
            }
            if ('needsUpdate' in elem.obj) {
                elem.obj.needsUpdate = true;
            }
        });
    }
}