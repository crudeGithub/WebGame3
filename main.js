// main.js
// Game Configuration
const COLORS = {
    1: 0xff4757, // Red
    2: 0x2ed573, // Green
    3: 0x1e90ff, // Blue
    4: 0xffa502, // Orange
    5: 0x9b59b6, // Purple
};

const NUT_RADIUS = 0.9;
const NUT_HEIGHT = 0.65;
const BOLT_RADIUS = 0.5;
const BOLT_HEIGHT = 4.0; // Fits 4 nuts easily
const BOLT_BASE_RADIUS = 1.3;
const BOLT_BASE_HEIGHT = 0.4;

// Geometries & Materials
let boltGeom, boltBaseGeom, boltMat;
const nutGeometries = {};
const nutMaterials = {};

function initGeometries() {
    boltMat = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa, metalness: 0.6, roughness: 0.3
    });

    boltGeom = new THREE.CylinderGeometry(BOLT_RADIUS, BOLT_RADIUS, BOLT_HEIGHT, 16);
    boltGeom.translate(0, BOLT_HEIGHT / 2, 0);

    // Create hexagonal bolt base
    const baseShape = new THREE.Shape();
    const baseRadius = BOLT_BASE_RADIUS;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + (Math.PI / 6);
        const x = Math.cos(angle) * baseRadius;
        const y = Math.sin(angle) * baseRadius;
        if (i === 0) baseShape.moveTo(x, y);
        else baseShape.lineTo(x, y);
    }
    const baseExtrudeSettings = {
        depth: BOLT_BASE_HEIGHT, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05
    };
    boltBaseGeom = new THREE.ExtrudeGeometry(baseShape, baseExtrudeSettings);
    boltBaseGeom.rotateX(Math.PI / 2);
    boltBaseGeom.translate(0, BOLT_BASE_HEIGHT, 0);

    const shape = new THREE.Shape();
    const hexSide = NUT_RADIUS;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + (Math.PI / 6);
        const x = Math.cos(angle) * hexSide;
        const y = Math.sin(angle) * hexSide;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, BOLT_RADIUS + 0.05, 0, Math.PI * 2, false);
    shape.holes.push(holePath);

    const extrudeSettings = {
        depth: NUT_HEIGHT, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05
    };
    const nutGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    nutGeom.rotateX(Math.PI / 2);
    nutGeom.computeBoundingBox();
    const bbox = nutGeom.boundingBox;
    nutGeom.translate(0, -bbox.min.y, 0);

    nutGeometries.base = nutGeom;

    for (const [id, color] of Object.entries(COLORS)) {
        nutMaterials[id] = new THREE.MeshStandardMaterial({
            color: color, metalness: 0.1, roughness: 0.2
        });
    }
}

function createBoltMesh() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(boltBaseGeom, boltMat);
    base.castShadow = true; base.receiveShadow = true;
    group.add(base);

    const rod = new THREE.Mesh(boltGeom, boltMat);
    rod.castShadow = true; rod.receiveShadow = true;
    rod.position.y = BOLT_BASE_HEIGHT;
    group.add(rod);

    // Add dome top to bolt to match reference
    const domeGeom = new THREE.SphereGeometry(BOLT_RADIUS, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeom, boltMat);
    dome.position.y = BOLT_BASE_HEIGHT + BOLT_HEIGHT;
    dome.castShadow = true;
    group.add(dome);

    return group;
}

