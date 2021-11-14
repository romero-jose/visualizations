import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Camera, Event, Group, Object3D, PerspectiveCamera, Renderer, Scene } from 'three';

const OFFSET = 14;
const WIDTH = 8;
const HEIGHT = 5;
const ARROW_WIDTH = 1;
const LINE_WIDTH = 0.2;

const FADE_IN_TIME = 1.0; // Seconds

const clock = new THREE.Clock();

let scene: Scene, camera: PerspectiveCamera, renderer: THREE.WebGLRenderer, labelRenderer: CSS2DRenderer;
let root: Group;

let nodes: any[] = [];
let num = 0;
let added_time: number;

let isShiftDown = false;

type InterpolationFunction = (dt: number) => number

function linear_interpolation(dt: number): number {
    return dt;
}

class Object {
    object3d: Object3D = null
    color: string = "#ffffff"
    name: string = "unnamed"

    interpolate(sigma: number): void {

    }
}

class NodeObject extends Object {
    inital_position: THREE.Vector3
    final_position: THREE.Vector3

    interpolate(sigma: number): void {
        const new_position = this.final_position.sub(this.inital_position).multiplyScalar(sigma);
        this.object3d.position.set(new_position.x, new_position.y, new_position.z);
    }
}

class Animation {
    object: Object = null
    runtime: number = 3
    interpolation_function: InterpolationFunction = linear_interpolation
    delay_ratio: number = 0.1

    init() {

    }

    interpolate(sigma: number): void {
        this.object.interpolate(sigma)
    }

    delete() {

    }
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 0, 100);
    scene.add(camera);

    root = new THREE.Group();

    scene.add(root);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.alignItems = 'center';
    labelRenderer.domElement.style.justifyContent = 'center';
    // labelRenderer.domElement.style.top = '2em';
    document.getElementById('container').appendChild(labelRenderer.domElement);

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('keyup', onDocumentKeyUp);

    const controls = new OrbitControls(camera, renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function scurve(x: number) {
    return (x > Math.PI / 2 ? 1 : Math.sin(x));
}

function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    const time_since_added = elapsed - added_time;
    if (nodes.length > 0 && time_since_added < FADE_IN_TIME) {
        const last = nodes[nodes.length - 1];
        const node = last.children[0];
        const node_material = node.material;
        node_material.opacity = scurve(time_since_added / FADE_IN_TIME);
        const arrow = last.children[1];
        const arrow_material = arrow.material;
        arrow_material.opacity = scurve(time_since_added / FADE_IN_TIME);
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function link(value: string) {
    const link = new THREE.Group();
    link.add(node(value));

    const arrow_obj = arrow();
    arrow_obj.position.set(WIDTH / 4, 0, 0.1);
    link.add(arrow_obj);
    added_time = clock.getElapsedTime();
    return link;
}

function node(value: string) {
    const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const node = new THREE.Mesh(geometry, material);
    node.position.set(0, 0, 0);

    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'label';
    nodeDiv.textContent = value;
    nodeDiv.style.marginTop = '-1em';
    nodeDiv.style.fontSize = '3em';
    nodeDiv.style.fontFamily = 'Source Sans Pro';
    const nodeLabel = new CSS2DObject(nodeDiv);
    nodeLabel.position.set(0, 0, 0);
    node.add(nodeLabel);

    return node;
}

function arrow() {
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 1 });

    const length = OFFSET - WIDTH + WIDTH / 2;
    const arrow_length = ARROW_WIDTH;
    const arrow_width = ARROW_WIDTH;
    const width = LINE_WIDTH;
    const tail_length = length - arrow_length;

    const head_geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        0, width / 2, 0,
        0, -width / 2, 0,
        tail_length, -width / 2, 0,

        tail_length, -width / 2, 0,
        tail_length, width / 2, 0,
        0, width / 2, 0,

        tail_length, arrow_width / 2, 0,
        tail_length, -arrow_width / 2, 0,
        length, 0, 0,
    ])
    head_geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const mesh = new THREE.Mesh(head_geometry, material);

    return mesh;
}

function onPointerDown() {
    if (!isShiftDown) {
        const l = link(num.toString());
        num++;
        const x: number = (nodes.length ? nodes[nodes.length - 1].position.x + OFFSET : 0);
        l.position.set(x, 0, 0);
        nodes.push(l);
        root.add(l);
    } else if (num > 0) {
        num--;
        const l = nodes.pop();
        root.remove(l);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentKeyDown(event: Event) {
    switch (event.keyCode) {

        case 16: isShiftDown = true; break;
    }
}

function onDocumentKeyUp(event: Event) {
    switch (event.keyCode) {
        case 16: isShiftDown = false; break;
    }
}

init();
animate();