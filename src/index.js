import * as THREE from 'three'

const OFFSET = 14;
const WIDTH = 8;
const HEIGHT = 5;
const ARROW_WIDTH = 1;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', onWindowResize);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xefefef);

function add_nodes() {
    const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    const material = new THREE.MeshBasicMaterial({ color: 0x808080 });
    const node = new THREE.Mesh(geometry, material);

    for (let i = 0; i < 10; ++i) {
        const cpy = node.clone()
        cpy.position.set(i * OFFSET, 0, 0);
        scene.add(cpy);
    }
}

function add_arrows() {
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const points = [];
    const x0 = WIDTH / 4;
    const x1 = OFFSET - WIDTH / 4;
    const y = ARROW_WIDTH / 2;
    points.push(new THREE.Vector3(x0, 0, 0));
    points.push(new THREE.Vector3(x1 - y, 0, 0));
    points.push(new THREE.Vector3(x1 - y, y, 0));
    points.push(new THREE.Vector3(x1, 0, 0));
    points.push(new THREE.Vector3(x1 - y, -y, 0));
    points.push(new THREE.Vector3(x1 - y, 0, 0));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    for (let i = 0; i < 10; ++i) {
        const cpy = line.clone()
        cpy.position.set(i * OFFSET, 0, 0);
        scene.add(cpy);
    }
}

add_nodes()
add_arrows()
renderer.render(scene, camera);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}
