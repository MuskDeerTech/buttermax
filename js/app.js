import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
import GUI from "lil-gui";
import gsap from "gsap";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

import tDiffuse from '../img/gameboy_diffuse-high.png.ktx2?url';
import tPosition from '../img/gameboy_position-high.png.ktx2?url';
import tMV from '../img/gameboy_mv-high.png.ktx2?url';
import tData from '../img/gameboy_data-high.png.ktx2?url';

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xfed703, 1);

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      1000
    );
    this.camera.position.set(0, 0, 0.8);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.dracoLoader = new DRACOLoader(new THREE.LoadingManager()).setDecoderPath("/js/lib/draco/");
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.basisloader = new KTX2Loader();
    this.basisloader.setTranscoderPath("/node_modules/three/examples/jsm/libs/basis/");
    this.basisloader.detectSupport(this.renderer);

    this.isPlaying = true;
    this.setUpSettings();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.addMouseEvents();
  }

  addMouseEvents() {
    document.body.addEventListener('mousemove', (e) => {
      this.material.uniforms.uMouse.value = e.clientX / window.innerWidth;
    });
  }

  setUpSettings() {
    this.settings = {
      progress: 0,
      uDisplacementStrentgh: 0.0025,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01).onChange((val) => {
      this.material.uniforms.progress.value = val;
    });
    this.gui.add(this.settings, "uDisplacementStrentgh", 0, 0.01, 0.0001).onChange((val) => {
      this.material.uniforms.uDisplacementStrentgh.value = val;
    });
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        uDisplacementStrentgh: { value: this.settings.uDisplacementStrentgh },
        time: { value: 0 },
        progress: { value: 0 },
        uMouse: { value: 0 },
        uDiffuse: { value: null },
        uPosition: { value: null },
        uMotion: { value: null },
        uData: { value: null },
        resolution: { value: new THREE.Vector4() },
      },
      transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);

    this.basisloader.load(tDiffuse, (texture) => {
      this.material.uniforms.uDiffuse.value = texture;
      texture.colorSpace = THREE.LinearSRGBColorSpace;
      texture.needsUpdate = true;
    });

    this.basisloader.load(tData, (texture) => {
      this.material.uniforms.uData.value = texture;
      texture.colorSpace = THREE.LinearSRGBColorSpace;
      texture.needsUpdate = true;
    });

    this.basisloader.load(tPosition, (texture) => {
      this.material.uniforms.uPosition.value = texture;
      texture.colorSpace = THREE.LinearSRGBColorSpace;
      texture.needsUpdate = true;
    });

    this.basisloader.load(tMV, (texture) => {
      this.material.uniforms.uMotion.value = texture;
      texture.colorSpace = THREE.LinearSRGBColorSpace;
      texture.needsUpdate = true;
    });

    const fontLoader = new FontLoader();
    const material = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 1.0 });

    fontLoader.load('/img/helvetiker_regular.typeface.json', (font) => {
      console.log('Butter font loaded successfully');
      const butterGeometry = new TextGeometry("ButterMax", {
        font: font,
        size: 0.30,
        height: 0.01,
        curveSegments: 12,
      });
      this.butterText = new THREE.Mesh(butterGeometry, material);
      this.butterText.position.set(-0.9, 0.2, -0.1);
      this.scene.add(this.butterText);
      console.log('Butter text added to scene:', this.butterText);
    }, undefined, (error) => {
      console.error('Error loading Butter font:', error);
    });

    // fontLoader.load('/img/optimer_bold.typeface.json', (font) => {
    //   console.log('Max font loaded successfully');
    //   const maxGeometry = new TextGeometry("Max", {
    //     font: font,
    //     size: 0.30,
    //     height: 0.01,
    //     curveSegments: 12,
    //   });
    //   this.maxText = new THREE.Mesh(maxGeometry, material);
    //   this.maxText.position.set(0.2, 0, -0.1);
    //   this.scene.add(this.maxText);
    //   console.log('Max text added to scene:', this.maxText);
    // }, undefined, (error) => {
    //   console.error('Error loading Max font:', error);
    // });

    console.log('Scene children after adding objects:', this.scene.children);
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});