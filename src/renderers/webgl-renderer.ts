import * as THREE from "three";
import { DotShader } from "../shaders/dot";
import { RES_X, RES_Y } from "../chip8/chip8";
import { IRenderer } from "../chip8/interfaces";

const HALF_X: number = RES_X >> 1;
const HALF_Y: number = RES_Y >> 1;

export class WebGLRenderer implements IRenderer {
	private renderContainer: HTMLDivElement;
	private canvas: HTMLCanvasElement;

	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private cameraTarget: THREE.Vector3;
	private renderer: THREE.WebGLRenderer;

	private dotsTexture: THREE.Texture;
	private screenMaterial: THREE.ShaderMaterial;
	private screenGeometry: THREE.BufferGeometry;
	private screenVertexColors: Float32Array;
	private screenColorBuffer: THREE.Float32BufferAttribute;

	private floorMaterial: THREE.MeshPhongMaterial;
	private floorGeometry: THREE.PlaneBufferGeometry;

	private bgMaterial: THREE.MeshBasicMaterial;
	private bgGeometry: THREE.BoxGeometry;

	private lights: THREE.PointLight[];

	private offColor: THREE.Color;
	private onColor: THREE.Color;

	private initialTime: number;
	private shouldUpdate: boolean;

	private VRAM: Uint8Array;

