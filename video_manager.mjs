import * as THREE from 'three';

export default class {
    #video;
    #vidtexture;

    #ismobile;
    #isfront = true;

    #usable = true;

    #textureusers = [];

    constructor() {
        this.#video = null;
        this.#vidtexture = null;

        this.#ismobile = navigator.userAgentData?.mobile;

        if (!navigator.mediaDevices?.getUserMedia) {
            console.error("Media devices not available.");
            this.#usable = false;
        }

        if (this.#usable) {
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
                width: 1920,
                height: 1080,
                facingMode: this.#isfront ? 'user' : 'environment',
            }
        };

        return constraints;
    }

    #createVidTexture() {
        if (this.#vidtexture) {
            this.#vidtexture.dispose();
        }

        this.#vidtexture = new THREE.VideoTexture(this.#video);
        this.#vidtexture.minFilter = THREE.NearestFilter;
        this.#vidtexture.maxFilter = THREE.NearestFilter;
        this.#vidtexture.generateMipmaps = false;
        this.#vidtexture.format = THREE.RGBAFormat;

        this.#updateUsers();

        this.#video.play();
    }

    #updateUsers() {
        console.log("Updated texture within video clients");
        this.#textureusers.forEach(elem => {
            elem.obj[elem.property] = this.#vidtexture;
            if ('needsUpdate' in elem.obj) {
                elem.obj.needsUpdate = true;
            }
        });
    }
}