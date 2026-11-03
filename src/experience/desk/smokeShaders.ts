export const smokeVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uLife;
  uniform float uRise;
  uniform vec3 uOrigin;
  uniform vec3 uWind;
  attribute float aSeed;
  varying vec2 vUv;
  varying float vAge;
  varying float vSeed;

  void main() {
    float age = fract(uTime / uLife + aSeed);
    vec3 p = uOrigin;
    p.y += uRise * (1.0 - pow(1.0 - age, 1.7));
    float curl = age * age;
    float rise = p.y - uOrigin.y;
    float ribbon = smoothstep(0.0, 0.25, age) * (1.0 - smoothstep(0.35, 0.7, age));
    p.x += sin(rise * 7.0 - uTime * 1.6) * 0.035 * ribbon;
    p.z += cos(rise * 5.0 - uTime * 1.1) * 0.025 * ribbon;
    p.x += sin(age * 9.0 + aSeed * 40.0 + uTime * 0.7) * 0.22 * curl + sin(age * 3.0 + uTime * 0.31) * 0.1 * age;
    p.z += cos(age * 7.0 + aSeed * 23.0 + uTime * 0.53) * 0.22 * curl;
    p += uWind * curl * 2.2;
    float size = mix(0.015, 0.85, pow(age, 1.45));
    float spin = aSeed * 6.2831 + age * 1.4;
    vec2 corner = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * position.xy;
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 world = p + (right * corner.x + up * corner.y) * size;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
    vUv = uv;
    vAge = age;
    vSeed = aSeed;
  }
`;

export const smokeFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uDensity;
  varying vec2 vUv;
  varying float vAge;
  varying float vSeed;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.55;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float radius = length(centered) * 2.0;
    float wisps = fbm(vUv * 2.6 + vec2(vSeed * 13.0, -vAge * 1.6 - uTime * 0.04));
    float mask = smoothstep(1.0, 0.15, radius) * smoothstep(0.3, 0.8, wisps + 0.3 * (1.0 - radius));
    float life = smoothstep(0.0, 0.08, vAge) * (1.0 - smoothstep(0.4, 1.0, vAge));
    float alpha = mask * life * uDensity * mix(0.6, 0.45, vAge);
    gl_FragColor = vec4(uColor, alpha);
  }
`;
