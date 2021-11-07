import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const OFFSET = 14;
const WIDTH = 8;
const HEIGHT = 5;
const ARROW_WIDTH = 1;
const LINE_WIDTH = 0.2;

const clock = new THREE.Clock();

let scene, camera, renderer, labelRenderer;
let root;

let nodes = [];
let num = 0;

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
    labelRenderer.domElement.style.top = '0px';
    document.getElementById('container').appendChild(labelRenderer.domElement);

    document.addEventListener('pointerdown', onPointerDown);

    window.addEventListener('resize', onWindowResize);
}

function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    root.position.set(Math.sin(elapsed) * 5, 0, 0);

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function link(value) {
    const link = new THREE.Group();
    link.add(node(value));

    const arrow_obj = arrow();
    arrow_obj.position.set(WIDTH / 4, 0, 0.1);
    link.add(arrow_obj);

    return link;
}

function node(value) {
    const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const node = new THREE.Mesh(geometry, material);
    node.position.set(0, 0, 0);

    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'label';
    nodeDiv.textContent = value;
    nodeDiv.style.margin_top = '-1em';
    nodeDiv.style.fontSize = '3em';
    nodeDiv.style.fontFamily = 'Source Sans Pro';
    const nodeLabel = new CSS2DObject(nodeDiv);
    nodeLabel.position.set(0, 0, 0);
    node.add(nodeLabel);

    return node;
}

function arrow() {
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });

    const plane_geometry = new THREE.PlaneGeometry(OFFSET - WIDTH / 2, LINE_WIDTH);
    const plane = new THREE.Mesh(plane_geometry, material);
    plane.position.set(OFFSET / 2, 0, 0);

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
    const l = link(num.toString());
    num++;
    const x = (nodes.length ? nodes[nodes.length - 1].position.x + OFFSET : 0);
    l.position.set(x, 0, 0);
    nodes.push(l);
    root.add(l);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();
