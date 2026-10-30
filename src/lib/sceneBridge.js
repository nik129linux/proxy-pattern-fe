/** Lets the React tree talk to the WebGL scene, which loads later or never. */
let scene = null;

export function connectScene(instance) {
  scene = instance;
}

export function emitCall(entry) {
  scene?.emitCall(entry);
}

export function pulseGate() {
  scene?.pulse();
}

export function setGlassPanel(element) {
  scene?.setPanel(element);
}

export function hoverRow(element) {
  scene?.setHoverRow(element);
}
