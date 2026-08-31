// src/components/intro/fire.shader.ts

// Vertex shader – pass through positions & UV
export const fireVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader – procedural fire using noise, FBM, distortion and glow
export const fireFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uProgress; // 0..1 controlling size
  uniform vec3 uColor;
  uniform vec3 uGlowColor;

  // Simple 2D noise (value noise) – adapted from iq
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

  // FBM – 4 octaves
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
    // Normalized UV centred
    vec2 uv = vUv - 0.5;
    uv.y *= 1.5; // stretch vertically

    // Apply vertical distortion based on time
    float t = uTime * 0.8;
    uv.x += sin(uv.y * 10.0 + t) * 0.02;
    uv.y += sin(uv.x * 15.0 + t) * 0.02;

    // Fire shape using FBM threshold
    float shape = fbm(uv * 3.0 + t);
    float flame = smoothstep(0.3, 0.7, shape);

    // Size progression via uProgress (0→1) – expand vertically
    float heightMask = smoothstep(-0.5, 0.5, uv.y + uProgress * 0.8);
    flame *= heightMask;

    // Color gradient from ember (bottom) to bright fire (top)
    vec3 color = mix(uColor * 0.6, uGlowColor, flame);
    // Add soft glow based on derivative (approximation)
    float glow = smoothstep(0.4, 0.6, shape) * 0.3;
    color += uGlowColor * glow;

    gl_FragColor = vec4(color, flame);
  }
`;
