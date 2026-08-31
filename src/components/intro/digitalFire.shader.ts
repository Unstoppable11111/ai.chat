// src/components/intro/digitalFire.shader.ts

export const digitalFireFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uBaseColor;
  uniform vec3 uDigitalColor;

  // Reuse same noise/FBM utilities as fire shader
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    uv.y *= 1.5;
    float t = uTime * 0.6;
    uv.x += sin(uv.y * 12.0 + t) * 0.015;
    uv.y += sin(uv.x * 14.0 + t) * 0.015;
    float shape = fbm(uv * 3.5 + t);
    float flame = smoothstep(0.35, 0.7, shape);
    float heightMask = smoothstep(-0.5, 0.5, uv.y + uProgress * 0.9);
    flame *= heightMask;
    // Mix natural fire colour to digital colour based on progress
    vec3 color = mix(uBaseColor, uDigitalColor, uProgress);
    gl_FragColor = vec4(color * flame, flame);
  }
`;
