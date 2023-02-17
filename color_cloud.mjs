import * as THREE from 'three';

import ShaderLoader from './shader_loader.mjs';

export default class ColorCloud {
    static SRGB = 0;
    static xyY = 1;
    static Lab = 2;

    #shaderLoader;

    #pointcloudmat;
    #pointcloudshadowmat;
    #points;
    #pointshadows;

    #isDensity;
    #colorspace;

    #group;

    constructor(colorspace, density, vidMgr) {
        this.#group = new THREE.Group();
        this.#group.name = "Color Cloud";

        this.#shaderLoader = new ShaderLoader();
        this.#isDensity = density;
        this.#colorspace = colorspace;

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
        this.#pointshadows.geometry = this.#points.geometry;

        this.#pointcloudmat.uniforms.tex.value = tex;
        this.#pointcloudshadowmat.uniforms.tex.value = tex;
    }

    #createAxes() {
        const axes = new THREE.Group();

        const rMat = new THREE.MeshBasicMaterial({color: 0xaa0000});
        const rAx = this.#makeAxis(rMat);
        rAx.rotation.z = -Math.PI / 2;
        if (this.#colorspace == ColorCloud.Lab) {
            rAx.position.z = 0;
        }
        axes.add(rAx);

        const gMat = new THREE.MeshBasicMaterial({color: 0x00aa00});
        const gAx = this.#makeAxis(gMat);
        if (this.#colorspace == ColorCloud.Lab) {
            gAx.position.x = 0;
            gAx.position.z = 0;
        }
        axes.add(gAx);

        const bMat = new THREE.MeshBasicMaterial({color: 0x0000aa});
        const bAx = this.#makeAxis(bMat);
        bAx.rotation.x = Math.PI / 2;
        if (this.#colorspace == ColorCloud.Lab) {
            bAx.position.x = 0;
        }
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
        const extents = {dataMin: {}, dataMax: {}, spaceMin: {}, spaceMax:{}};
        this.#setbounds(extents);

        const step = (this.#colorspace == ColorCloud.Lab) ? 10 : 0.1;

        const vertex_data = [];

        const y = extents.dataMin.value.y;

        const primary_axes = [0,2];
        const secondary_axes = [2,0];
        for (let ax = 0; ax < 2; ax++) {
            const primary = primary_axes[ax];
            const secondary = secondary_axes[ax];

            const lineStart = extents.dataMin.value.toArray()[secondary];
            const lineEnd = extents.dataMax.value.toArray()[secondary];

            const negative = Math.ceil(extents.dataMin.value.toArray()[primary]/ step);
            const positive = Math.floor(extents.dataMax.value.toArray()[primary]/step);
            for (let i = negative; i <= positive; ++i) {
                let p = [i*step,y,lineStart];
                vertex_data.push(p[primary]);
                vertex_data.push(p[1]);
                vertex_data.push(p[secondary]);
                
                p = [i*step, y, lineEnd];
                vertex_data.push(p[primary]);
                vertex_data.push(p[1]);
                vertex_data.push(p[secondary]);
            }
        }

        const vertices = Float32Array.from(vertex_data);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({color: 0xaaaaaa}));
        lines.scale.copy(extents.spaceMax.value.clone().sub(extents.spaceMin.value).divide(extents.dataMax.value.clone().sub(extents.dataMin.value)));
        lines.position.copy(extents.spaceMin.value.clone().sub(extents.dataMin.value.clone().multiply(lines.scale)));

        this.#group.add(lines);
    }

    #createPointCloud() {
        this.#pointcloudmat = new THREE.ShaderMaterial({
            uniforms: {
                tex: {value: null},
                transparency: {value: this.#isDensity},
                mode: {value: this.#colorspace},
                isShadow: {value: false},
                dataMin: {},
                dataMax: {},
                spaceMin: {},
                spaceMax: {},
            },
            blending: (this.#isDensity) ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthTest: !this.#isDensity,
            transparent: this.#isDensity,
        });
        this.#shaderLoader.load('./shaders/color_cloud.vert.glsl', './shaders/color_cloud.frag.glsl', this.#pointcloudmat);
        this.#setbounds(this.#pointcloudmat.uniforms);

        this.#points = new THREE.Points();
        this.#points.material = this.#pointcloudmat;
        this.#points.renderOrder = 2;

        this.#pointcloudshadowmat = new THREE.ShaderMaterial({
            uniforms: {
                tex: {value: null},
                transparency: {value: this.#isDensity},
                mode: {value: this.#colorspace},
                isShadow: {value: true},
                dataMin: {},
                dataMax: {},
                spaceMin: {},
                spaceMax: {},
            },
            depthTest: true,
            depthWrite: false,
            transparent: true,
        });
        this.#shaderLoader.load('./shaders/color_cloud.vert.glsl', './shaders/color_cloud.frag.glsl', this.#pointcloudshadowmat);
        this.#setbounds(this.#pointcloudshadowmat.uniforms);

        this.#pointshadows = new THREE.Points();
        this.#pointshadows.material = this.#pointcloudshadowmat;
        this.#pointshadows.renderOrder = 1;

        this.#group.add(this.#points);
        this.#group.add(this.#pointshadows);
    }

    #setbounds(uniforms) {
        if (this.#colorspace === ColorCloud.SRGB) {
            uniforms.dataMin.value = new THREE.Vector3(0,0,0);
            uniforms.dataMax.value = new THREE.Vector3(1,1,1);
        }
        if (this.#colorspace === ColorCloud.xyY) {
            uniforms.dataMin.value = new THREE.Vector3(0, 0, 0);
            uniforms.dataMax.value = new THREE.Vector3(0.7, 1, 0.7);
        }
        if (this.#colorspace === ColorCloud.Lab) {
            uniforms.dataMin.value = new THREE.Vector3(-128, 0, -128);
            uniforms.dataMax.value = new THREE.Vector3(127, 100, 127);
        }
        uniforms.spaceMin.value = new THREE.Vector3(-0.5, -0.5, -0.5);
        uniforms.spaceMax.value = new THREE.Vector3(0.5, 0.5, 0.5);
    }
}