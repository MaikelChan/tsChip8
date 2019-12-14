import * as THREE from "three";

export const VertexLitInstanced = {

    uniforms:
    {
        time: { value: <number>0.0 },
        ambientLightColor: { value: <THREE.Color>new THREE.Color(0, 0, 0) },
        light0_position: { value: <THREE.Vector3>new THREE.Vector3(0, 0, 0) },
        light1_position: { value: <THREE.Vector3>new THREE.Vector3(0, 0, 0) },
        light0_color: { value: <THREE.Color>new THREE.Color(0, 0, 0) },
        light1_color: { value: <THREE.Color>new THREE.Color(0, 0, 0) }
    },

    vertexShader: `
        precision highp float;

        attribute vec3 position;
        attribute vec3 normal;
        attribute vec4 color;
        attribute vec2 translate;

        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        //uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat3 normalMatrix;

        uniform float time;
        uniform vec3 ambientLightColor;
        uniform vec3 light0_position;
        uniform vec3 light1_position;
        uniform vec3 light0_color;
        uniform vec3 light1_color;

        varying vec4 vColor;

        #define LIGHT0_INTENSITY 120.0
        #define LIGHT1_INTENSITY 300.0

        void main() {
            float size = mix(0.75, 1.0, sin((time * -4.0) + (translate.x * 0.05)) * 0.5 + 0.5);

            vec3 worldPosition = vec3(modelMatrix * vec4(position * size, 1.0)) + vec3(translate, 0);
            vec3 worldNormal = normalize(normalMatrix * normal);

            vec3 direction0 = normalize(light0_position - worldPosition);
            vec3 direction1 = normalize(light1_position - worldPosition);

            float distance0 = length(light0_position - worldPosition);
            float distance1 = length(light1_position - worldPosition);

            float attenuation0 = 1.0 / distance0;
            float attenuation1 = 1.0 / distance1;

            vec3 color0 = light0_color;
            vec3 color1 = light1_color;

            vec3 light0 = max(0.0, dot(worldNormal, direction0)) * color0 * attenuation0 * LIGHT0_INTENSITY;
            vec3 light1 = max(0.0, dot(worldNormal, direction1)) * color1 * attenuation1 * LIGHT1_INTENSITY;

            vColor = vec4(ambientLightColor + light0 + light1, 1);

            gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1);
        }`,

    fragmentShader: `
        precision highp float;

        varying vec4 vColor;

        void main() {
            gl_FragColor = vColor;
        }`

};