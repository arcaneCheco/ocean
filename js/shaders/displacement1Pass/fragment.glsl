uniform sampler2D tDiffuse;
uniform float uScrollSpeed;
uniform float uTime;
varying vec2 vUv;

#pragma glslify: perlin3d = require('../partials/perlin3d.glsl')

void main() {
  vec2 nUv = vUv;
  float area = smoothstep(1., .8, vUv.y) * 2. - 1.;
//   area = pow(area, 4.);

  float noise = (perlin3d(vec3(vUv * 10., uTime * 0.2)) + 1.) * 0.5;

  float n = smoothstep(0.5, 0.51, noise + area);

  nUv.x -= (vUv.x - 0.5) * 0.1 * area * uScrollSpeed;
//   gl_FragColor = texture2D(tDiffuse, nUv);
  gl_FragColor = mix(vec4(1.), texture2D(tDiffuse, nUv), n);
//   gl_FragColor = vec4(n, 0., 0., 1.);
}