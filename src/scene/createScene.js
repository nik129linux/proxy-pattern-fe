import * as THREE from 'three';
import {
  cometFragment,
  cometVertex,
  dustFragment,
  downsampleFragment,
  dustVertex,
  gateFragment,
  gateVertex,
  glassFragment,
  glassVertex,
  skyFragment,
  skyVertex,
} from './shaders.js';

const COMET_POINTS = 1680;
const TAIL_POINTS = 14;
const COMET_LIFE = 3.4;
const BRANCHES = { inventory: 0, orders: 1, payments: 2 };
const SERVICE_COLORS = { inventory: '#a9aeff', orders: '#4fd8e8', payments: '#ffb27a' };
const SKY_RAMP = ['#100f49', '#1e187a', '#3634bc', '#4f4bf7', '#8687fd', '#3634bc', '#100f49'];
const GATE_RADIUS = 2.9;
const SCENE_SCALE = 0.7;
const SLOW_FRAME_MS = 26;

function displayColor(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

function fullScreenTriangle() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  return geometry;
}

function dustGeometry(count) {
  const geometry = new THREE.BufferGeometry();
  const attribute = (name, make) => {
    geometry.setAttribute(name, new THREE.BufferAttribute(Float32Array.from({ length: count }, make), 1));
  };
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  attribute('aSeed', Math.random);
  attribute('aSpeed', () => 0.012 + Math.random() * 0.02);
  attribute('aAngle', () => Math.random() * Math.PI * 2);
  attribute('aRadial', () => Math.sqrt(Math.random()));
  attribute('aSize', () => 0.6 + Math.random() * Math.random() * 2.4);
  return geometry;
}

function cometGeometry() {
  const geometry = new THREE.BufferGeometry();
  const float = (name, size = 1) => {
    geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(COMET_POINTS * size), size).setUsage(THREE.DynamicDrawUsage));
  };
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COMET_POINTS * 3), 3));
  ['aBirth', 'aLife', 'aBranch', 'aFailed', 'aAngle', 'aRadial', 'aSeed', 'aTail'].forEach((name) => float(name));
  float('aColor', 3);
  geometry.getAttribute('aBirth').array.fill(-100);
  geometry.getAttribute('aLife').array.fill(1);
  return geometry;
}

