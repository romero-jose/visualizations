import * as three from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { AnimationAction } from 'three';
import { resolve } from '../webpack.config';

const OFFSET = 10;
const WIDTH = 6;
const HEIGHT = 4;
const ARROW_WIDTH = 1;
const LINE_WIDTH = 0.2;

const clock = new three.Clock();

let scene: three.Scene,
    camera: three.PerspectiveCamera,
    renderer: three.WebGLRenderer,
    labelRenderer: CSS2DRenderer,
    mixers: three.AnimationMixer[],
    controls: OrbitControls;

function init(): void {
    renderer = new three.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.getElementById('container').appendChild(labelRenderer.domElement);

    scene = new three.Scene();
    scene.background = new three.Color(0x050505);

    camera = new three.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 0, 100);
    scene.add(camera);

    mixers = [];

    controls = new OrbitControls(camera, document.getElementById('container'));
    controls.update();

    controls.minDistance = 1;
    controls.maxDistance = 1000;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableRotate = false;
    controls.enableDamping = false;

    animate_add_node(0, "0")
        .then(() => animate_add_node(1, "1"))
        .then(() => animate_add_node(2, "2"))
        .then(() => animate_add_node(3, "3"))
        .then(() => animate_add_node(4, "4"))
        .then(() => animate_add_node(5, "5"))
        .then(() => animate_add_node(6, "6"))
        ;

    window.addEventListener('resize', onWindowResize);
}

type AnimationActionRecord = Record<string, AnimationAction>

function configure_actions(actions: AnimationActionRecord) {
    Object.keys(actions).forEach(action => {
        actions[action].clampWhenFinished = true;
        actions[action].loop = three.LoopOnce;
    });
}

function animate_add_node(num_nodes: number, value: string) {
    return new Promise<void>((resolve, reject) => {
        // Create iterator arrow
        const iterator_arrow_group = new three.Group();
        iterator_arrow_group.name = "iterator_arrow_group";
        const iterator_arrow = create_arrow('iterator_arrow');
        iterator_arrow.rotateZ(3 * Math.PI / 2);
        iterator_arrow.position.set(0, OFFSET - WIDTH + WIDTH / 2 + HEIGHT / 2, 0);
        iterator_arrow.material.opacity = 0;
        iterator_arrow_group.add(iterator_arrow);
        scene.add(iterator_arrow_group);

        // Create node
        const node = create_node(value, 0);
        const new_pos = node.position.add(new three.Vector3(num_nodes * OFFSET, 0, 0));
        node.position.set(new_pos.x, new_pos.y, new_pos.z);
        node.name = `node_${num_nodes}`;
        scene.add(node);

        // Create arrow
        const arrow = create_arrow();
        arrow.position.set(num_nodes * OFFSET + WIDTH / 4, 0, 0.01);
        arrow.material.transparent = true;
        arrow.material.opacity = 0;
        scene.add(arrow);

        // Animation
        const step_time = 2;

        const iterator_arrow_mixer = new three.AnimationMixer(iterator_arrow_group);
        const node_mixer = new three.AnimationMixer(node);
        const arrow_mixer = new three.AnimationMixer(arrow);

        const iterate_animation_clip = iterate_animation(num_nodes, step_time);
        const fade_out_animation_clip = opacity_animation('iterator_arrow', step_time, 1, 0);
        const fade_in_animation_clip = opacity_animation('iterator_arrow', step_time, 0, 1);

        const iterator_actions: AnimationActionRecord = {
            'iterate': iterator_arrow_mixer.clipAction(iterate_animation_clip),
            'fade_out': iterator_arrow_mixer.clipAction(fade_out_animation_clip),
            'fade_in': iterator_arrow_mixer.clipAction(fade_in_animation_clip),
        };
        configure_actions(iterator_actions);

        const node_fade_in_animation_clip = opacity_animation(`${node.name}/node_group/node`, step_time, 0, 1);

        const node_actions = {
            'fade_in': node_mixer.clipAction(node_fade_in_animation_clip),
        };
        configure_actions(node_actions);

        const arrow_fade_in_clip = opacity_animation(".", step_time, 0, 1);
        const arrow_actions: AnimationActionRecord = {
            'fade_in': arrow_mixer.clipAction(arrow_fade_in_clip),
        };
        configure_actions(arrow_actions);

        const iterator_mediator = new AnimationMediator(iterator_arrow_mixer, iterator_actions,
            ["fade_in", "iterate", "fade_out"]);
        const node_mediator = new AnimationMediator(node_mixer, node_actions, ["fade_in"]);
        const arrow_mediator = new AnimationMediator(arrow_mixer, arrow_actions, ["fade_in"]);

        iterator_mediator.on_finish = () => {
            console.log("Iteration finish");
            scene.remove(iterator_arrow_group);
            mixers.pop();
            mixers.push(node_mixer);
            node_mediator.play();
        };

        node_mediator.on_finish = () => {
            console.log("Node finish");
            mixers.pop();
            mixers.push(arrow_mixer);
            arrow_mediator.play();
            (node.getObjectByName("node") as three.Mesh<three.PlaneGeometry, three.MeshBasicMaterial>).material.transparent = false;
        };

        arrow_mediator.on_finish = () => {
            mixers.pop();
            console.log("Arrow finish");
            arrow.material.transparent = false;
            resolve();
        };

        console.log("Iteration start");
        mixers.push(iterator_arrow_mixer);
        iterator_mediator.play();
    });
}

