// src/components/intro/intro.scene.ts

import * as THREE from "three";
import { CONFIG } from "./intro.config";

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.colors.background);

  // Camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  // Simple wood stick (cylinder) and board (plane)
  const woodMaterial = new THREE.MeshBasicMaterial({ color: CONFIG.colors.wood });
  const stickGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 12);
  const stick = new THREE.Mesh(stickGeometry, woodMaterial);
  stick.rotation.z = Math.PI / 2; // lay horizontally
  stick.position.set(0, 0, 0);
  scene.add(stick);

  const boardGeometry = new THREE.PlaneGeometry(2.5, 2.5);
  const board = new THREE.Mesh(boardGeometry, woodMaterial);
  board.rotation.x = -Math.PI / 2; // flat on XZ
  board.position.y = -0.6;
  scene.add(board);

  // Placeholder groups for particles (will be populated later)
  const particleGroup = new THREE.Group();
  particleGroup.name = "ParticleGroup";
  scene.add(particleGroup);

  return { scene, camera, stick, board, particleGroup };
}
