import * as THREE from 'three'

const OFFSET = 14;
const WIDTH = 8;
const HEIGHT = 5;
const ARROW_WIDTH = 1;
const LINE_WIDTH = 0.2;

let scene, camera, renderer;
let root;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 0, 100);
    scene.add(camera);

    root = new THREE.Group();

    const l = link();
    root.add(l);
    scene.add(root);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById( 'container' ).appendChild( renderer.domElement );

    window.addEventListener('resize', onWindowResize);
    renderer.render(scene, camera);
}

function link() {
    const link = new THREE.Group();
    link.add(node());
    link.add(arrow());
    return link;
}

function node() {
    const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const node = new THREE.Mesh(geometry, material);
    node.position.set(0, 0, 0);
    return node;
}

function arrow() {
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });

    const plane_geometry = new THREE.PlaneGeometry(OFFSET - WIDTH / 2, LINE_WIDTH);
    const plane = new THREE.Mesh(plane_geometry, material);
    plane.position.set(OFFSET / 2, 0, 0);

    const length = OFFSET;
    const arrow_length = ARROW_WIDTH;
    const arrow_width = ARROW_WIDTH;
    const width = LINE_WIDTH;
    const tail_length = length - arrow_length;

    const head_geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array( [
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

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.render(scene, camera);

}

init();
