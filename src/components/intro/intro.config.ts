// src/components/intro/intro.config.ts

export const CONFIG = {
  // timing (seconds)
  durations: {
    darkness: 1,
    friction: 2,
    spark: 1,
    fire: 2,
    digitalFire: 1.5,
    burn: 2,
  },
  // colors (hex strings)
  colors: {
    background: "#000000",
    wood: "#3b3b3b",
    ember: "#ff7518",
    fire: "#ff4500",
    digital: "#e0e0e0",
  },
  // quality limits
  maxDPR: 2,
  particleCounts: {
    woodChips: 200,
    sparks: 100,
    fire: 300,
    digital: 150,
  },
};
