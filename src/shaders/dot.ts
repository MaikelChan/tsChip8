import * as THREE from "three";

export const DotShader = {

	uniforms:
	{
		time: { value: <number>0.0 },
		texture: { value: <THREE.Texture | undefined>undefined },
		colorOff: { value: <THREE.Color>new THREE.Color(0.5, 0.5, 0.5) },
		colorOn: { value: <THREE.Color>new THREE.Color(1.0, 1.0, 1.0) },
		dotSize: { value: <number>1.0 }
	},

	vertexShader: `
		uniform float time;
        uniform vec3 colorOff;
        uniform vec3 colorOn;
        uniform float dotSize;

		varying vec3 vColor;

		void main()
		{
			vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

			gl_PointSize = dotSize / length(mvPosition.z);
			gl_Position = projectionMatrix * mvPosition;

			vec3 colorFade = mix(colorOff, colorOn, 0.7);
            vec3 fadeAnim = mix(colorOn, colorFade, mod(gl_Position.y + time, 100.0) / 64.0);
            vColor = mix(colorOff, fadeAnim, color);
		}`,

	fragmentShader: `
		uniform sampler2D texture;

		varying vec3 vColor;

		void main()
		{
			gl_FragColor = vec4(vColor, 1.0);
			gl_FragColor = gl_FragColor * texture2D(texture, gl_PointCoord);
		}`

};