function iterate_animation(num_nodes: number, time: number) {
    if (num_nodes === 0) {
        return new three.AnimationClip("Dummy", 1, []);
    }
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
    const clip = new three.AnimationClip('Iterate', times[times.length - 1], [position_kf]);
    console.log(times);
    return clip;
}

function opacity_animation(target: string, time: number, inital_opacity: number = 0, final_opacity: number = 1) {
    const values = [inital_opacity, final_opacity];
    const times = [0, time];
    const opacity_kf = new three.NumberKeyframeTrack(`${target}.material.opacity`, times, values);
    const clip = new three.AnimationClip('Dissapear', time, [opacity_kf]);
    return clip;
}

function create_node(value: string, opacity: number = 1): three.Group {
    const group = new three.Group();
    group.name = "node_group";

    const geometry = new three.PlaneGeometry(WIDTH, HEIGHT);
    const material = new three.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: opacity });
    const node = new three.Mesh(geometry, material);
    node.position.set(0, 0, 0);
    node.name = "node";
    group.add(node);

    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'label';
    nodeDiv.textContent = value;
    nodeDiv.style.marginTop = '0em';
    nodeDiv.style.fontSize = '2em';
    nodeDiv.style.fontFamily = 'Source Sans Pro';
    const nodeLabel = new CSS2DObject(nodeDiv);
    nodeLabel.position.set(0, 0, 0);
    nodeLabel.name = "nodeLabel";
    group.add(nodeLabel);
    document.getElementById('container').appendChild(nodeDiv);

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

function create_arrow(name: string = ''): three.Mesh<three.BufferGeometry, three.MeshBasicMaterial> {
    const material = new three.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 1 });

    const length = OFFSET - WIDTH + WIDTH / 2;
    const width = LINE_WIDTH;
    const head_length = ARROW_WIDTH;
    const head_width = ARROW_WIDTH;

    const head_geometry = arrow_geometry(length, width, head_length, head_width)
    const mesh = new three.Mesh(head_geometry, material);
    mesh.name = name;

    return mesh;
}

function onWindowResize(): void {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    const delta = clock.getDelta();
    mixers.forEach(mixer => {
        mixer.update(delta);
    });
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

type AnimationCallback = () => void;

class AnimationMediator {
    mixer: three.AnimationMixer;
    actions: Record<string, three.AnimationAction>;
    sequence: string[];
    current_action: number;
    on_finish: AnimationCallback;

    constructor(mixer: three.AnimationMixer, actions: Record<string, three.AnimationAction>, sequence: string[], on_finish: AnimationCallback = () => { }) {
        this.mixer = mixer;
        this.actions = actions;
        this.sequence = sequence;
        this.current_action = 0;
        this.on_finish = on_finish;

        this.mixer.addEventListener('finished', (/* event */) => {
            this.on_clip_finish()
        });
    }

    register_action(name: string, action: three.AnimationAction) {
        this.sequence.push(name);
        this.actions[name] = action;
    }

    queue_action(name: string) {
        this.sequence.push(name);
    }

    on_clip_finish() {
        if (this.current_action === this.sequence.length - 1) {
            this.on_finish();
            return;
        }
        const action = this.get_current_action();
        this.current_action++;
        const current_action = this.get_current_action();
        current_action.reset();
        current_action.setLoop(three.LoopOnce, 1);
        current_action.play();
    }

    get_current_action() {
        return this.actions[this.sequence[this.current_action]];
    }

    play() {
        this.get_current_action().play();
    }
}

init();
animate();
