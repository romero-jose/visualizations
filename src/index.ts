import * as three from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const OFFSET = 10;
const WIDTH = 6;
const HEIGHT = 4;
const ARROW_WIDTH = 1;
const LINE_WIDTH = 0.2;

const clock = new three.Clock();

let scene: three.Scene, camera: three.PerspectiveCamera, renderer: three.WebGLRenderer, labelRenderer: CSS2DRenderer, iteration_mixer: three.AnimationMixer;

function init(): void {
    scene = new three.Scene();
    scene.background = new three.Color(0x050505);

    camera = new three.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 0, 100);
    scene.add(camera);

    // Geometry

    const num_nodes = 10;

    const link_object = create_link('node 1');
    scene.add(link_object);

    const arrow_group = new three.Group();
    const iterator_arrow = create_arrow('iterator_arrow');
    iterator_arrow.rotateZ(3 * Math.PI / 2);
    iterator_arrow.position.set(0, OFFSET - WIDTH + WIDTH / 2 + HEIGHT / 2, 0);
    arrow_group.add(iterator_arrow);

    scene.add(arrow_group);

    const nodes = create_nodes(num_nodes);
    scene.add(nodes);

    // Animation
    const step_time = 1;

    iteration_mixer = new three.AnimationMixer(arrow_group);

    const iterate_animation_clip = iterate_animation(num_nodes, step_time);
    const fade_out_animation_clip = opacity_animation(step_time, 1, 0);
    const fade_in_animation_clip = opacity_animation(step_time, 0, 1);

    const actions: Record<string, three.AnimationAction> = {
        'iterate_action': iteration_mixer.clipAction(iterate_animation_clip),
        'fade_out_action': iteration_mixer.clipAction(fade_out_animation_clip),
        'fade_in_action': iteration_mixer.clipAction(fade_in_animation_clip),
    };

    for (let action in actions) {
        actions[action].clampWhenFinished = true;
        actions[action].loop = three.LoopOnce;
    }

    actions['iterate_action'].play();

    const action_sequence = [
        actions.iterate_action,
        actions.fade_out_action,
        actions.fade_in_action,
    ]

    renderer = new three.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.getElementById('container').appendChild(labelRenderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

// function play_next_action(action_sequence: three.AnimationAction[]) {
//     if (action_sequence.length == 0) return;
//     const current_action = action_sequence[0];
//     action_sequence = action_sequence.slice(1,);
// }

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
    const clip = new three.AnimationClip('Iterate', num_nodes * time, [position_kf]);
    return clip;
}

function opacity_animation(time: number, inital_opacity: number = 0, final_opacity: number = 1) {
    const values = [inital_opacity, final_opacity];
    const times = [0, time];
    const opacity_kf = new three.NumberKeyframeTrack('iterator_arrow.opacity', times, values);
    const clip = new three.AnimationClip('Dissapear', time, [opacity_kf]);
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

    if (iteration_mixer) {

        iteration_mixer.update(delta);

    }

    renderer.render(scene, camera);
}

init();
animate();
