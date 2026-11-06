// carData.js — catálogo dos carros e "tabela de peças" de cada GLB.
//
// Convenção do jogo: +Z é a frente do carro, +X é a esquerda, +Y é para cima, unidades em metros.
// Cada carro descreve COMO achar as peças no GLB (nomes de nós / materiais) para o carregador montar:
// rodas (giram e esterçam), pintura (troca de cor), vidros, luzes e pneus.
//
// Nomes podem ser texto exato ou RegExp. (O GLTFLoader remove pontos dos nomes de nós: "Rim1.001" vira "Rim1001".)

export const CAR_LIST = [
  {
    id: 'carro1',
    name: 'Carro 1',
    file: 'cars/carro1.glb',
    length: 4.84,
    rotY: 0,
    defaultColor: '#f2b705',
    mods: { widen: 1.035, stripes: { color: '#0e0e10', x: [-0.17, 0.17], hw: 0.07 } },
    wheels: [
      { node: /Wheel_FL$/, front: true,  left: true  },
      { node: /Wheel_FR$/, front: true,  left: false },
      { node: /Wheel_RL$/, front: false, left: true  },
      { node: /Wheel_RR$/, front: false, left: false },
    ],
    paint: { mode: 'mask', ref: '#ffbe00', mats: [/BodySG$/] },
    glass: [/GlassSG$/],
    // Pintura, rodas e frisos usam o mesmo material (textura). As luzes estão só na textura (sem emissão).
  },
  {
    id: 'carro2',
    name: 'Carro 2',
    file: 'cars/carro2.glb',
    length: 4.75,
    rotY: 0,
    preRotY: Math.PI / 2,    // no arquivo o carro "olha" para -X; gira para a frente ficar em +Z
    defaultColor: '#e8590c',
    mods: { widen: 1.05, lip: { color: 'carbon' }, skirts: { color: 'carbon' }, tint: 0.93 },
    wheels: [
      { node: /^Cylinder001$/, auto: true }, { node: /^Cylinder002$/, auto: true },
      { node: /^Cylinder003$/, auto: true }, { node: /^Cylinder004$/, auto: true },
    ],
    // a cor está numa textura de cores chapadas (vermelho vivo): o modo 'mask' troca só os vermelhos, as listras brancas ficam
    paint: { mode: 'mask', ref: '#ff0000', mats: ['Material'] },
  },
  {
    id: 'carro3',
    name: 'Carro 3',
    file: 'cars/carro3.glb',
    length: 5.0,
    rotY: 0,
    preRotY: 1.272,          // o modelo vem girado ~73° na cena (medido pelas posições das 4 rodas)
    defaultColor: '#b9c2c6',
    mods: { widen: 1.02, lip: { color: 'carbon' }, bar: { z: 0.1 } },
    wheels: [
      { node: /^group1247989472$/, auto: true }, { node: /^group801615355$/, auto: true },
      { node: /^group932221911$/, auto: true },  { node: /^group678305251$/, auto: true },
    ],
    paint: { mode: 'solid', mats: ['mat15'] },
    glass: ['mat22'],
    tires: ['mat23'],
    lights: { head: ['mat21'], tail: ['mat8'] },
  },
  {
    id: 'carro4',
    name: 'Carro 4',
    file: 'cars/carro4.glb',
    length: 4.46,
    rotY: 0,
    defaultColor: '#14213d',
    mods: { widen: 1.04, rimColor: '#d4af37', skirts: { color: 'body' }, tint: 0.9 },
    // as rodas são 4 aros (Rim*) + 4 pneus (Rubber*), pareados pela posição
    wheels: { pairNodes: [/^Rim/, /^Rubber/] },
    paint: { mode: 'solid', mats: ['Mat_M3Body'] },
    glass: ['Window glass'],
    tires: ['MatRubber'],
    rims: ['Rim'],
    metals: ['Mat_Dics', 'InsideScrews', 'OuterNuts'],
    discs: ['Mat_Dics'],
    lights: { splitMat: 'Mat_Lights' },   // um material só para faróis e lanternas: separa por frente/trás
  },
  {
    id: 'carro5',
    name: 'Carro 5',
    file: 'cars/carro5.glb',
    length: 4.0,
    rotY: 0,
    defaultColor: '#e8590c',
    mods: { widen: 1.05, rimColor: '#1a1b1e', lip: { color: 'carbon' }, wing: { style: 'gt', color: 'carbon' }, stripes: { color: '#101113', x: [-0.13, 0.13], hw: 0.07 } },
    wheels: [
      { node: /FrontLeftWheel/,  front: true,  left: true  },
      { node: /FrontRightWheel/, front: true,  left: false },
      { node: /BackWheels/,      pair: true },
    ],
    paint: { mode: 'solid', mats: [['Orange', 1], ['DarkOrange', 0.82]] },
    glass: ['Windows'],
    tires: ['Black'],
    rims: ['Grey'],
    lights: { head: ['Headlights'], tail: ['TailLights'] },
  },
  {
    id: 'carro6',
    name: 'Carro 6',
    file: 'cars/carro6.glb',
    length: 4.0,
    rotY: 0,
    defaultColor: '#f3f1ec',
    mods: { widen: 1.04, rimColor: '#c1272d', skirts: { color: 'body' }, wing: { style: 'duck', color: 'body' }, tint: 0.92 },
    wheels: [
      { node: /FrontLeftWheel/,  front: true,  left: true  },
      { node: /FrontRightWheel/, front: true,  left: false },
      { node: /BackWheels/,      pair: true },
    ],
    paint: { mode: 'solid', mats: ['White'] },
    glass: ['Windows'],
    tires: ['Black'],
    rims: ['Grey'],
    lights: { head: ['Headlights'], tail: ['TailLights'] },
  },
  {
    id: 'carro7',
    name: 'Carro 7',
    file: 'cars/carro7.glb',
    length: 4.3,
    rotY: 0,
    defaultColor: '#daa700',
    mods: { widen: 1.04, rimColor: '#e8e8ea', lip: { color: 'carbon' }, wing: { style: 'twin', color: 'carbon' } },
    wheels: [
      { node: /^FrontWheel_L$/, front: true,  left: true  },
      { node: /^FrontWheel_R$/, front: true,  left: false },
      { node: /^BackWheels$/,   pair: true },
    ],
    paint: { mode: 'mask', ref: '#daa700', mats: ['Atlas'] },
    lights: { head: ['Headlights'], tail: ['BrakeLight'] },
  },
  {
    id: 'carro8',
    name: 'Carro 8',
    file: 'cars/carro8.glb',
    length: 4.51,
    rotY: 0,
    defaultColor: '#f3f1ec',
    fixedPaint: true,
    mods: {},
    // malha única com a pintura "assada" na textura; as rodas foram separadas do corpo na conversão (nós Wheel_FL/FR/RL/RR)
    wheels: [
      { node: /^Wheel_FL$/, front: true,  left: true  },
      { node: /^Wheel_FR$/, front: true,  left: false },
      { node: /^Wheel_RL$/, front: false, left: true  },
      { node: /^Wheel_RR$/, front: false, left: false },
    ],
    paint: { mode: 'solid', mats: [] },
  },
  {
    id: 'carro9',
    name: 'Carro 9',
    file: 'cars/carro9.glb',
    length: 4.6,
    rotY: 0,
    defaultColor: '#0952ae',
    fixedPaint: false,
    mods: {},
    // malha única com a pintura "assada" na textura; as rodas foram separadas do corpo na conversão (nós Wheel_FL/FR/RL/RR)
    wheels: [
      { node: /^Wheel_FL$/, front: true,  left: true  },
      { node: /^Wheel_FR$/, front: true,  left: false },
      { node: /^Wheel_RL$/, front: false, left: true  },
      { node: /^Wheel_RR$/, front: false, left: false },
    ],
    paint: { mode: 'maskmr', ref: '#0952ae', mats: ['Body'] },
  },
  {
    id: 'carro10',
    name: 'Carro 10',
    file: 'cars/carro10.glb',
    length: 4.62,
    rotY: 0,
    defaultColor: '#d9570c',
    fixedPaint: false,
    mods: {},
    // malha única com a pintura "assada" na textura; as rodas foram separadas do corpo na conversão (nós Wheel_FL/FR/RL/RR)
    wheels: [
      { node: /^Wheel_FL$/, front: true,  left: true  },
      { node: /^Wheel_FR$/, front: true,  left: false },
      { node: /^Wheel_RL$/, front: false, left: true  },
      { node: /^Wheel_RR$/, front: false, left: false },
    ],
    paint: { mode: 'maskmr', ref: '#be4e0e', mats: ['Body'] },
  },
  {
    id: 'carro11',
    name: 'Carro 11',
    file: 'cars/carro11.glb',
    length: 4.62,
    rotY: 0,
    defaultColor: '#0b5d1a',
    fixedPaint: false,
    mods: {},
    // malha única com a pintura "assada" na textura; as rodas foram separadas do corpo na conversão (nós Wheel_FL/FR/RL/RR)
    wheels: [
      { node: /^Wheel_FL$/, front: true,  left: true  },
      { node: /^Wheel_FR$/, front: true,  left: false },
      { node: /^Wheel_RL$/, front: false, left: true  },
      { node: /^Wheel_RR$/, front: false, left: false },
    ],
    paint: { mode: 'maskmr', ref: '#064d0f', mats: ['Body'] },
  },
  {
    id: 'carro12',
    name: 'Carro 12',
    file: 'cars/carro12.glb',
    length: 4.53,
    rotY: 0,
    defaultColor: '#3a9a1f',
    fixedPaint: false,
    mods: {},
    // malha única com a pintura "assada" na textura; as rodas foram separadas do corpo na conversão (nós Wheel_FL/FR/RL/RR)
    wheels: [
      { node: /^Wheel_FL$/, front: true,  left: true  },
      { node: /^Wheel_FR$/, front: true,  left: false },
      { node: /^Wheel_RL$/, front: false, left: true  },
      { node: /^Wheel_RR$/, front: false, left: false },
    ],
    paint: { mode: 'maskmr', ref: '#2c7d19', mats: ['Body'] },
  },
  {
    id: 'carro13',
    name: 'Carro 13',
    file: 'cars/carro13.glb',
    length: 5.3,
    rotY: 0,
    defaultColor: '#0a0a0b',
    fixedPaint: true,
    mods: {},
    // malha única com a pintura "assada" na textura; as rodas foram separadas do corpo na conversão (nós Wheel_FL/FR/RL/RR)
    wheels: [
      { node: /^Wheel_FL$/, front: true,  left: true  },
      { node: /^Wheel_FR$/, front: true,  left: false },
      { node: /^Wheel_RL$/, front: false, left: true  },
      { node: /^Wheel_RR$/, front: false, left: false },
    ],
    paint: { mode: 'solid', mats: [] },
  },
  {
    id: 'carro14',
    name: 'Carro 14',
    file: 'cars/carro14.glb',
    length: 4.55,
    rotY: 0,
    defaultColor: '#0a0a0b',
    fixedPaint: true,
    mods: {},
    // malha única com a pintura "assada" na textura; as rodas foram separadas do corpo na conversão (nós Wheel_FL/FR/RL/RR)
    wheels: [
      { node: /^Wheel_FL$/, front: true,  left: true  },
      { node: /^Wheel_FR$/, front: true,  left: false },
      { node: /^Wheel_RL$/, front: false, left: true  },
      { node: /^Wheel_RR$/, front: false, left: false },
    ],
    paint: { mode: 'solid', mats: [] },
  },
  {
    id: 'carro15',
    name: 'Carro 15',
    file: 'cars/carro15.glb',
    length: 4.08,
    rotY: 0,
    defaultColor: '#d8d2c8',
    fixedPaint: true,
    mods: {},
    // malha única com a pintura "assada" na textura; as rodas foram separadas do corpo na conversão (nós Wheel_FL/FR/RL/RR)
    wheels: [
      { node: /^Wheel_FL$/, front: true,  left: true  },
      { node: /^Wheel_FR$/, front: true,  left: false },
      { node: /^Wheel_RL$/, front: false, left: true  },
      { node: /^Wheel_RR$/, front: false, left: false },
    ],
    paint: { mode: 'solid', mats: [] },
  },
];

// ids antigos (nomes) → novos (carro1…); usado para não perder o carro/cor/acabamento salvos na garagem
export const LEGACY_IDS = { aventador: 'carro1', muscle: 'carro2', cyber: 'carro3', hatch: 'carro4', sport_orange: 'carro5', sport_white: 'carro6', sport_atlas: 'carro7' };
export function migrateSaved(sv) {
  if (!sv || typeof sv !== 'object') return sv;
  if (LEGACY_IDS[sv.car]) sv.car = LEGACY_IDS[sv.car];
  for (const k of ['colors', 'finishes']) if (sv[k]) for (const o in LEGACY_IDS) if (o in sv[k]) { sv[k][LEGACY_IDS[o]] = sv[k][o]; delete sv[k][o]; }
  return sv;
}
