export const downsampleFragment = /* glsl */ `
  uniform sampler2D tSource;
  uniform vec2 uTexel;
  varying vec2 vUv;

  void main() {
    gl_FragColor = 0.25 * (
      texture2D(tSource, vUv + uTexel * vec2(1.0, 1.0)) +
      texture2D(tSource, vUv + uTexel * vec2(-1.0, 1.0)) +
      texture2D(tSource, vUv + uTexel * vec2(1.0, -1.0)) +
      texture2D(tSource, vUv + uTexel * vec2(-1.0, -1.0))
    );
  }
`;

const flowChunk = /* glsl */ `
  uniform float uTime;
  uniform float uPointScale;
  uniform vec3 uAxis;
  uniform vec3 uSideA;
  uniform vec3 uSideB;

  // Every call travels the same route: wide before the gate, a tight neck through it,
  // then one of three branches, one per service.
  vec3 flowPosition(float s, float angle, float radial, float branch, float seed) {
    float neck = 1.0 - exp(-s * s / 18.0);
    float radius = radial * (0.2 + 3.4 * neck);
    vec3 position = uAxis * s + uSideA * cos(angle) * radius + uSideB * sin(angle) * radius;
    float spread = smoothstep(0.5, 9.0, s);
    float heading = branch * 2.094 + 0.6;
    position += (uSideA * cos(heading) + uSideB * sin(heading)) * spread * spread * 6.5;
    position += uSideB * sin(s * 0.6 + seed * 6.283 + uTime * 0.3) * 0.12;
    return position;
  }
`;

export const dustVertex = /* glsl */ `
  ${flowChunk}
  attribute float aSeed;
  attribute float aSpeed;
  attribute float aAngle;
  attribute float aRadial;
  attribute float aSize;
  varying float vAlpha;

  void main() {
    float phase = fract(aSeed + uTime * aSpeed);
    float s = mix(-18.0, 16.0, phase);
    vec3 world = flowPosition(s, aAngle, aRadial, floor(aSeed * 31.0) - 3.0 * floor(aSeed * 31.0 / 3.0), aSeed);
    vec4 view = modelViewMatrix * vec4(world, 1.0);
    vAlpha = smoothstep(0.0, 0.08, phase) * (1.0 - smoothstep(0.86, 1.0, phase));
    gl_PointSize = aSize * uPointScale / max(-view.z, 0.8);
    gl_Position = projectionMatrix * view;
  }
`;

export const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float glow = exp(-dot(gl_PointCoord - 0.5, gl_PointCoord - 0.5) * 22.0);
    gl_FragColor = vec4(uColor * glow * vAlpha * 0.5, 1.0);
  }
`;

export const cometVertex = /* glsl */ `
  ${flowChunk}
  attribute float aBirth;
  attribute float aLife;
  attribute float aBranch;
  attribute float aFailed;
  attribute float aAngle;
  attribute float aRadial;
  attribute float aSeed;
  attribute float aTail;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  const vec3 ALARM = vec3(1.0, 0.09, 0.14);

  void main() {
    float phase = (uTime - aBirth) / aLife;
    float s = mix(-15.0, 14.0, phase);
    vec3 world = flowPosition(s, aAngle, aRadial, aBranch, aSeed);
    float past = max(s - 1.0, 0.0);
    world += aFailed * (-uSideB * past * past * 0.09 + uSideA * sin(aSeed * 40.0) * past * 0.28);

    vec4 view = modelViewMatrix * vec4(world, 1.0);
    float alive = step(0.0, phase) * step(phase, 1.0);
    float failed = aFailed * smoothstep(0.0, 1.2, past);
    vColor = mix(aColor, ALARM, failed);
    vAlpha = alive * aTail * (1.0 - smoothstep(0.82, 1.0, phase)) * (1.0 - aFailed * smoothstep(5.0, 9.0, past));
    gl_PointSize = alive * (0.3 + aTail * aTail * 1.3) * uPointScale * 2.4 / max(-view.z, 0.8);
    gl_Position = projectionMatrix * view;
  }
`;

export const cometFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float glow = exp(-dot(gl_PointCoord - 0.5, gl_PointCoord - 0.5) * 16.0);
    gl_FragColor = vec4(vColor * glow * vAlpha * 1.2, 1.0);
  }
`;

