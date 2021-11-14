import * as three from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const OFFSET = 10;
const WIDTH = 6;
const HEIGHT = 4;
const ARROW_WIDTH = 1;
const LINE_WIDTH = 0.2;

const FADE_IN_TIME = 1.0; // Seconds

const clock = new three.Clock();

let scene: three.Scene, camera: three.PerspectiveCamera, renderer: three.WebGLRenderer, labelRenderer: CSS2DRenderer, mixer: three.AnimationMixer;
let root: three.Group;

let nodes: any[] = [];
let num = 0;
let added_time: number;

let isShiftDown = false;

function init(): void {
    scene = new three.Scene();
    scene.background = new three.Color(0x050505);

    camera = new three.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 0, 100);
    scene.add(camera);

    const link_object = create_link('node 1');
    scene.add(link_object);

    const arrow_group = new three.Group();
    const iterator_arrow = create_arrow();
    iterator_arrow.rotateZ(3 * Math.PI / 2);
    iterator_arrow.position.set(0, OFFSET - WIDTH + WIDTH / 2 + HEIGHT / 2, 0);
    arrow_group.add(iterator_arrow);

    scene.add(arrow_group);

    const num_nodes = 10;
    const step_time = 1;
    const iterate_animation_clip = iterate_animation(num_nodes, step_time);

    const nodes = create_nodes(num_nodes);
    scene.add(nodes);

    mixer = new three.AnimationMixer(arrow_group);

    const clip_action = mixer.clipAction(iterate_animation_clip);
    clip_action.play();

    renderer = new three.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.getElementById('container').appendChild(labelRenderer.domElement);

    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('keyup', onDocumentKeyUp);

    window.addEventListener('resize', onWindowResize);
}

function create_nodes(num_nodes: number): three.Group {
    const group = new three.Group();

    for (let i = 0; i < num_nodes; ++i) {
        const link_object = create_link(i.toString());
        link_object.position.set(OFFSET * i, 0, 0);
        group.add(link_object);
    }

    return group;
}

function iterate_animation(num_nodes: number, time: number) {
    let values: number[] = Array(3 * num_nodes * 2);
    let times: number[] = Array(num_nodes);
    for (let i = 0; i < num_nodes; ++i) {
        values[6 * i + 0] = i * OFFSET;
        values[6 * i + 1] = 0;
        values[6 * i + 2] = 0;
        values[6 * i + 3] = i * OFFSET;
        values[6 * i + 4] = 0;
        values[6 * i + 5] = 0;
        times[2 * i] = 2 * i * time;
        times[2 * i + 1] = (2 * i + 1) * time
    }
    const position_kf = new three.VectorKeyframeTrack('.position', times, values);
    const clip = new three.AnimationClip('Action', num_nodes * time, [position_kf]);
    return clip;
}

function create_link(value: string): three.Group {
    const link = new three.Group();
    link.add(create_node(value));
    const arrow_obj = create_arrow();
    arrow_obj.position.set(WIDTH / 4, 0, 0.001);
    link.add(arrow_obj);
    return link;
}

function create_node(value: string): three.Group {
    const group = new three.Group();

    const geometry = new three.PlaneGeometry(WIDTH, HEIGHT);
    const material = new three.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const node = new three.Mesh(geometry, material);
    node.position.set(0, 0, 0);
    group.add(node);

    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'label';
    nodeDiv.textContent = value;
    nodeDiv.style.marginTop = '0em';
    nodeDiv.style.fontSize = '3em';
    nodeDiv.style.fontFamily = 'Source Sans Pro';
    const nodeLabel = new CSS2DObject(nodeDiv);
    nodeLabel.position.set(0, 0, 0);
    group.add(nodeLabel);

    return group;
}

function arrow_geometry(length: number, width: number, head_length: number, head_width: number): three.BufferGeometry {
    const tail_length = length - head_length;

    const geometry = new three.BufferGeometry();
    const vertices = new Float32Array([
        0, width / 2, 0,
        0, -width / 2, 0,
        tail_length, -width / 2, 0,

        tail_length, -width / 2, 0,
        tail_length, width / 2, 0,
        0, width / 2, 0,

        tail_length, head_width / 2, 0,
        tail_length, -head_width / 2, 0,
        length, 0, 0,
    ])
    geometry.setAttribute('position', new three.BufferAttribute(vertices, 3));

    return geometry;
}

function create_arrow(): three.Mesh<three.BufferGeometry, three.MeshBasicMaterial> {
    const material = new three.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 1 });

    const length = OFFSET - WIDTH + WIDTH / 2;
    const width = LINE_WIDTH;
    const head_length = ARROW_WIDTH;
    const head_width = ARROW_WIDTH;

    const head_geometry = arrow_geometry(length, width, head_length, head_width)
    const mesh = new three.Mesh(head_geometry, material);

    return mesh;
}

function onWindowResize(): void {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentKeyDown(event: three.Event): void {
    switch (event.keyCode) {

        case 16: isShiftDown = true; break;
    }
}

function onDocumentKeyUp(event: three.Event): void {
    switch (event.keyCode) {
        case 16: isShiftDown = false; break;
    }
}

function animate() {

    requestAnimationFrame(animate);

    render();

}

function render() {

    const delta = clock.getDelta();

    if (mixer) {

        mixer.update(delta);

    }

    renderer.render(scene, camera);
}

init();
animate();
