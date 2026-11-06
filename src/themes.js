// themes.js — o "mundo" de cada mapa: relevo, cores do chão, vegetação, objetos, céu e clima.
// Cada pista (trackBuilder.js → TRACKS) aponta para um tema pelo campo `theme`. Para criar um mapa novo:
//   1) crie a pista em tracksData.js com theme: 'meu-tema'   2) crie aqui THEMES['meu-tema']   3) (opcional) gere o quadro: preview.html?pista=ID&cap=1
// Tudo é opcional: o que não for informado usa o padrão do Vale Verde.
//
//  sky      : horário/céu (PRESETS de skyWeather.js: manha, meio, por, nublado, noite, deserto, neve)
//  cycle    : true = respeita a opção "ciclo de horário" das configurações (só o Vale Verde)
//  weather  : { rain: true } chuva · { snow: 0..1 } neve caindo
//  relief   : hill/hillSmall/mount (multiplicadores), mountStart/mountEnd (distância das montanhas), terrace (mesas), dune (dunas), coast {x0,x1,depth} (mar)
//  ground   : grass/dirt/gravel/rock (cor multiplicada), sand/sandCol, snow, pave/paveCol (cidade), dirtBias
//  veg      : forest (densidade de mata), scatter (árvores soltas), pine (0..1), size, tint, grass, grassTint, rocks, pebbles, rockTint
//  road     : tint (cor do asfalto) · wet (0..1 = pista sempre molhada)
//  water    : { y, color } mar
//  expose   : multiplicador de brilho do mapa (1 = padrão)
//  grad / descEn / tagsEn : quadro do mapa no menu (cor de reserva e textos em inglês)
//  shot     : câmera da foto do mapa { u: posição na pista 0..1, side, h, look }
//  props    : objetos de cenário (ver props.js): palm, cactus, shrub, building, lamp, house, fence, hay, barn, pole
export const THEMES = {
  verde: {
    sky: 'manha', cycle: true,
    grad: ['#7fb37a','#c9dcea'], descEn: 'Countryside, rolling hills and forest in the morning.', tagsEn: ['Morning','Forest'],
    desc: 'Campo, colinas e floresta de manhã.', tags: ['Manhã', 'Floresta'],
  },
  planalto: {
    sky: 'meio',
    grad: ['#d9c27a','#a9c7e6'], descEn: 'Open golden plateau with a wide, fast track.', tagsEn: ['Midday','Open field'],
    relief: { hill: 0.75, mount: 0.5 },
    ground: { grass: [2.4, 1.75, 0.5], dirt: [1.2, 0.98, 0.75], dirtBias: 0.05 },
    veg: { forest: 0.3, scatter: 0.8, pine: 0.05, tint: [1.25, 1.08, 0.7], grass: 0.9, grassTint: [2.2, 1.7, 0.5], rocks: 0.5 },
    props: { hay: 0.7 },
    desc: 'Planalto aberto de capim dourado, pista larga e rápida.', tags: ['Meio-dia', 'Campo aberto'],
  },
  serra: {
    sky: 'por',
    grad: ['#e0875a','#5b4f6d'], descEn: 'Mountain pines, rocks and sunset corners.', tagsEn: ['Sunset','Mountain'],
    relief: { hill: 1.15, mount: 1.55, mountStart: 170 }, expose: 1.3,
    ground: { rock: [1.0, 0.95, 0.9], dirtBias: 0.1 },
    veg: { forest: 0.85, pine: 0.95, rocks: 1.8, tint: [0.92, 0.95, 0.9] },
    desc: 'Montanha com pinheiros, pedras e curvas ao pôr do sol.', tags: ['Pôr do sol', 'Montanha'],
  },
  costa: {
    sky: 'por',
    grad: ['#f2a65a','#2f8fa6'], descEn: 'Seaside road with palm trees, sand and ocean at sunset.', tagsEn: ['Sunset','Beach'],
    relief: { hill: 0.45, hillSmall: 0.6, mount: 0.35, coast: { x0: -150, x1: -290, depth: 24 } },
    ground: { grass: [1.15, 1.08, 0.72], sand: 0.9, sandCol: [1.0, 0.8, 0.48], dirt: [1.1, 1, 0.8], rock: [1.1, 1.0, 0.92] },
    veg: { forest: 0.0, scatter: 0.5, pine: 0, grass: 0.3, grassTint: [1.8, 1.55, 0.95], rocks: 0.5, pebbles: 0.4, tint: [1.1, 1.05, 0.9] },
    water: { y: -6.5, color: 0x0d6f8c }, expose: 1.45, shot: { u: 0.1, side: -3, h: 3.2, look: 120, aimSide: -70 },
    props: { palm: 1, house: 0.5 },
    desc: 'Estrada à beira-mar, palmeiras, areia e mar ao pôr do sol.', tags: ['Pôr do sol', 'Praia'],
  },
  deserto: {
    sky: 'deserto',
    grad: ['#d9814a','#f2d29a'], descEn: 'Dunes, red mesas and cacti under a strong sun.', tagsEn: ['Midday','Hot'],
    relief: { hill: 0.55, hillSmall: 0.6, dune: 8, mount: 0.7, mountStart: 190, terrace: 22 },
    ground: { grass: [1.5, 1.05, 0.55], sand: 0.95, sandCol: [0.84, 0.52, 0.3], dirt: [1.3, 0.85, 0.6], gravel: [1.25, 0.9, 0.7], rock: [1.35, 0.78, 0.55], dirtBias: 0.1 },
    veg: { forest: 0, scatter: 0, grass: 0, rocks: 1.5, pebbles: 0.7, rockTint: [1.35, 0.78, 0.56] },
    road: { tint: [0.95, 0.9, 0.88] },
    props: { cactus: 1, shrub: 1 },
    desc: 'Dunas, mesas vermelhas e cactos sob sol forte.', tags: ['Meio-dia', 'Calor'],
  },
  neve: {
    sky: 'neve',
    grad: ['#e9f0fa','#9fb4cf'], descEn: 'Snowy mountain, frozen pines and falling snow.', tagsEn: ['Snow','Cold'],
    weather: { snow: 0.85 },
    relief: { hill: 1.1, mount: 1.5, mountStart: 190 },
    ground: { grass: [1.1, 1.15, 1.2], snow: 0.95, rock: [0.95, 0.97, 1.02] },
    veg: { forest: 0.8, pine: 0.97, grass: 0, rocks: 1.2, tint: [2.7, 2.8, 3.1], rockTint: [1.25, 1.3, 1.45] },
    road: { tint: [0.9, 0.92, 0.98], wet: 0.35 },
    props: { house: 0.4 },
    desc: 'Montanha nevada, pinheiros congelados e neve caindo.', tags: ['Neve', 'Frio'],
  },
  urbano: {
    sky: 'noite',
    grad: ['#1c2440','#0a0d18'], descEn: 'Night race through the streets of a lit-up city.', tagsEn: ['Night','City'],
    relief: { hill: 0.05, hillSmall: 0.05, mount: 0.18, mountStart: 520, mountEnd: 900 },
    ground: { pave: 1, paveCol: [0.26, 0.27, 0.3], gravel: [0.8, 0.8, 0.82] },
    veg: { forest: 0, scatter: 0, grass: 0, rocks: 0, pebbles: 0 },
    road: { tint: [0.85, 0.87, 0.95], wet: 0.5 },
    props: { building: 1, lamp: 1 },
    desc: 'Corrida noturna pelas ruas de uma cidade iluminada.', tags: ['Noite', 'Cidade'],
  },
  tropical: {
    sky: 'nublado',
    grad: ['#4f8a58','#7d9a94'], descEn: 'Dense jungle and red soil under tropical rain.', tagsEn: ['Rain','Jungle'],
    weather: { rain: true },
    relief: { hill: 1.0, mount: 0.9, mountStart: 210 },
    ground: { grass: [0.72, 1.12, 0.62], dirt: [1.25, 0.72, 0.5], gravel: [1.15, 0.85, 0.7], dirtBias: 0.28 },
    veg: { forest: 1.8, scatter: 2.5, pine: 0, size: 1.15, tint: [0.72, 1.05, 0.62], grass: 1.6, grassTint: [0.8, 1.15, 0.7], rocks: 0.6 },
    road: { tint: [0.9, 0.92, 0.92] },
    props: { palm: 0.8 },
    desc: 'Mata fechada e terra vermelha debaixo de chuva tropical.', tags: ['Chuva', 'Floresta'],
  },
  interior: {
    sky: 'meio',
    grad: ['#d8c27a','#9fc4e6'], descEn: 'Farm road: fences, poles, hay bales and barns.', tagsEn: ['Midday','Farm'],
    relief: { hill: 0.9, mount: 0.45 },
    ground: { grass: [1.1, 1.05, 0.7], dirt: [1.2, 0.8, 0.6], dirtBias: 0.12 },
    veg: { forest: 0.28, scatter: 1.5, pine: 0, tint: [1.05, 1.0, 0.85], grass: 0.8, rocks: 0.4 },
    props: { fence: 1, pole: 1, hay: 1, barn: 1 },
    desc: 'Estrada de fazenda: cercas, postes, fardos de feno e celeiros.', tags: ['Meio-dia', 'Fazenda'],
  },
};
export const themeOf = (key) => THEMES[key] || THEMES.verde;
