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
    gl_PointSize = uSize * (0.4 + aSeed) / -mv.z;
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 30.0);
    vAlpha = twinkle * smoothstep(0.0, 0.2, 0.5 - position.y);
  }
`;

export const dustFragmentShader = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha * 0.55;
    gl_FragColor = vec4(vec3(1.0, 0.82, 0.6) * a, 1.0);
  }
`;
