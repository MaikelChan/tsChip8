import { IRenderer } from "../chip8/interfaces";
import { RES_Y, RES_X } from "../chip8/chip8";

export class ASCIIRenderer implements IRenderer {
    private readonly renderContainer: HTMLDivElement;
    private readonly div: HTMLDivElement;

    constructor(renderContainer: HTMLDivElement, offColor: string, onColor: string) {
        this.renderContainer = renderContainer;

        this.div = document.createElement("div");
        this.div.id = "ascii-renderer";
        this.div.style.fontFamily = "monospace";
        this.div.style.lineHeight = "0.6em";
        this.div.style.textAlign = "center";
        this.div.style.flexGrow = "1";
        this.SetColors(offColor, onColor);
        this.renderContainer.appendChild(this.div);
    }

    public Dispose(): void {
        this.renderContainer.removeChild(this.div);
    }

    public SetVRAM(VRAM: Uint8Array): void {
        let text = "";

        for (let y = 0; y < RES_Y; y++) {
            for (let x = 0; x < RES_X; x++) {
                text += VRAM[y * RES_X + x] === 1 ? "#" : ".";
            }
            text += "<br>";
        }

        this.div.innerHTML = text;
    }

    public SetColors(offColor: string, onColor: string): void {
        this.div.style.backgroundColor = offColor;
        this.div.style.color = onColor;
    }

    public UpdateRendererResolution(): void {

    }
}