export function createScene(container, { animate, lowPower }) {
  const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: false, powerPreference: 'high-performance' });
  const dprCap = lowPower ? 1 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;
  renderer.domElement.className = 'scene-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);

  const axis = new THREE.Vector3(0.82, 0, 0.57).normalize();
  const sideA = new THREE.Vector3(0, 1, 0);
  const sideB = new THREE.Vector3().crossVectors(axis, sideA).normalize();

  const pointScale = { value: 1 };
  const time = { value: 0 };
  const flowUniforms = {
    uTime: time,
    uPointScale: pointScale,
    uAxis: { value: axis },
    uSideA: { value: sideA },
    uSideB: { value: sideB },
  };

  const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uScroll: { value: 0 },
      uTime: time,
      uAuroraA: { value: displayColor('#4f4bf7') },
      uAuroraB: { value: displayColor('#8687fd') },
      uRamp: { value: SKY_RAMP.map(displayColor) },
    },
  });
  const sky = new THREE.Mesh(fullScreenTriangle(), skyMaterial);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  scene.add(sky);

  const dustMaterial = new THREE.ShaderMaterial({
    vertexShader: dustVertex,
    fragmentShader: dustFragment,
    uniforms: { ...flowUniforms, uColor: { value: displayColor('#cdcefe') } },
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    transparent: true,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeometry(lowPower ? 1100 : 3200), dustMaterial);
  dust.frustumCulled = false;
  scene.add(dust);

  const cometMaterial = new THREE.ShaderMaterial({
    vertexShader: cometVertex,
    fragmentShader: cometFragment,
    uniforms: flowUniforms,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    transparent: true,
    depthWrite: false,
  });
  const comets = new THREE.Points(cometGeometry(), cometMaterial);
  comets.frustumCulled = false;
  scene.add(comets);

  const sceneTarget = new THREE.WebGLRenderTarget(4, 4, {
    generateMipmaps: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  });

  // Frost: a short chain of smaller copies, drawn only while the panel is on screen.
  // Per-frame mipmaps cost 30x more here, which is why they are not used.
  const blurTargets = [2, 4, 8].map(() => new THREE.WebGLRenderTarget(4, 4, {
    generateMipmaps: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  }));
  const downsampleUniforms = { tSource: { value: null }, uTexel: { value: new THREE.Vector2() } };
  const downsampleScene = new THREE.Scene();
  const downsampleMesh = new THREE.Mesh(
    fullScreenTriangle(),
    new THREE.ShaderMaterial({ vertexShader: glassVertex, fragmentShader: downsampleFragment, uniforms: downsampleUniforms, depthTest: false, depthWrite: false }),
  );
  downsampleMesh.frustumCulled = false;
  downsampleScene.add(downsampleMesh);

  // The gate: the Proxy itself, a ring of glass every call must cross
  const gateUniforms = {
    tScene: { value: sceneTarget.texture },
    uBuffer: { value: new THREE.Vector2(1, 1) },
    uFlash: { value: 0 },
  };
  const gateScene = new THREE.Scene();
  const gate = new THREE.Mesh(
    new THREE.TorusGeometry(GATE_RADIUS, 0.2, 32, lowPower ? 120 : 200),
    new THREE.ShaderMaterial({ vertexShader: gateVertex, fragmentShader: gateFragment, uniforms: gateUniforms }),
  );
  gate.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis);
  const gateRest = gate.quaternion.clone();
  gateScene.add(gate);

  const glassUniforms = {
    tScene: { value: sceneTarget.texture },
    tSoft: { value: blurTargets[0].texture },
    tFrost: { value: blurTargets[2].texture },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPanel: { value: new THREE.Vector4(0, 0, 0, 0) },
    uLens: { value: new THREE.Vector4(0, 0, 0, 0) },
    uLensOn: { value: 0 },
    uPanelOn: { value: 0 },
    uTime: time,
    uTint: { value: displayColor('#100f49') },
  };
  const glassScene = new THREE.Scene();
  const glassMesh = new THREE.Mesh(
    fullScreenTriangle(),
    new THREE.ShaderMaterial({ vertexShader: glassVertex, fragmentShader: glassFragment, uniforms: glassUniforms, depthTest: false, depthWrite: false }),
  );
  glassMesh.frustumCulled = false;
  glassScene.add(glassMesh);
  const glassCamera = new THREE.Camera();

  // Scroll flies the camera around the gate, through it, and out among the branches
  const cameraRoute = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 10.4),
    new THREE.Vector3(-3.6, 0.5, 8.4),
    axis.clone().multiplyScalar(-8.5).add(new THREE.Vector3(0, 0.4, 0)),
    axis.clone().multiplyScalar(-1.2),
    axis.clone().multiplyScalar(4.4),
    axis.clone().multiplyScalar(8.5),
  ]);
  const lookRoute = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    axis.clone().multiplyScalar(5),
    axis.clone().multiplyScalar(11),
    axis.clone().multiplyScalar(16),
  ]);

  const colors = Object.fromEntries(Object.entries(SERVICE_COLORS).map(([id, hex]) => [id, displayColor(hex)]));
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const lens = { x: 0, y: 0, w: 0, h: 0, on: 0, element: null, primed: false };
  let panelElement = null;
  let writeIndex = 0;
  let flash = 0;
  let clock = 0;
  let lastScroll = -1;
  let lastPanelTop = NaN;
  let width = 1;
  let height = 1;
  let quality = 1;
  let slowFrames = 0;
  let sampledFrames = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height, false);
    const buffer = renderer.getDrawingBufferSize(new THREE.Vector2());
    const sceneWidth = Math.ceil(buffer.x * SCENE_SCALE * quality);
    const sceneHeight = Math.ceil(buffer.y * SCENE_SCALE * quality);
    sceneTarget.setSize(sceneWidth, sceneHeight);
    [2, 4, 8].forEach((divisor, index) => {
      blurTargets[index].setSize(Math.ceil(sceneWidth / divisor), Math.ceil(sceneHeight / divisor));
    });
    gateUniforms.uBuffer.value.copy(buffer);
    camera.aspect = width / height;
    // Portrait screens pull back so the gate still fits
    camera.fov = camera.aspect < 1 ? 35 + (1 - camera.aspect) * 34 : 35;
    camera.updateProjectionMatrix();
    pointScale.value = buffer.y * SCENE_SCALE * quality * 0.062;
    glassUniforms.uResolution.value.set(width, height);
    lastScroll = -1;
  }

  function onPointerMove(event) {
    pointer.tx = event.clientX / width - 0.5;
    pointer.ty = event.clientY / height - 0.5;
  }

  function updateCamera(progress) {
    const route = THREE.MathUtils.smoothstep(progress, 0, 1);
    cameraRoute.getPoint(route, camera.position);
    const target = lookRoute.getPoint(route);
    camera.position.x += pointer.x * 0.5;
    camera.position.y -= pointer.y * 0.35;
    camera.lookAt(target);
  }

  function updateGlass() {
    if (!panelElement?.isConnected) {
      glassUniforms.uPanelOn.value = 0;
      return false;
    }
    const rect = panelElement.getBoundingClientRect();
    const visible = rect.bottom > 0 && rect.top < height;
    glassUniforms.uPanelOn.value = visible ? 1 : 0;
    if (visible) glassUniforms.uPanel.value.set(rect.left, rect.top, rect.width, rect.height);

    const hovered = lens.element?.isConnected ? lens.element.getBoundingClientRect() : null;
    if (hovered) {
      const follow = lens.primed ? 0.2 : 1;
      lens.x += (hovered.left + 4 - lens.x) * follow;
      lens.y += (hovered.top + 2 - lens.y) * follow;
      lens.w += (hovered.width - 8 - lens.w) * follow;
      lens.h += (hovered.height - 4 - lens.h) * follow;
      lens.primed = true;
    }
    lens.on += ((hovered ? 1 : 0) - lens.on) * 0.14;
    if (lens.on < 0.01) lens.primed = false;
    glassUniforms.uLens.value.set(lens.x, lens.y, lens.w, lens.h);
    glassUniforms.uLensOn.value = lens.on;

    const moved = rect.top !== lastPanelTop || hovered !== null || lens.on > 0.01;
    lastPanelTop = rect.top;
    return moved;
  }

  // Slow machines trade sharpness for smoothness, one step at a time
  function adaptQuality(deltaMs) {
    sampledFrames += 1;
    if (deltaMs > SLOW_FRAME_MS) slowFrames += 1;
    if (sampledFrames < 45) return;
    if (slowFrames > 30 && quality > 0.4) {
      quality *= 0.7;
      renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() * 0.8));
      resize();
    }
    sampledFrames = 0;
    slowFrames = 0;
  }

  function frame(_, deltaMs) {
    const delta = Math.min((deltaMs ?? 16) / 1000, 0.05);
    if (animate && !document.hidden) adaptQuality(deltaMs ?? 16);
    const max = document.documentElement.scrollHeight - height;
    const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    const glassMoved = updateGlass();

    if (!animate && progress === lastScroll && !glassMoved) return;
    lastScroll = progress;

    if (animate) {
      clock += delta;
      time.value = clock;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      flash *= 0.94;
      gateUniforms.uFlash.value = flash;
      gate.quaternion.copy(gateRest);
      gate.rotateZ(clock * 0.08);
      gate.rotateX(Math.sin(clock * 0.35) * 0.05);
    }

    skyMaterial.uniforms.uScroll.value = progress;
    updateCamera(progress);

    renderer.setRenderTarget(sceneTarget);
    renderer.clear();
    renderer.render(scene, camera);
    if (glassUniforms.uPanelOn.value > 0.5) {
      let source = sceneTarget;
      blurTargets.forEach((target) => {
        downsampleUniforms.tSource.value = source.texture;
        downsampleUniforms.uTexel.value.set(1 / source.width, 1 / source.height);
        renderer.setRenderTarget(target);
        renderer.render(downsampleScene, glassCamera);
        source = target;
      });
    }
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(glassScene, glassCamera);
    renderer.render(gateScene, camera);
  }

  function emitCall(entry) {
    if (!animate) return;
    const attributes = comets.geometry.attributes;
    const angle = Math.random() * Math.PI * 2;
    const radial = Math.sqrt(Math.random());
    const seed = Math.random();
    const branch = BRANCHES[entry.serviceId] ?? 0;
    const color = colors[entry.serviceId] ?? colors.inventory;
    const failed = entry.status === 'ERROR' ? 1 : 0;
    const start = time.value;

    for (let tail = 0; tail < TAIL_POINTS; tail++) {
      const i = writeIndex;
      writeIndex = (writeIndex + 1) % COMET_POINTS;
      attributes.aBirth.array[i] = start + tail * 0.009;
      attributes.aLife.array[i] = COMET_LIFE;
      attributes.aBranch.array[i] = branch;
      attributes.aFailed.array[i] = failed;
      attributes.aAngle.array[i] = angle;
      attributes.aRadial.array[i] = radial;
      attributes.aSeed.array[i] = seed;
      attributes.aTail.array[i] = 1 - tail / TAIL_POINTS;
      attributes.aColor.array.set([color.x, color.y, color.z], i * 3);
    }
    Object.values(attributes).forEach((attribute) => {
      attribute.needsUpdate = true;
    });
    window.setTimeout(() => {
      flash = Math.min(flash + 0.05, 0.45);
    }, COMET_LIFE * 0.51 * 1000);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  resize();

  return {
    frame,
    emitCall,
    pulse: () => {
      flash = 0.8;
    },
    setPanel: (element) => {
      panelElement = element;
      lastScroll = -1;
    },
    setHoverRow: (element) => {
      lens.element = element;
    },
    dispose: () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      scene.traverse((object) => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
      glassMesh.geometry.dispose();
      glassMesh.material.dispose();
      gate.geometry.dispose();
      gate.material.dispose();
      downsampleMesh.geometry.dispose();
      downsampleMesh.material.dispose();
      blurTargets.forEach((target) => target.dispose());
      sceneTarget.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
