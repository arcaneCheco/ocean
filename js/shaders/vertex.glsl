uniform float uTime;
uniform vec2 uHover;
uniform float uHoverState;

varying vec2 vUv;
varying float vNoise;

#define PI 3.14159265358979323846

#pragma glslify: perlin3d = require('./partials/perlin3d.glsl')

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.);

    // float noise = perlin3d(10. * vec3(position.x, position.y, position.z * uTime * 0.001));
    float noise = perlin3d(vec3(position.x * 4., position.y * 4. + uTime * 0.25, 0.));
    // modelPosition.xyz += 19.2 * noise;
    // modelPosition.z += 0.1 * sin(2. * PI * (modelPosition.x + 0.25 + uTime * 0.1));

    float dist = distance(uv, uHover);
    modelPosition.z += uHoverState * 10. * sin(dist * 10. + uTime);


    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    vUv = uv;
    vNoise = uHoverState * sin(dist * 10.- uTime);
}