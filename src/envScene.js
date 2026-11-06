// envScene.js — cena só para gerar o mapa de reflexos (usada pelo showroom e pela tela inicial)
import * as THREE from 'three';

// Cena só para gerar o mapa de reflexos: sala escura com faixas de luz (é o que dá o brilho "de revista" na lataria)
export function buildEnvScene() {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(40, 16, 40), new THREE.MeshBasicMaterial({ color: 0x07090b, side: THREE.BackSide }));
  room.position.y = 7; s.add(room);
  const panel = (w, h, pos, rot, rgb, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(rgb[0] * k, rgb[1] * k, rgb[2] * k), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(...pos); m.rotation.set(...rot); s.add(m);
  };
  const P = Math.PI;
  panel(26, 2.2, [0, 13.5, -4], [P / 2, 0, 0], [1, 1, 0.97], 9);      // faixa de teto 1
  panel(26, 2.2, [0, 13.5, 5], [P / 2, 0, 0], [1, 1, 0.97], 9);       // faixa de teto 2
  panel(3, 9, [-14, 6, 2], [0, P / 2, 0], [1, 0.86, 0.7], 8);         // softbox quente à esquerda
  panel(3, 9, [14, 6, -2], [0, P / 2, 0], [0.75, 0.88, 1], 8);        // softbox frio à direita
  panel(18, 2, [0, 5, -18], [0, 0, 0], [1, 1, 1], 5);                 // faixa de fundo
  panel(10, 1.4, [0, 4, 18], [0, P, 0], [1, 1, 1], 4);                // faixa de frente
  return s;
}

