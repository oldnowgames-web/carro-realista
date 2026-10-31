// postfx.js — passe final leve: vinheta, desfoque radial de velocidade nas bordas e gotas de chuva na lente.
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export function makePost() {
  const pass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uSpeed: { value: 0 }, uRain: { value: 0 }, uAspect: { value: 1 }, uVig: { value: 0.35 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uTime, uSpeed, uRain, uAspect, uVig; varying vec2 vUv;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      vec2 drops(vec2 uv){
        vec2 off = vec2(0.0);
        for (int L = 0; L < 2; L++) {
          float sc = L == 0 ? 7.0 : 13.0;
          vec2 g = vec2(uv.x * uAspect, uv.y) * sc;
          vec2 id = floor(g), f = fract(g) - 0.5;
          float r0 = h21(id + float(L) * 19.7);
          if (r0 > uRain * 0.6) continue;
          float t = fract(uTime * (0.03 + 0.05 * r0) + r0 * 7.0);
          vec2 c = vec2(h21(id + 3.1) - 0.5, h21(id + 8.3) - 0.5) * 0.45;
          c.y -= t * 0.18;
          float rad = (0.14 + 0.12 * r0) * smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.82, 1.0, t));
          vec2 d = f - c; float l = length(d);
          float m = smoothstep(rad, rad * 0.6, l);
          off += -d / sc * 0.9 * m * vec2(1.0 / uAspect, 1.0);
        }
        return off;
      }
      void main(){
        vec2 uv = vUv;
        if (uRain > 0.01) uv += drops(uv);
        vec2 c = vUv - 0.5; float r = length(c * vec2(uAspect, 1.0));
        float amt = uSpeed * smoothstep(0.3, 0.95, r) * 0.05;
        vec3 col = vec3(0.0);
        for (int i = 0; i < 5; i++) col += texture2D(tDiffuse, uv - c * amt * (float(i) / 4.0)).rgb;
        col *= 0.2;
        col *= 1.0 - smoothstep(0.42, 1.05, r) * uVig * (0.75 + 0.25 * uSpeed);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  return { pass, u: pass.uniforms };
}