	constructor(renderContainer: HTMLDivElement, offColor: string, onColor: string) {
		this.renderContainer = renderContainer;

		// Create the canvas
		this.canvas = document.createElement("canvas");
		this.canvas.id = "render-canvas";
		this.canvas.style.position = "fixed"; // Necessary to avoid some resizing problems
		this.renderContainer.appendChild(this.canvas);

		let width: number = this.renderContainer.clientWidth;
		let height: number = this.renderContainer.clientHeight;

		// Create the scene
		this.scene = new THREE.Scene();

		// Camera
		this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
		this.cameraTarget = new THREE.Vector3(HALF_X, -HALF_Y, 0);
		this.camera.position.set(this.cameraTarget.x, this.cameraTarget.y, 80);

		// Renderer
		this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
		this.renderer.setSize(width, height, false);

		// Set initial main screen colors
		this.offColor = new THREE.Color(offColor);
		this.onColor = new THREE.Color(onColor);

		// SCREEN -------------------------------------------------------------------------------------------------------------

		// Shader material for the screen points

		this.dotsTexture = new THREE.TextureLoader().load("img/dot.png");
		DotShader.uniforms.texture.value = this.dotsTexture;
		DotShader.uniforms.colorOff.value = this.offColor;
		DotShader.uniforms.colorOn.value = this.onColor;
		DotShader.uniforms.dotSize.value = height * 3;

		this.screenMaterial = new THREE.ShaderMaterial(
			{
				uniforms: DotShader.uniforms,
				vertexShader: DotShader.vertexShader,
				fragmentShader: DotShader.fragmentShader,
				transparent: true,
				depthTest: false,
				blending: THREE.AdditiveBlending,
				vertexColors: THREE.VertexColors
			});

		// Geometry for the screen points

		this.screenGeometry = new THREE.BufferGeometry();

		const bufferLength: number = RES_X * RES_Y * 3;
		let screenVertexPositions: Float32Array = new Float32Array(bufferLength);
		this.screenVertexColors = new Float32Array(bufferLength);

		let i: number = 0;
		for (let y = 0; y < RES_Y; y++) {
			for (let x = 0; x < RES_X; x++) {
				screenVertexPositions[i + 0] = x;
				screenVertexPositions[i + 1] = -y;
				screenVertexPositions[i + 2] = 0;
				this.screenVertexColors[i + 0] = 0;
				this.screenVertexColors[i + 1] = 0;
				this.screenVertexColors[i + 2] = 0;
				i += 3;
			}
		}

		let screenPositionBuffer: THREE.Float32BufferAttribute = new THREE.Float32BufferAttribute(screenVertexPositions, 3);
		screenPositionBuffer.setDynamic(false);
		this.screenColorBuffer = new THREE.Float32BufferAttribute(this.screenVertexColors, 3);
		this.screenColorBuffer.setDynamic(true);

		this.screenGeometry.addAttribute("position", screenPositionBuffer);
		this.screenGeometry.addAttribute("color", this.screenColorBuffer);

		// Create the screen points

		let screenPoints = new THREE.Points(this.screenGeometry, this.screenMaterial);
		screenPoints.frustumCulled = false;

		// Add the points to the scene

		this.scene.add(screenPoints);

		// FLOOR --------------------------------------------------------------------------------------------------------------

		this.floorMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x222222 });
		this.floorGeometry = new THREE.PlaneBufferGeometry(1000, 1000);

		let floorMesh = new THREE.Mesh(this.floorGeometry, this.floorMaterial);
		floorMesh.rotation.x = -Math.PI / 2;
		floorMesh.position.set(HALF_X, -RES_Y, 0);

		this.scene.add(floorMesh);

		// BACKGROUND ---------------------------------------------------------------------------------------------------------

		this.bgMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: THREE.VertexColors });
		this.bgGeometry = new THREE.BoxGeometry(1000, 300, 1000);

		//bgGeometry.attributes.color. .getAttribute("color").array;

		let c1 = new THREE.Color(0x000000);
		let c2 = new THREE.Color(0x2c2430);
		let bgColors: THREE.Color[] = [c1, c2, c1, c2, c2, c1, c1, c2, c1, c2, c2, c1, c1, c1, c1, c1, c1, c1, c2, c2, c2, c2, c2, c2, c1, c1, c1, c1, c1, c1, c1, c2, c1, c2, c2, c1];

		for (let f = 0; f < this.bgGeometry.faces.length; f++) {
			let face = this.bgGeometry.faces[f];
			for (let c = 0; c < 3; c++) face.vertexColors[c] = bgColors[3 * f + c];
		}

		let bgMesh = new THREE.Mesh(this.bgGeometry, this.bgMaterial);
		bgMesh.position.set(HALF_X, 150 - RES_Y - 1, 0);

		this.scene.add(bgMesh);

		// LIGHTS -------------------------------------------------------------------------------------------------------------

		let ambientLight = new THREE.AmbientLight(c2);
		this.scene.add(ambientLight);

		this.lights = [];

		for (let l = 0; l < 8; l++) {
			let light = new THREE.PointLight(this.offColor, 1, 50);
			light.position.set((l * 16) + 8, -HALF_Y, 0);
			this.scene.add(light);

			this.lights.push(light);
		}

		// MISC ---------------------------------------------------------------------------------------------------------------

		window.addEventListener("resize", this.UpdateRendererResolution, false);

		this.initialTime = -1;
		this.shouldUpdate = true;
		this.VRAM = new Uint8Array(RES_X * RES_Y);

		this.PrintDebugInfo();

		// EXECUTE UPDATE -----------------------------------------------------------------------------------------------------

		requestAnimationFrame(this.Update);
	}

	public Dispose(): void {
		this.shouldUpdate = false;

		this.screenGeometry.dispose();
		this.screenMaterial.dispose();
		this.dotsTexture.dispose();

		this.floorGeometry.dispose();
		this.floorMaterial.dispose();

		this.bgGeometry.dispose();
		this.bgMaterial.dispose();

		this.renderer.dispose();
		this.scene.dispose();

		window.removeEventListener("resize", this.UpdateRendererResolution, false);
		this.renderContainer.removeChild(this.canvas);

		this.PrintDebugInfo();
	}

	private Update = (now: number): void => {
		if (!this.shouldUpdate) return;

		if (this.initialTime < 0) this.initialTime = now;
		let elapsedSeconds: number = (now - this.initialTime) / 1000;

		this.RotateCamera(elapsedSeconds, 0.05);

		DotShader.uniforms.time.value = elapsedSeconds * 30;

		this.renderer.render(this.scene, this.camera);

		requestAnimationFrame(this.Update);
	}

	public SetVRAM(VRAM: Uint8Array): void {
		this.VRAM = VRAM;

		let i: number = 0;
		for (let y = 0; y < RES_Y; y++) {
			for (let x = 0; x < RES_X; x++) {
				let value: number = this.VRAM[RES_X * y + x];
				this.screenVertexColors[i + 0] = value;
				this.screenVertexColors[i + 1] = value;
				this.screenVertexColors[i + 2] = value;
				i += 3;
			}
		}

		this.screenColorBuffer.setArray(this.screenVertexColors);
		this.screenColorBuffer.needsUpdate = true;

		this.UpdateLights();
	}

	public SetColors(offColor: string, onColor: string): void {
		this.offColor = new THREE.Color(offColor);
		this.onColor = new THREE.Color(onColor);

		DotShader.uniforms.colorOff.value = this.offColor;
		DotShader.uniforms.colorOn.value = this.onColor;

		this.UpdateLights();
	}

	private UpdateLights(): void {
		for (let n = 0; n < 8; n++) {
			let color: number = 0;

			for (let y = 0; y < RES_Y; y++) {
				for (let x = n * 16; x < (n * 16) + 16; x++) {
					color += this.VRAM[RES_X * y + x];
				}
			}

			color = color / (RES_Y * 16);

			this.lights[n].color = new THREE.Color(this.offColor).lerp(this.onColor, color);
		}
	}

	private RotateCamera(angle: number, limit: number): void {
		let s = Math.sin(angle);

		this.camera.position.x = -this.camera.position.z * s * limit;
		this.camera.position.x += HALF_X;

		this.camera.lookAt(this.cameraTarget);
	}

	public UpdateRendererResolution = (): void => {
		let width = this.renderContainer.clientWidth;
		let height = this.renderContainer.clientHeight;

		// Resize the canvas associated with the renderer
		this.renderer.setSize(width, height, false);

		// Update the camera
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		DotShader.uniforms.dotSize.value = height * 3;
	}

	private PrintDebugInfo(): void {
		console.log(this.renderer.info);
	}
}