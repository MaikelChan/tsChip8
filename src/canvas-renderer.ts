import { IRenderer } from "./interfaces";
import { RES_Y, RES_X, ASPECT_RATIO } from "./chip8";

export class CanvasRenderer implements IRenderer {
    private readonly renderContainer: HTMLDivElement;
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D | null;

    private offColor: string;
    private onColor: string;

    constructor(renderContainer: HTMLDivElement, offColor: string, onColor: string) {
        this.renderContainer = renderContainer;

        // Create the canvas
        this.canvas = document.createElement("canvas");
        this.canvas.id = "render-canvas";
        this.canvas.style.position = "absolute";
        //this.canvas.style.imageRendering = "pixelated";
        this.canvas.width = 1024;
        this.canvas.height = 512;
        this.renderContainer.appendChild(this.canvas);
        
        // Get the context
        this.context = this.canvas.getContext("2d");

        // Initialize resolution
        this.UpdateRendererResolution();

        this.offColor = offColor;
        this.onColor = onColor;

        window.addEventListener("resize", this.UpdateRendererResolution, false);
    }

    public Dispose(): void {
        window.removeEventListener("resize", this.UpdateRendererResolution, false);
        this.renderContainer.removeChild(this.canvas);
    }

    public SetVRAM(VRAM: Uint8Array): void {
        let width: number = this.canvas.width;
        let height: number = this.canvas.height;
        let pixelSize: number = width / RES_X;

        this.context!.fillStyle = this.offColor;
        this.context!.fillRect(0, 0, width, height);

        this.context!.fillStyle = this.onColor;

        for (let y = 0; y < RES_Y; y++) {
            for (let x = 0; x < RES_X; x++) {
                if (VRAM[y * RES_X + x] === 1)
                    this.context!.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }

    public SetColors(offColor: string, onColor: string): void {
        this.offColor = offColor;
        this.onColor = onColor;
    }

    public UpdateRendererResolution = (): void => {
        let width = this.renderContainer.clientWidth;
        let height = this.renderContainer.clientHeight;

        let canvasWidth: number;
        let canvasHeight: number;
        let marginLeft: number;
        let marginTop: number;

        if (width / height > ASPECT_RATIO) {
            canvasWidth = height * ASPECT_RATIO;
            canvasHeight = height;
            marginLeft = (width - canvasWidth) / 2;
            marginTop = 0;
        }
        else {
            canvasWidth = width;
            canvasHeight = width / ASPECT_RATIO;
            marginLeft = 0;
            marginTop = (height - canvasHeight) / 2;
        }

        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
        this.canvas.style.marginLeft = `${marginLeft}px`;
        this.canvas.style.marginTop = `${marginTop}px`;
    }
}