import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import displacement1VertexShader from "./shaders/displacement1Pass/vertex.glsl";
import displacement1FragmentShader from "./shaders/displacement1Pass/fragment.glsl";
import imagesLoaded from "imagesloaded";
import FontFaceObserver from "fontfaceobserver";
import gsap from "gsap";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import ocean from "../img/ocean.jpg";
import Scroll from "./scroll";

export default class Sketch {
  constructor(options) {
    this.time = 0;
    this.container = options.dom;
    this.scene = new THREE.Scene();

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      100,
      2000
    );
    this.camera.position.set(0, 0, 600);

    this.camera.fov = 2 * Math.atan(this.height / 2 / 600) * (180 / Math.PI);

    this.renderer = new THREE.WebGLRenderer({
      // antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.images = [...document.querySelectorAll("img")];

    const fontOpen = new Promise((resolve) => {
      new FontFaceObserver("Open Sans").load().then(() => {
        resolve();
      });
    });

    const fontPlayfair = new Promise((resolve) => {
      new FontFaceObserver("Playfair Display").load().then(() => {
        resolve();
      });
    });

    const preloadImages = new Promise((resolve, reject) => {
      imagesLoaded(
        document.querySelectorAll("img"),
        { background: true },
        resolve
      );
    });

    let allDone = [fontOpen, fontPlayfair, preloadImages];
    this.currentScroll = 0;
    this.previousScroll = 0;
    this.isHover = true;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    Promise.all(allDone).then(() => {
      this.scroll = new Scroll();
      this.addImages();
      this.setPosition();

      this.mouseMovement();

      this.resize();
      this.setupResize();
      // this.addObjects();
      this.composerPass();
      this.render();
    });

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.fov = 2 * Math.atan(this.height / 2 / 600) * (180 / Math.PI);
    this.camera.updateProjectionMatrix();
  }

  mouseMovement() {
    window.addEventListener(
      "mousemove",
      (e) => {
        this.mouse.x = (e.clientX / this.width) * 2 - 1;
        this.mouse.y = -(e.clientY / this.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
          let obj = intersects[0].object;
          obj.material.uniforms.uHover.value = intersects[0].uv;
        }
      },
      false
    );
  }

  addImages() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 10, 10);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uImage: { value: 0 },
        uHover: { value: new THREE.Vector2(0.5, 0.5) },
        uHoverState: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      // wireframe: true,
    });

    this.materials = [];

    this.imageStore = this.images.map((img) => {
      let bounds = img.getBoundingClientRect();
      // let geometry = new THREE.PlaneGeometry(
      //   bounds.width,
      //   bounds.height,
      //   10,
      //   10
      // );
      let texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      let material = this.material.clone();
      this.materials.push(material);

      img.addEventListener("mouseenter", () => {
        gsap.to(material.uniforms.uHoverState, {
          duration: 1,
          value: 1,
          ease: "power3.out",
        });
        this.isHover = true;
      });
      img.addEventListener("mouseout", () => {
        gsap.to(material.uniforms.uHoverState, {
          duration: 1,
          value: 0,
          ease: "power3.out",
        });
        this.isHover = false;
      });

      material.uniforms.uImage.value = texture;
      let mesh = new THREE.Mesh(this.geometry, material);
      mesh.scale.set(bounds.width, bounds.height, 1);
      this.scene.add(mesh);
      return {
        img: img,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      };
    });
  }

  setPosition() {
    this.imageStore.forEach((o) => {
      o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
      o.mesh.position.y = -o.top + this.height / 2 - o.height / 2;
      o.mesh.position.y += this.currentScroll;
    });
  }

  addObjects() {
    this.geometry = new THREE.PlaneGeometry(
      this.width / 5,
      this.height / 5,
      50,
      50
    );
    // this.geometry = new THREE.SphereGeometry(100, 50, 50);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOceanTexture: { value: new THREE.TextureLoader().load(ocean) },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      // wireframe: true,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  composerPass() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.displacement1Effect = {
      uniforms: {
        tDiffuse: { value: null },
        uScrollSpeed: { value: null },
        uTime: { value: null },
      },
      vertexShader: displacement1VertexShader,
      fragmentShader: displacement1FragmentShader,
    };
    this.displacement1Pass = new ShaderPass(this.displacement1Effect);
    this.displacement1Pass.renderToScreen = true;
    this.composer.addPass(this.displacement1Pass);
  }

  render() {
    this.time += 0.05;
    this.scroll.render();
    this.previousScroll = this.currentScroll;

    this.currentScroll = this.scroll.scrollToRender;

    if (
      Math.round(this.previousScroll) !== Math.round(this.currentScroll) ||
      this.isHover
    ) {
      this.setPosition();
      this.displacement1Pass.uniforms.uScrollSpeed.value =
        this.scroll.speedTarget;
      this.displacement1Pass.uniforms.uTime.value = this.time;

      this.materials.forEach((m) => {
        m.uniforms.uTime.value = this.time;
      });

      // this.renderer.render(this.scene, this.camera);
      this.composer.render();
    }

    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch({
  dom: document.getElementById("container"),
});

// to get the wave aanmation on the top like in the fiiirst website, easiest waay is to use post-pro instead of fraagment shader
