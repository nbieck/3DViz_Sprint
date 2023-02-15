import * as THREE from 'three';

function enableShaders(material) {
    material.fragmentShader = material.userData.frag;
    material.vertexShader = material.userData.vtx;
    material.needsUpdate = true;
}

function attachVtxShader(txt, material) {
    material.userData.vtx = txt;

    if (material.userData.frag) {
        enableShaders(material);
    }
}

function attachFragShader(txt, material) {
    material.userData.frag = txt;

    if (material.userData.vtx) {
        enableShaders(material);
    }
}

export default class ShaderLoader {
    #loader;

    constructor() {
        this.#loader = new THREE.FileLoader();
    }

    // loads the vertex and fragment shader located at the given location and adds them to the given ShaderMaterial
    // once both are loaded
    load(vertex, fragment, material) {
        this.#loader.load(vertex, txt => attachVtxShader(txt, material));
        this.#loader.load(fragment, txt => attachFragShader(txt, material));
    }
}