export const skyVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

export const skyFragment = /* glsl */ `
  uniform float uScroll;
  uniform float uTime;
  uniform vec3 uRamp[7];
  uniform vec3 uAuroraA;
  uniform vec3 uAuroraB;
  varying vec2 vUv;

  float blob(vec2 uv, vec2 center, float size) {
    vec2 delta = uv - center;
    return exp(-dot(delta, delta) / (size * size));
  }

  vec3 ramp(float t) {
    float position = clamp(t, 0.0, 1.0) * 6.0;
    int index = int(min(floor(position), 5.0));
    return mix(uRamp[index], uRamp[index + 1], smoothstep(0.0, 1.0, position - float(index)));
  }

  void main() {
    float t = (1.0 - vUv.y) * 0.42 + uScroll * 0.58;
    float dither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    vec3 color = ramp(t);

    // Slow light drifts in as the page deepens: it is what the glass panel has to bend
    float night = smoothstep(0.42, 0.72, uScroll);
    vec2 uv = vec2(vUv.x * 1.8, vUv.y);
    vec2 driftA = vec2(0.5 + sin(uTime * 0.17) * 0.42, 0.42 + cos(uTime * 0.13) * 0.26);
    vec2 driftB = vec2(1.3 + cos(uTime * 0.11) * 0.42, 0.6 + sin(uTime * 0.19) * 0.28);
    color += uAuroraA * blob(uv, driftA, 0.34) * night * 0.8;
    color += uAuroraB * blob(uv, driftB, 0.28) * night * 0.7;

    gl_FragColor = vec4(color + (dither - 0.5) / 128.0, 1.0);
  }
`;

