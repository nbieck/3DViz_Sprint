import * as THREE from 'three';

import ShaderLoader from './shader_loader.mjs';

export default class ColorCloud {
    static SRGB = 0;
    static xyY = 1;
    static Lab = 2;

    #shaderLoader;

    #pointcloudmat;
    #points;

    #group;

    constructor(colorspace, density, vidMgr) {
        this.#group = new THREE.Group();
        this.#group.name = "Color Cloud";

        this.#shaderLoader = new ShaderLoader();

        this.#createAxes();
        this.#createBoundingBox();
        this.#createGrid();
        this.#createPointCloud();

        vidMgr.addTextureUser(this, 'vidTex');
    }

    get cloudGroup() {
        return this.#group;
    }

    set vidTex(tex) {
        const numVerts = tex.userData.width * tex.userData.height;
        const verts = new Float32Array(numVerts * 3);

        if (this.#points.geometry) {
            this.#points.geometry.dispose();
        }
        this.#points.geometry = new THREE.BufferGeometry();
        this.#points.geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));

        this.#pointcloudmat.uniforms.tex.value = tex;
    }

    #createAxes() {
        const axes = new THREE.Group();

        const rMat = new THREE.MeshBasicMaterial({color: 0xaa0000});
        const rAx = this.#makeAxis(rMat);
        rAx.rotation.z = -Math.PI / 2;
        axes.add(rAx);

        const gMat = new THREE.MeshBasicMaterial({color: 0x00aa00});
        const gAx = this.#makeAxis(gMat);
        axes.add(gAx);

        const bMat = new THREE.MeshBasicMaterial({color: 0x0000aa});
        const bAx = this.#makeAxis(bMat);
        bAx.rotation.x = Math.PI / 2;
        axes.add(bAx);

        this.#group.add(axes);
    }

    #makeAxis(material) {
        const cylinder = new THREE.CylinderGeometry(0.01, 0.01, 1);
        const cylMesh = new THREE.Mesh(cylinder, material);
        cylMesh.position.y = 0.5;

        const cone = new THREE.ConeGeometry(0.03, 0.1);
        const coneMesh = new THREE.Mesh(cone, material);
        coneMesh.position.y = 1;

        const group = new THREE.Group();
        group.add(cylMesh);
        group.add(coneMesh);

        group.position.set(-0.5, -0.5, -0.5);
        return group;
    }

    #createBoundingBox() {
        const mat = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide,
        });

        this.#group.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), mat));
    }

    #createGrid() {
        const interval = 0.1;
        const num_lines = 10;
        const directions = 2;
        const vertsPerLine = 2;
        const components = 3;
        const vertices = new Float32Array(num_lines * directions * vertsPerLine * components);

        const stride = components * vertsPerLine * directions;
        for (let i = 0; i < 10; i++) {
            vertices[i * stride] = interval * (i+1);

            vertices[i * stride + components] = interval * (i+1);
            vertices[i * stride + components + 2] = 1;

            vertices[i * stride + vertsPerLine * components + 2] = interval * (i+1);

            vertices[i * stride + (vertsPerLine + 1) * components] = 1;
            vertices[i * stride + (vertsPerLine + 1) * components + 2] = interval * (i+1);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({color: 0xaaaaaa}));
        lines.position.set(-0.5,-0.5,-0.5);

        this.#group.add(lines);
    }

    #createPointCloud() {
        this.#pointcloudmat = new THREE.ShaderMaterial({
            uniforms: {
                tex: {value: null},
            },
        });
        this.#shaderLoader.load('./shaders/color_cloud.vert.glsl', './shaders/color_cloud.frag.glsl', this.#pointcloudmat);

        this.#points = new THREE.Points();
        this.#points.material = this.#pointcloudmat;

        this.#group.add(this.#points);
    }
}