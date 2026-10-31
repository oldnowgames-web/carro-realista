// worldBuilder.js — monta o cenário completo (pista, terreno, vegetação, céu) e devolve tudo o que o jogo precisa.
import * as THREE from 'three';
import { Track, trackControl } from './trackBuilder.js';
import { Terrain } from './terrain.js';
import { Vegetation } from './vegetation.js';
import { SkyWeather } from './skyWeather.js';
import * as TX from './textures.js';
import { lerp } from './noise.js';
import { buildTrackside } from './trackside.js';
import { buildVenue, venueZones } from './venue.js';

export async function buildWorld({ scene, renderer, camera, say = async () => {}, density = 1, trackId = 't1', reverse = false }) {
  await say('Traçando a pista…');
  const track = new Track(trackControl(trackId, reverse));
  track.zones = venueZones(track);
  await say('Gerando o terreno…');
  const terrain = new Terrain(track);
  const sw = new SkyWeather(scene, renderer, camera);
  await say('Carregando árvores e pedras…');
  const veg = new Vegetation(scene, terrain, track);
  await veg.load('assets/nature/', renderer);
  await say('Plantando a floresta…');
  veg.build({ density });
  const tex = { grass: TX.grassTexture(), dirt: TX.dirtTexture(), gravel: TX.gravelTexture(), noise: TX.noiseTexture(), rock: veg.mat.rock.map };
  scene.add(terrain.mesh(tex));
  const asphalt = TX.asphaltTexture();
  const roadMat = new THREE.MeshStandardMaterial({ map: asphalt, bumpMap: asphalt, bumpScale: 0.6, roughness: 0.9, metalness: 0, envMapIntensity: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  scene.add(track.roadMesh(roadMat));
  scene.add(track.kerbMesh(new THREE.MeshStandardMaterial({ map: TX.kerbTexture(), roughness: 0.6, envMapIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })));
  scene.add(track.startLine(new THREE.MeshStandardMaterial({ map: TX.checkerTexture(), roughness: 0.7 })));
  const side = buildTrackside(scene, track, terrain);
  buildVenue(scene, track, terrain, side.colliders);
  let lastWet = -1;
  const applyWet = (w) => {
    if (Math.abs(w - lastWet) < 0.01) return; lastWet = w;
    roadMat.roughness = lerp(0.88, 0.16, w); roadMat.color.setScalar(lerp(1, 0.55, w)); roadMat.envMapIntensity = lerp(0.45, 1.7, w);
    terrain.uniforms.uWet.value = w; veg.setWet(w);
  };
  return { track, terrain, veg, sw, roadMat, applyWet, side };
}