export const glassVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// The panel is a signed distance field. Near its edge the glass bends the scene inward and
// splits channels; deep inside it frosts, reading a small blurred copy of the frame.
export const glassFragment = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tSoft;
  uniform sampler2D tFrost;
  uniform vec2 uResolution;
  uniform vec4 uPanel;
  uniform vec4 uLens;
  uniform float uLensOn;
  uniform float uTime;
  uniform float uPanelOn;
  uniform vec3 uTint;
  varying vec2 vUv;

  float roundedBox(vec2 point, vec2 half_size, float radius) {
    vec2 q = abs(point) - half_size + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  float panelField(vec2 point) {
    return roundedBox(point - (uPanel.xy + uPanel.zw * 0.5), uPanel.zw * 0.5, 24.0);
  }

  float lensField(vec2 point) {
    return roundedBox(point - (uLens.xy + uLens.zw * 0.5), uLens.zw * 0.5, 16.0);
  }

  vec2 gradientOf(vec2 point) {
    vec2 e = vec2(1.0, 0.0);
    return normalize(vec2(
      panelField(point + e.xy) - panelField(point - e.xy),
      panelField(point + e.yx) - panelField(point - e.yx)
    ) + 1e-5);
  }

  vec2 toUv(vec2 point) {
    return vec2(point.x / uResolution.x, 1.0 - point.y / uResolution.y);
  }

  vec3 frost(vec2 point, float clarity) {
    vec2 uv = toUv(point);
    return mix(texture2D(tFrost, uv).rgb, texture2D(tSoft, uv).rgb, clarity);
  }

  void main() {
    vec2 point = vec2(vUv.x * uResolution.x, (1.0 - vUv.y) * uResolution.y);
    vec3 color = texture2D(tScene, vUv).rgb;

    if (uPanelOn > 0.5) {
      float field = panelField(point);

      if (field > 0.0) {
        // Soft contact shadow, thrown down by one light from above
        float below = panelField(point - vec2(0.0, 24.0));
        color *= 1.0 - 0.34 * smoothstep(64.0, 0.0, below);
      } else {
        vec2 normal = gradientOf(point);
        float edge = clamp(1.0 + field / 72.0, 0.0, 1.0);
        float bend = pow(edge, 3.2);
        float ripple = sin(point.x * 0.012 + uTime * 0.7) * cos(point.y * 0.01 - uTime * 0.5);
        vec2 offset = -normal * bend * 84.0 + vec2(ripple, -ripple) * 5.0;

        vec3 glass = frost(point + offset, bend);
        if (bend > 0.02) {
          glass.r = texture2D(tSoft, toUv(point + offset * 1.14)).r;
          glass.b = texture2D(tSoft, toUv(point + offset * 0.86)).b;
        }

        float lensGlow = 0.0;
        if (uLensOn > 0.001) {
          float lens = lensField(point);
          float inside = smoothstep(1.5, -1.5, lens);
          float lensEdge = clamp(1.0 + lens / 16.0, 0.0, 1.0);
          vec3 lensed = frost(point + vec2(0.0, -lensEdge * lensEdge * 18.0), 1.0);
          glass = mix(glass, lensed * 1.3 + 0.04, inside * uLensOn);
          lensGlow = pow(lensEdge, 6.0) * inside * uLensOn;
        }

        // Dark enough that paper text clears 4.5:1 over the brightest comet
        float luminance = dot(glass, vec3(0.2126, 0.7152, 0.0722));
        vec3 saturated = mix(vec3(luminance), glass, 1.6) * min(1.0, 0.58 / max(luminance, 0.001));
        color = mix(uTint, min(saturated, vec3(0.8)), 0.5);

        float lit = dot(normal, normalize(vec2(-0.45, -0.9))) * 0.5 + 0.5;
        float rim = pow(clamp(1.0 + field / 3.0, 0.0, 1.0), 2.0);
        float sheen = pow(clamp(1.0 + field / 26.0, 0.0, 1.0), 4.0);
        color += vec3(0.93, 0.93, 1.0) * (rim * (0.2 + 0.72 * lit * lit) + sheen * 0.14 * lit);
        color += vec3(0.8, 0.81, 1.0) * lensGlow * 0.32;
      }
    }

    // Interleaved noise hides banding in the long gradients
    float dither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    gl_FragColor = vec4(color + (dither - 0.5) / 255.0, 1.0);
  }
`;

export const gateVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorldNormal;

  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vView = -view.xyz;
    gl_Position = projectionMatrix * view;
  }
`;

// Glass drawn in one pass: it refracts the frame already rendered, comets included,
// and lights itself from two soft boxes instead of an environment map.
export const gateFragment = /* glsl */ `
  uniform sampler2D tScene;
  uniform vec2 uBuffer;
  uniform float uFlash;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorldNormal;

  float softBox(vec3 direction, vec3 light, float size) {
    return smoothstep(size, size + 0.05, dot(direction, light));
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 view = normalize(vView);
    float facing = clamp(dot(normal, view), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 3.0);

    vec2 screen = gl_FragCoord.xy / uBuffer;
    vec2 bent = normal.xy * (0.04 + 0.11 * (1.0 - facing));
    vec3 refracted = vec3(
      texture2D(tScene, screen - bent * 1.1).r,
      texture2D(tScene, screen - bent).g,
      texture2D(tScene, screen - bent * 0.9).b
    );

    vec3 reflected = reflect(-view, normal);
    vec3 world = normalize(vWorldNormal);
    vec3 sky = mix(vec3(0.1, 0.09, 0.42), vec3(0.8, 0.81, 1.0), smoothstep(-0.2, 0.85, reflected.y));
    float key = softBox(reflected, normalize(vec3(-0.35, 0.8, 0.5)), 0.84);
    float fill = softBox(reflected, normalize(vec3(0.7, -0.35, 0.6)), 0.93);
    float band = smoothstep(0.16, 0.0, abs(reflected.x - 0.5)) * 0.1;

    // The body absorbs a little light through its thickest part, so the ring has mass
    vec3 color = refracted * mix(vec3(0.62, 0.64, 0.92), vec3(1.0), fresnel);
    color = mix(color, sky, fresnel * 0.72);
    color += vec3(1.0) * (key * 0.85 + fill * 0.4 + band * facing);
    color += vec3(0.31, 0.29, 0.97) * uFlash * (0.5 + fresnel * 2.0);
    color += vec3(0.8, 0.81, 1.0) * pow(1.0 - facing, 7.0) * 0.5;

    gl_FragColor = vec4(color, 1.0);
  }
`;
