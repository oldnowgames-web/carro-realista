// carSpecs.js — dados físicos de cada carro (massa, motor, câmbio, tração, pneus, aerodinâmica).
// Os números são de carros reais de referência, ajustados para ficar divertido no teclado. Edite à vontade.
//   mass kg · power kW (pico) · redline rpm · drive 'RWD'|'AWD'|'FWD' · cg (altura do centro de gravidade, m)
//   front = fração do peso sobre o eixo dianteiro · mu = aderência base dos pneus · cdA/clA = arrasto e downforce (m²)
export const SPECS = {
  carro1:   { rearGrip: 1.16, mass: 1625, power: 565, redline: 8500, idle: 950,  drive: 'AWD', awdFront: 0.3, gears: [3.91, 2.44, 1.81, 1.46, 1.19, 0.97, 0.78], final: 3.2,  cg: 0.45, front: 0.43, mu: 1.55, cdA: 0.76, clA: 0.95, aeroFront: 0.42, brakeG: 1.45 },
  carro2:      { mass: 1560, power: 330, redline: 6400, idle: 800,  drive: 'RWD', gears: [2.78, 1.93, 1.36, 1.0, 0.8, 0.63], final: 3.55, cg: 0.52, front: 0.55, mu: 1.28, cdA: 0.74, clA: 0.10, aeroFront: 0.5,  brakeG: 1.1 },
  carro3:       { mass: 2850, power: 520, redline: 7500, idle: 700,  drive: 'AWD', awdFront: 0.45, gears: [3.9, 2.5, 1.8, 1.4, 1.1, 0.9], final: 3.2, cg: 0.62, front: 0.5, mu: 1.3, cdA: 0.82, clA: 0.08, aeroFront: 0.5, brakeG: 1.1 },
  carro4:       { mass: 1450, power: 235, redline: 7000, idle: 850,  drive: 'AWD', awdFront: 0.4, gears: [3.62, 2.19, 1.52, 1.12, 0.88, 0.72], final: 3.9,  cg: 0.55, front: 0.58, mu: 1.32, cdA: 0.66, clA: 0.10, aeroFront: 0.5,  brakeG: 1.15 },
  carro5:{ mass: 1150, power: 220, redline: 7800, idle: 900,  drive: 'RWD', gears: [3.45, 2.20, 1.55, 1.18, 0.95, 0.78], final: 3.9,  cg: 0.48, front: 0.47, mu: 1.40, cdA: 0.58, clA: 0.20, aeroFront: 0.45, brakeG: 1.25 },
  carro6: { mass: 1300, power: 260, redline: 7600, idle: 900,  drive: 'RWD', gears: [3.50, 2.20, 1.58, 1.20, 0.96, 0.78], final: 3.8,  cg: 0.5,  front: 0.48, mu: 1.40, cdA: 0.62, clA: 0.25, aeroFront: 0.45, brakeG: 1.25 },
  carro7: { mass: 1400, power: 300, redline: 7400, idle: 900,  drive: 'RWD', gears: [3.40, 2.15, 1.55, 1.20, 0.98, 0.80], final: 3.7,  cg: 0.5,  front: 0.48, mu: 1.42, cdA: 0.66, clA: 0.30, aeroFront: 0.45, brakeG: 1.3 },
  carro8:  { mass: 1500, power: 320, redline: 7200, idle: 850, drive: 'RWD', gears: [3.83, 2.36, 1.69, 1.31, 1.0, 0.79], final: 3.13, cg: 0.5, front: 0.53, mu: 1.42, cdA: 0.66, clA: 0.15, aeroFront: 0.45, brakeG: 1.25 },
  carro9:  { mass: 1560, power: 300, redline: 7600, idle: 900, drive: 'AWD', awdFront: 0.35, gears: [3.83, 2.36, 1.69, 1.31, 1.0, 0.79], final: 3.55, cg: 0.5, front: 0.55, mu: 1.42, cdA: 0.68, clA: 0.12, aeroFront: 0.45, brakeG: 1.25 },
  carro10: { mass: 1420, power: 700, redline: 8200, idle: 950, drive: 'AWD', awdFront: 0.25, gears: [3.4, 2.3, 1.7, 1.35, 1.1, 0.92, 0.78], final: 3.0, cg: 0.42, front: 0.44, mu: 1.6, cdA: 0.7, clA: 1.0, aeroFront: 0.42, brakeG: 1.5 },
  carro11: { mass: 1200, power: 190, redline: 5800, idle: 800, drive: 'RWD', gears: [3.1, 1.95, 1.4, 1.0, 0.8], final: 3.7, cg: 0.52, front: 0.55, mu: 1.25, cdA: 0.8, clA: 0.05, aeroFront: 0.5, brakeG: 1.0 },
  carro12: { mass: 1640, power: 478, redline: 7200, idle: 850, drive: 'AWD', awdFront: 0.3, gears: [3.8, 2.4, 1.75, 1.35, 1.1, 0.9, 0.72], final: 3.3, cg: 0.45, front: 0.38, mu: 1.55, cdA: 0.68, clA: 0.35, aeroFront: 0.45, brakeG: 1.4 },
  carro13: { mass: 2100, power: 230, redline: 6000, idle: 750, drive: 'AWD', awdFront: 0.5, gears: [3.9, 2.2, 1.5, 1.0, 0.8, 0.64], final: 3.7, cg: 0.75, front: 0.52, mu: 1.15, cdA: 1.1, clA: 0.0, aeroFront: 0.5, brakeG: 1.0 },
  carro14: { mass: 1350, power: 230, redline: 5800, idle: 800, drive: 'RWD', gears: [2.78, 1.93, 1.36, 1.0, 0.8, 0.63], final: 3.55, cg: 0.5, front: 0.54, mu: 1.28, cdA: 0.72, clA: 0.05, aeroFront: 0.5, brakeG: 1.05 },
  carro15: { mass: 850, power: 90, redline: 5200, idle: 800, drive: 'RWD', gears: [3.8, 2.06, 1.26, 0.89], final: 4.37, cg: 0.5, front: 0.42, mu: 1.2, cdA: 0.62, clA: 0.0, aeroFront: 0.5, brakeG: 0.95 },
};
