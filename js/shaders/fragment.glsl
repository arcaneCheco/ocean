uniform sampler2D uImage;
uniform float uTime;
uniform float uHoverState;

varying vec2 vUv;
varying float vNoise;

void main() {
    float x = smoothstep(.0 , 1.0, (uHoverState * 2.0 + vUv.y - 1.0 ));

    vec4 finalColor = mix(
				texture2D(uImage, (vUv - .5) * (1. - x) + .5), 
				texture2D(uImage, (vUv - .5) * x + .5), 
				x);

    gl_FragColor = finalColor;
    gl_FragColor.rgb += 0.05 * vec3(vNoise);
}