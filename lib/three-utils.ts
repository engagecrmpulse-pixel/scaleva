import * as THREE from "three";

export function disposeThreeScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
) {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat.dispose();
      }
    }
  });
  scene.clear();
  renderer.dispose();
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
