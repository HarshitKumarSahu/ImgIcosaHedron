import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import fragment from "../shaders/fragment.glsl";
import fragment1 from "../shaders/fragment1.glsl";
import vertex from "../shaders/vertex.glsl";
import * as dat from "dat.gui";
import gsap from "gsap";

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { PostProcessing } from './postprocessing';

import landscape from "/1.jpg";
class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor("#111", 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.001,
      1000
    );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;
    this.isPlaying = true;

    this.addObjects();
    this. addPost();
    this.resize();
    this.render();
    this.setupResize();
    this.settings();
  }

  addPost() {
    this.composer = new EffectComposer(this.renderer);
    this. composer.addPass(new RenderPass(this.scene, this.camera));
    this.customPass = new ShaderPass( PostProcessing );
    this.customPass.uniforms[ "resolution" ].value = new THREE.Vector2( window.innerWidth, window.innerHeight );
    this.customPass.uniforms[ "resolution" ].value.multiplyScalar(window.devicePixelRatio); 
    this.composer.addPass(this.customPass)
  }

  addObjects() {
    const t = new THREE.TextureLoader().load(landscape);
    // t.wrapS = t.wrapT = new THREE.MirroredRepeatWrapping;
    t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        landscape: { value: t },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uvRate1: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    //   wireframe : true,
    });

    this.material1 = new THREE.ShaderMaterial({
        extensions: {
          derivatives: "#extension GL_OES_standard_derivatives : enable",
        },
        side: THREE.DoubleSide,
        uniforms: {
          time: { type: "f", value: 0 },
          landscape: { value: t },
          resolution: { type: "v4", value: new THREE.Vector4() },
          uvRate1: { value: new THREE.Vector2(1, 1) },
        },
        vertexShader: vertex,
        fragmentShader: fragment1,
      //   wireframe : true,
      });

    this.geometry = new THREE.IcosahedronGeometry(1, 1);
    this.geometry1 = new THREE.IcosahedronGeometry(1.001, 1);
    let length = this.geometry1.attributes.position.array.length;
    
    let bary = [];

    for(let i=0 ; i< length/3 ; i++) {
        bary.push(0,0,1,    0,1,0,    1,0,0);
    }
    
    let aBary = new Float32Array(bary);
    this.geometry1.setAttribute("aBary",new THREE.BufferAttribute(aBary,3))
    
    this.ico = new THREE.Mesh(this.geometry, this.material);
    this.icoLines = new THREE.Mesh(this.geometry1, this.material1);
    this.scene.add(this.ico);
    this.scene.add(this.icoLines);
  }

  settings() {
    this.settings = {
        howmuchrgb: 0.3,
    };
    this.gui = new dat.GUI();
    // this.gui.add(this.settings, "howmuchrgb", 0, 1, 0.01).onChange((value) => {
    //   this.material.uniforms.progress.value = value;
    // });
    this.gui.add(this.settings, "howmuchrgb", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.001;
    this.scene.rotation.x = this.time;
    this.scene.rotation.y = this.time;
    this.material.uniforms.time.value = this.time;
    this.material1.uniforms.time.value = this.time;
    this.customPass.uniforms.time.value = this.time;
    this.customPass.uniforms.howmuchrgb.value = this.settings.howmuchrgb;

    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
    requestAnimationFrame(this.render.bind(this));
  }
}


new Sketch({
  dom: document.querySelector(".main"),
});