function createNutMesh(colorId) {
    const mesh = new THREE.Mesh(nutGeometries.base, nutMaterials[colorId]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
}

// Level Data & State
const LEVELS = [
    // Level 1: Very simple, 3 bolts, 2 colors. NOT starting in win position.
    [[1, 2, 1, 2], [2, 1, 2, 1], []],

    // Level 2: 3 bolts, 2 colors (classic simple)
    [[1, 1, 2, 2], [1, 2, 1, 2], []],

    // Level 3: 4 bolts, 3 colors
    [[3, 1, 2, 3], [1, 2, 3, 1], [2, 3, 1, 2], []],

    // Level 4: 5 bolts, 4 colors
    [[4, 1, 2, 3], [1, 2, 4, 3], [3, 4, 1, 2], [2, 3, 4, 1], []],

    // Level 5: 5 bolts, 4 colors (harder dispersion)
    [[1, 2, 3, 4], [2, 1, 4, 3], [3, 4, 1, 2], [4, 3, 2, 1], []],

    // Level 6: 6 bolts, 4 colors, 2 empty slots
    [[1, 2, 1, 2], [3, 4, 3, 4], [1, 4, 2, 3], [4, 2, 3, 1], [], []],

    // Level 7: 6 bolts, 5 colors
    [[5, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 1], [4, 5, 1, 2], []],

    // Level 8: 6 bolts, 5 colors
    [[1, 3, 5, 2], [2, 4, 1, 3], [3, 5, 2, 4], [4, 1, 3, 5], [5, 2, 4, 1], []],

    // Level 9: 7 bolts, 5 colors, 2 empty slots
    [[1, 2, 3, 4], [5, 1, 2, 3], [4, 5, 1, 2], [3, 4, 5, 1], [2, 3, 4, 5], [], []],

    // Level 10: 7 bolts, 6 colors
    [[6, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 1], [5, 6, 1, 2], []],

    // Level 11: 8 bolts, 6 colors, 2 empty slots
    [[1, 4, 2, 5], [3, 6, 1, 4], [2, 5, 3, 6], [4, 1, 5, 2], [6, 3, 4, 1], [5, 2, 6, 3], [], []],

    // Level 12: 8 bolts, 6 colors (layered)
    [[1, 1, 2, 2], [3, 3, 4, 4], [5, 5, 6, 6], [2, 2, 3, 3], [4, 4, 5, 5], [6, 6, 1, 1], [], []],

    // Level 13: 9 bolts, 7 colors, 2 empty slots
    [[7, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 7], [5, 6, 7, 1], [6, 7, 1, 2], [], []],

    // Level 14: 9 bolts, 7 colors (scrambled heavily)
    [[1, 3, 5, 7], [2, 4, 6, 1], [3, 5, 7, 2], [4, 6, 1, 3], [5, 7, 2, 4], [6, 1, 3, 5], [7, 2, 4, 6], [], []],

    // Level 15: 10 bolts, 8 colors, 2 empty slots
    [[8, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 7], [5, 6, 7, 8], [6, 7, 8, 1], [7, 8, 1, 2], [], []]
];
const MAX_NUTS_PER_BOLT = 4;
let currentLevelIdx = 0;
let sceneBolts = [];
let state = [];
let selectedBoltIdx = -1;

// Tweening Engine
let tweens = [];
let isAnimating = false;

// Sound & Juice Engine
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol = 0.1, upSweep = false, downSweep = false) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;

    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (upSweep) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + duration);
    } else if (downSweep) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + duration);
    }

    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playSelectSound() { playTone(400, 'sine', 0.1, 0.1, true, false); }
function playDropSound() { playTone(300, 'triangle', 0.15, 0.2, false, true); }
function playErrorSound() { playTone(150, 'sawtooth', 0.2, 0.1); }
function playClickSound() { playTone(600, 'sine', 0.05, 0.05, true, false); }
function playWinSound() {
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        setTimeout(() => playTone(f, 'sine', 0.3, 0.15), i * 80);
    });
}


function tweenVec3(vector, target, duration, onComplete) {
    tweens.push({
        vector,
        start: { x: vector.x, y: vector.y, z: vector.z },
        target,
        duration,
        startTime: performance.now(),
        onComplete
    });
}

function updateTweens(time) {
    if (tweens.length === 0) return;

    let pending = [];
    for (let t of tweens) {
        let elapsed = time - t.startTime;
        let progress = Math.min(elapsed / t.duration, 1.0);
        let ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Ease In Out

        t.vector.x = t.start.x + (t.target.x - t.start.x) * ease;
        t.vector.y = t.start.y + (t.target.y - t.start.y) * ease;
        t.vector.z = t.start.z + (t.target.z - t.start.z) * ease;

        if (progress >= 1.0) {
            if (t.onComplete) t.onComplete();
        } else {
            pending.push(t);
        }
    }
    tweens = pending;
}

const container = document.getElementById('game-container');
let scene, camera, renderer;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function init() {
    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera (Orthographic for 2.5D top-down from front)
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 20;
    camera = new THREE.OrthographicCamera(
        frustumSize * aspect / - 2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / - 2,
        1,
        1000
    );

    // Position camera for a top down from front view
    camera.position.set(0, 20, 25);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Slightly brighter ambient
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    // Adjust light to match new camera angle
    dirLight.position.set(5, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 5. Build Level & Environment
    initGeometries();

    const planeGeom = new THREE.PlaneGeometry(100, 100);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x3d5a80 });
    const plane = new THREE.Mesh(planeGeom, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    plane.receiveShadow = true;
    scene.add(plane);

    buildLevel(currentLevelIdx);

    // Interaction Events
    window.addEventListener('pointerdown', onPointerDown, false);

    // UI Events
    document.getElementById('btn-next-level').addEventListener('click', () => {
        playClickSound();
        currentLevelIdx = (currentLevelIdx + 1) % LEVELS.length;
        buildLevel(currentLevelIdx);
    });

    // Add retry button listener
    document.getElementById('btn-retry').addEventListener('click', () => {
        playClickSound();
        buildLevel(currentLevelIdx);
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
        playClickSound();
        buildLevel(currentLevelIdx);
    });

    // Resize handler
    window.addEventListener('resize', onWindowResize, false);

    // Render loop
    animate();
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 20;

    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    updateTweens(time);
    renderer.render(scene, camera);
}

