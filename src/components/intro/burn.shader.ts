// src/components/intro/burn.shader.ts

export const burnFragmentShader = `
  varying vec2 vUv;
  uniform float uBurnProgress; // 0..1
  uniform vec3 uEdgeColor;
  uniform sampler2D uSceneTex; // rendered scene texture

  // 2D noise (simple hash based)
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

  void main() {
    // Sample the already rendered scene (fire etc.)
    vec4 sceneColor = texture2D(uSceneTex, vUv);
    // Generate an irregular mask using noise + progress
    float n = noise(vUv * 8.0 + uBurnProgress * 12.0);
    // Mask: when progress > noise, we show the scene, otherwise black
    float mask = smoothstep(uBurnProgress - 0.1, uBurnProgress + 0.1, n);
    // Edge glow based on derivative of mask
    float edge = smoothstep(0.48, 0.52, n) * (1.0 - mask);
    vec3 color = mix(vec3(0.0), sceneColor.rgb, mask);
    color += uEdgeColor * edge * 0.8;
    gl_FragColor = vec4(color, 1.0);
  }
`;
