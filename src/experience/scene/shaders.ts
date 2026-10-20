export const beamVertexShader = /* glsl */ `
  varying float vAlong;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  void main() {
    vAlong = 0.5 - position.y;
    vLocal = position;
    vec4 world = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-world.xyz);
    gl_Position = projectionMatrix * world;
  }
`;

export const beamFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uStrength;
  varying float vAlong;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  void main() {
    float facing = pow(abs(dot(vNormal, vView)), 1.6);
    float fadeIn = smoothstep(0.0, 0.25, vAlong);
    float fadeOut = 1.0 - smoothstep(0.75, 1.0, vAlong);
    float swirl = 0.65 + 0.35 * noise(vec2(atan(vLocal.x, vLocal.z) * 3.0, vAlong * 6.0 - uTime * 0.15));
    gl_FragColor = vec4(uColor * uStrength * facing * fadeIn * fadeOut * swirl, 1.0);
  }
`;

export const dustVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * 0.12 + aSeed * 40.0;
    p.x += sin(t * 1.3) * 0.08;
    p.z += cos(t * 0.9) * 0.08;
    p.y += mod(t * 0.05, 0.3) - 0.15;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, uSize * (0.4 + aSeed) / -mv.z);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 30.0);
    vAlpha = twinkle * smoothstep(0.0, 0.2, 0.5 - position.y);
  }
`;

export const dustFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, d) * vAlpha * 0.4;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.4) * a, 1.0);
  }
`;

export const floatingDustVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uLampPosition;
  uniform vec3 uLampDirection;
  uniform float uCosOuter;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * 0.04 + aSeed * 50.0;
    p.x += sin(t * 1.7) * 0.5;
    p.y += cos(t * 1.1) * 0.3 + sin(uTime * 0.025 + aSeed * 9.0) * 0.6;
    p.z += sin(t * 0.8) * 0.4;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = clamp((2.0 + aSeed * 3.0) * 6.0 / depth, 1.0, 2.5);
    float alignment = dot(normalize(world.xyz - uLampPosition), uLampDirection);
    float lit = smoothstep(uCosOuter, mix(uCosOuter, 1.0, 0.45), alignment);
    float near = smoothstep(2.5, 4.0, depth);
    float far = 1.0 - smoothstep(12.0, 26.0, depth);
    vAlpha = lit * near * far * (0.35 + 0.65 * aSeed);
  }
`;

export const floatingDustFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, d) * vAlpha * 0.55;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.6) * a, 1.0);
  }
`;
