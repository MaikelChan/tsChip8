import * as THREE from "three";
import { RES_X, RES_Y } from "../chip8/chip8";
import { IRenderer } from "../chip8/interfaces";
import { VertexLitInstanced } from "../shaders/vertex-lit-instanced";

const HALF_X: number = RES_X >> 1;
const HALF_Y: number = RES_Y >> 1;

const ENV_COLOR1: THREE.Color = new THREE.Color(0x000000);
const ENV_COLOR2: THREE.Color = new THREE.Color(0x2c2430);
const LIGHT_0_POSITION: THREE.Vector3 = new THREE.Vector3(100.0, 0.0, 100.0);
const LIGHT_1_POSITION: THREE.Vector3 = new THREE.Vector3(-20.0, 0.0, -100.0);

export class WebGLVoxelRenderer implements IRenderer {
    private renderContainer: HTMLDivElement;
    private canvas: HTMLCanvasElement;

    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private cameraTarget: THREE.Vector3;
    private renderer: THREE.WebGLRenderer;

    private voxelGeometry: THREE.InstancedBufferGeometry;
    private voxelMaterial: THREE.RawShaderMaterial;
    private voxelTranslations: Float32Array;
    private voxelTranslationsBuffer: THREE.InstancedBufferAttribute;

    private floorMaterial: THREE.MeshPhongMaterial;
    private floorGeometry: THREE.PlaneBufferGeometry;

    private bgMaterial: THREE.MeshBasicMaterial;
    private bgGeometry: THREE.BoxGeometry;

    private light0: THREE.PointLight;
    private light1: THREE.PointLight;

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
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(width, height, false);

        // Set initial main screen colors
        this.offColor = new THREE.Color(offColor);
        this.onColor = new THREE.Color(onColor);

        // SCREEN -------------------------------------------------------------------------------------------------------------

        // Shader material for the voxels

        VertexLitInstanced.uniforms.ambientLightColor.value = ENV_COLOR2;
        VertexLitInstanced.uniforms.light0_position.value = LIGHT_0_POSITION;
        VertexLitInstanced.uniforms.light1_position.value = LIGHT_1_POSITION;
        VertexLitInstanced.uniforms.light0_color.value = this.onColor;
        VertexLitInstanced.uniforms.light1_color.value = this.offColor;

        this.voxelMaterial = new THREE.RawShaderMaterial(
            {
                uniforms: VertexLitInstanced.uniforms,
                vertexShader: VertexLitInstanced.vertexShader,
                fragmentShader: VertexLitInstanced.fragmentShader,
                transparent: false
                //depthTest: true,
                //depthWrite: true
            });

        // Geometry for the screen

        let cubeGeometry = new THREE.BoxBufferGeometry(0.8, 0.8, 0.8);
        this.voxelGeometry = new THREE.InstancedBufferGeometry();
        this.voxelGeometry.index = cubeGeometry.index;
        this.voxelGeometry.attributes = cubeGeometry.attributes;

        const instances: number = RES_X * RES_Y;
        this.voxelTranslations = new Float32Array(instances * 2);

        let i: number = 0;
        for (let y = 0; y < RES_Y; y++) {
            for (let x = 0; x < RES_X; x++) {
                this.voxelTranslations[i + 0] = x;
                this.voxelTranslations[i + 1] = -y;
                i += 3;
            }
        }

        this.voxelTranslationsBuffer = new THREE.InstancedBufferAttribute(this.voxelTranslations, 2);
        this.voxelTranslationsBuffer.setUsage(THREE.DynamicDrawUsage);

        this.voxelGeometry.setAttribute("translate", this.voxelTranslationsBuffer);

        // Create the mesh

        let cubeMesh = new THREE.Mesh(this.voxelGeometry, this.voxelMaterial);
        cubeMesh.frustumCulled = false;

        // Add the mesh to the scene

        this.scene.add(cubeMesh);

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

        const c1 = ENV_COLOR1;
        const c2 = ENV_COLOR2;
        let bgColors: THREE.Color[] = [c1, c2, c1, c2, c2, c1, c1, c2, c1, c2, c2, c1, c1, c1, c1, c1, c1, c1, c2, c2, c2, c2, c2, c2, c1, c1, c1, c1, c1, c1, c1, c2, c1, c2, c2, c1];

        for (let f = 0; f < this.bgGeometry.faces.length; f++) {
            let face = this.bgGeometry.faces[f];
            for (let c = 0; c < 3; c++) face.vertexColors[c] = bgColors[3 * f + c];
        }

        let bgMesh = new THREE.Mesh(this.bgGeometry, this.bgMaterial);
        bgMesh.position.set(HALF_X, 150 - RES_Y - 1, 0);

        this.scene.add(bgMesh);

        // LIGHTS -------------------------------------------------------------------------------------------------------------

        let ambientLight = new THREE.AmbientLight(ENV_COLOR2);
        this.scene.add(ambientLight);

        this.light0 = new THREE.PointLight(this.onColor, 1, 500, 2);
        this.light0.position.set(LIGHT_0_POSITION.x, LIGHT_0_POSITION.y, LIGHT_0_POSITION.z);
        this.scene.add(this.light0);

        this.light1 = new THREE.PointLight(this.offColor, 1, 500, 2);
        this.light1.position.set(LIGHT_1_POSITION.x, LIGHT_1_POSITION.y, LIGHT_1_POSITION.z);
        this.scene.add(this.light1);

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

        this.voxelGeometry.dispose();
        this.voxelMaterial.dispose();

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

        //this.RotateCamera(elapsedSeconds, 0.1);

        VertexLitInstanced.uniforms.time.value = elapsedSeconds;

        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(this.Update);
    }

    public SetVRAM(VRAM: Uint8Array): void {
        this.VRAM = VRAM;

        let i: number = 0;
        for (let y = 0; y < RES_Y; y++) {
            for (let x = 0; x < RES_X; x++) {
                let value: number = this.VRAM[RES_X * y + x];
                if (value === 1) {
                    this.voxelTranslations[i + 0] = x;
                    this.voxelTranslations[i + 1] = -y;
                }
                else {
                    this.voxelTranslations[i + 0] = 0;
                    this.voxelTranslations[i + 1] = -100;
                }
                i += 2;
            }
        }

        // Update the voxelTranslationsBuffer to get the updated values from the voxelTranslations array 
        this.voxelTranslationsBuffer.needsUpdate = true;
    }

    public SetColors(offColor: string, onColor: string): void {
        this.offColor = new THREE.Color(offColor);
        this.onColor = new THREE.Color(onColor);

        VertexLitInstanced.uniforms.light0_color.value = this.onColor;
        VertexLitInstanced.uniforms.light1_color.value = this.offColor;

        this.light0.color = this.onColor;
        this.light1.color = this.offColor;
    }

    private RotateCamera(time: number, range: number): void {
        let s = Math.sin(time);

        this.camera.position.x = -this.camera.position.z * s * range;
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
    }

    private PrintDebugInfo(): void {
        console.log(this.renderer.info);
    }
}