function buildLevel(levelIndex) {
    sceneBolts.forEach(b => scene.remove(b));
    sceneBolts = [];
    state = JSON.parse(JSON.stringify(LEVELS[levelIndex]));
    selectedBoltIdx = -1;

    const numBolts = state.length;
    const spacingX = 3.5;
    const spacingZ = 3.5;
    let cols = Math.ceil(Math.sqrt(numBolts));
    if (numBolts <= 5) cols = numBolts;
    else cols = Math.min(numBolts, 4);

    const rows = Math.ceil(numBolts / cols);
    const startX = -((cols - 1) * spacingX) / 2;
    // Centering the grid properly without arbitrary offsets
    const startZ = -((rows - 1) * spacingZ) / 2;

    for (let i = 0; i < numBolts; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;

        const bolt = createBoltMesh();
        bolt.position.set(startX + col * spacingX, 0, startZ + row * spacingZ);
        bolt.userData = { id: i };
        scene.add(bolt);
        sceneBolts.push(bolt);

        const nuts = state[i];
        for (let j = 0; j < nuts.length; j++) {
            const nut = createNutMesh(nuts[j]);
            nut.position.y = BOLT_BASE_HEIGHT + j * NUT_HEIGHT;
            bolt.add(nut);
        }
    }

    document.getElementById('level-display').innerText = `LEVEL ${levelIndex + 1}`;
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('lose-screen').classList.add('hidden');
}

function onPointerDown(event) {
    if (!document.getElementById('win-screen').classList.contains('hidden') ||
        !document.getElementById('lose-screen').classList.contains('hidden') ||
        isAnimating) return;

    let clientX = event.clientX;
    let clientY = event.clientY;
    if (event.changedTouches) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
    }

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersectables = sceneBolts.flatMap(b => [b.children[0], b.children[1]]);
    const intersects = raycaster.intersectObjects(intersectables);

    if (intersects.length > 0) {
        let boltGroup = intersects[0].object.parent;
        handleBoltClick(boltGroup.userData.id);
    }
}

function getTopStack(boltIndex) {
    const stack = state[boltIndex];
    if (stack.length === 0) return { count: 0, colorId: null };

    const topColor = stack[stack.length - 1];
    let count = 0;

    for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i] === topColor) {
            count++;
        } else {
            break;
        }
    }
    return { colorId: topColor, count: count };
}

function handleBoltClick(index) {
    if (selectedBoltIdx === -1) {
        if (state[index].length > 0) {
            selectedBoltIdx = index;
            highlightBolt(index, true);
        }
    } else {
        if (selectedBoltIdx === index) {
            highlightBolt(index, false);
            selectedBoltIdx = -1;
        } else {
            if (canMove(selectedBoltIdx, index)) {
                moveNut(selectedBoltIdx, index);
                selectedBoltIdx = -1;
            } else {
                playErrorSound();
                highlightBolt(selectedBoltIdx, false);
                if (state[index].length > 0) {
                    selectedBoltIdx = index;
                    highlightBolt(index, true);
                } else {
                    selectedBoltIdx = -1;
                }
            }
        }
    }
}

function canMove(fromIdx, toIdx) {
    const fromStackInfo = getTopStack(fromIdx);
    if (fromStackInfo.count === 0) return false;

    const toStackLength = state[toIdx].length;
    if (toStackLength + fromStackInfo.count > MAX_NUTS_PER_BOLT) return false;

    if (toStackLength === 0) return true;

    const toTopColor = state[toIdx][toStackLength - 1];
    return toTopColor === fromStackInfo.colorId;
}

