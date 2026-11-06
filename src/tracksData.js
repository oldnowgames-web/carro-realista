// tracksData.js — pistas extras (pontos de controle x,z em metros) com o tema de mundo de cada uma (ver themes.js).
// Frente do carro = +Z. O ponto [0] é a largada; a ordem dos pontos define o sentido da volta.

// arredonda os cantos de um polígono (ruas de cidade): em cada vértice entram dois pontos antes/depois do canto
function streets(poly, off = 64, mid = 85) {
  const out = [], n = poly.length, norm = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return [dx / l, dz / l, l]; };
  for (let i = 0; i < n; i++) {
    const P = poly[(i + n - 1) % n], V = poly[i], N = poly[(i + 1) % n];
    const a = norm(V, P), b = norm(V, N), o1 = Math.min(off, a[2] * 0.45), o2 = Math.min(off, b[2] * 0.45);
    out.push([V[0] + a[0] * o1, V[1] + a[1] * o1]);
    out.push([V[0] + (a[0] + b[0]) * 0.17 * off, V[1] + (a[1] + b[1]) * 0.17 * off]);   // ponto do meio do arco, puxado para o canto
    out.push([V[0] + b[0] * o2, V[1] + b[1] * o2]);
    // pontos intermediários em retas longas (mantém a reta reta)
    const L = b[2] - o2 - Math.min(off, norm(N, V)[2] * 0.45);
    for (let k = 1; k * mid < L; k++) out.push([V[0] + b[0] * (o2 + k * mid), V[1] + b[1] * (o2 + k * mid)]);
  }
  return out.map((p) => [Math.round(p[0]), Math.round(p[1])]);
}

const CITY = [[40, -250], [380, -250], [380, -80], [210, -80], [210, 90], [380, 90], [380, 260], [-130, 260], [-130, 90], [40, 90], [40, -80], [-130, -80], [-130, -250]];

export const EXTRA_TRACKS = [
  { id: 't4', name: 'Costa Dourada', theme: 'costa', elev: 0.3,
    control: [[-110, -300], [-105, -150], [-120, 0], [-100, 150], [-40, 260], [60, 330], [170, 340], [270, 340], [370, 290], [400, 190], [340, 100], [240, 70], [210, -10], [280, -85], [370, -150], [360, -260], [260, -340], [120, -360]] },
  { id: 't5', name: 'Deserto Vermelho', theme: 'deserto', elev: 0.9,
    control: [[0, -250], [170, -260], [340, -230], [470, -150], [510, -20], [430, 80], [300, 110], [210, 190], [260, 300], [390, 370], [400, 490], [290, 560], [140, 520], [60, 430], [-60, 400], [-160, 310], [-150, 190], [-260, 120], [-370, 20], [-340, -120], [-220, -200], [-100, -250]] },
  { id: 't6', name: 'Alpes Nevados', theme: 'neve', elev: 1.35,
    control: [[0, -200], [120, -250], [260, -230], [340, -140], [300, -40], [190, -10], [110, 60], [170, 150], [290, 170], [380, 250], [340, 350], [220, 380], [110, 330], [20, 380], [-70, 300], [-60, 190], [-170, 140], [-290, 170], [-380, 100], [-340, -10], [-250, -90], [-150, -170]] },
  { id: 't7', name: 'Circuito Urbano', theme: 'urbano', elev: 0.08, control: streets(CITY) },
  { id: 't8', name: 'Floresta Tropical', theme: 'tropical', elev: 0.8,
    control: [[0, -230], [130, -260], [250, -210], [300, -110], [240, -20], [130, 0], [60, 80], [110, 180], [230, 230], [300, 330], [230, 420], [100, 430], [10, 360], [-90, 420], [-210, 380], [-260, 270], [-190, 180], [-250, 80], [-330, -20], [-290, -130], [-180, -200]] },
  { id: 't9', name: 'Estrada do Interior', theme: 'interior', elev: 0.7,
    control: [[0, -300], [200, -310], [390, -260], [500, -130], [470, 40], [350, 120], [330, 240], [420, 350], [390, 470], [250, 520], [110, 470], [40, 360], [-90, 330], [-210, 380], [-340, 320], [-380, 190], [-300, 90], [-380, -20], [-340, -150], [-210, -230], [-100, -290]] },
];