function moveNut(fromIdx, toIdx) {
    const fromStackInfo = getTopStack(fromIdx);
    const moveCount = fromStackInfo.count;

    // Update State
    for (let i = 0; i < moveCount; i++) {
        state[fromIdx].pop();
    }
    for (let i = 0; i < moveCount; i++) {
        state[toIdx].push(fromStackInfo.colorId);
    }

    const fromBolt = sceneBolts[fromIdx];
    const toBolt = sceneBolts[toIdx];

    // Get meshes to move
    const movingMeshes = [];
    for (let i = 0; i < moveCount; i++) {
        const mesh = fromBolt.children[fromBolt.children.length - 1 - i];
        movingMeshes.push(mesh);
    }
    movingMeshes.reverse(); // So index 0 is bottom nut of the moving stack

    const startX = fromBolt.position.x - toBolt.position.x;
    const startZ = fromBolt.position.z - toBolt.position.z;

    // Target base Y for the bottom nut of the moving stack
    const targetBaseY = BOLT_BASE_HEIGHT + (state[toIdx].length - moveCount) * NUT_HEIGHT;
    // Lift height needs to clear the tallest possible stack (+ margin)
    const liftY = BOLT_BASE_HEIGHT + MAX_NUTS_PER_BOLT * NUT_HEIGHT + 1.2;

    isAnimating = true;
    let tweensCompleted = 0;

    movingMeshes.forEach((nutMesh, i) => {
        const startY = nutMesh.position.y;

        // Reparent
        fromBolt.remove(nutMesh);
        toBolt.add(nutMesh);
        nutMesh.position.set(startX, startY, startZ);

        // Tween seq
        tweenVec3(nutMesh.position, { x: startX, y: liftY + i * NUT_HEIGHT, z: startZ }, 120, () => {
            tweenVec3(nutMesh.position, { x: 0, y: liftY + i * NUT_HEIGHT, z: 0 }, 180, () => {
                tweenVec3(nutMesh.position, { x: 0, y: targetBaseY + i * NUT_HEIGHT, z: 0 }, 120, () => {
                    // Juicy Drop
                    nutMesh.scale.set(1.15, 0.85, 1.15);
                    tweenVec3(nutMesh.scale, { x: 1, y: 1, z: 1 }, 150);

                    tweensCompleted++;
                    if (tweensCompleted === moveCount) {
                        playDropSound();
                        isAnimating = false;
                        checkWin();
                    }
                });
            });
        });
    });
}

function highlightBolt(index, isSelected) {
    const stackInfo = getTopStack(index);
    if (stackInfo.count === 0) return;

    if (isSelected) playSelectSound();

    const boltGroup = sceneBolts[index];
    const topNuts = [];
    for (let i = 0; i < stackInfo.count; i++) {
        topNuts.push(boltGroup.children[boltGroup.children.length - 1 - i]);
    }
    topNuts.reverse();

    const baseIndex = state[index].length - stackInfo.count;

    isAnimating = true;
    let completed = 0;

    topNuts.forEach((nutMesh, i) => {
        const targetY = BOLT_BASE_HEIGHT + (baseIndex + i) * NUT_HEIGHT + (isSelected ? 0.6 : 0);
        tweenVec3(nutMesh.position, { x: 0, y: targetY, z: 0 }, 100, () => {
            completed++;
            if (completed === stackInfo.count) {
                isAnimating = false;
            }
        });

        // Juicy scale pop
        if (isSelected) {
            nutMesh.scale.set(0.9, 1.1, 0.9);
            tweenVec3(nutMesh.scale, { x: 1, y: 1, z: 1 }, 150);
        } else {
            nutMesh.scale.set(1.1, 0.9, 1.1);
            tweenVec3(nutMesh.scale, { x: 1, y: 1, z: 1 }, 120);
        }
    });
}

function checkWin() {
    let isWon = true;

    for (let stack of state) {
        if (stack.length > 0 && stack.length < MAX_NUTS_PER_BOLT) {
            isWon = false;
            break;
        }
        if (stack.length === MAX_NUTS_PER_BOLT) {
            const firstColor = stack[0];
            for (let i = 1; i < stack.length; i++) {
                if (stack[i] !== firstColor) {
                    isWon = false;
                    break;
                }
            }
        }
    }

    if (isWon) {
        playWinSound();
        document.getElementById('win-screen').classList.remove('hidden');
    } else if (!hasValidMoves()) {
        playErrorSound();
        document.getElementById('lose-screen').classList.remove('hidden');
    }
}

function hasValidMoves() {
    for (let fromIdx = 0; fromIdx < state.length; fromIdx++) {
        const fromStackInfo = getTopStack(fromIdx);
        if (fromStackInfo.count === 0) continue;

        for (let toIdx = 0; toIdx < state.length; toIdx++) {
            if (fromIdx === toIdx) continue;

            const toStackLength = state[toIdx].length;
            if (toStackLength + fromStackInfo.count > MAX_NUTS_PER_BOLT) continue;

            if (toStackLength === 0) return true; // Can move to empty

            if (state[toIdx][toStackLength - 1] === fromStackInfo.colorId) {
                return true; // Can move to matching color
            }
        }
    }
    return false;
}

// Start
init();
