//import { Chip8 } from "./chip8";
import Chip8Worker from "worker-loader?name=worker.js!./chip8";
import { EmulationStates, MainCommandIDs, Chip8CommandIDs } from "./chip8";
import { InputEvents } from "./input-events";
import { WebGLRenderer } from "./webgl-renderer";
import { InitialSettings, MainCommand, Chip8Command, IRenderer } from "./interfaces";
import { ASCIIRenderer } from "./ascii-renderer";
import { Sound } from "./sound";
import { CanvasRenderer } from "./canvas-renderer";

// "this" context lost: https://charliejwalter.net/this-context-lost-in-javascript-typescript/

export class Main {

    // HTML Elements
    private readonly openFileButton: HTMLInputElement;
    private readonly playButton: HTMLInputElement;
    private readonly stopButton: HTMLInputElement;
    private readonly alt8xy6OpcodeCheckbox: HTMLInputElement;
    private readonly altFx55OpcodeCheckbox: HTMLInputElement;
    private readonly offColorPicker: HTMLInputElement;
    private readonly onColorPicker: HTMLInputElement;
    private readonly rendererSelect: HTMLSelectElement;
    private readonly renderContainer: HTMLDivElement;

    private chip8Worker: Chip8Worker;

    private input?: InputEvents;
    private sound?: Sound;
    private renderer?: IRenderer;

    constructor() {
        this.openFileButton = document.getElementById("files") as HTMLInputElement;
        this.playButton = document.getElementById("button-run") as HTMLInputElement;
        this.stopButton = document.getElementById("button-stop") as HTMLInputElement;
        this.alt8xy6OpcodeCheckbox = document.getElementById("8xy6-checkbox") as HTMLInputElement;
        this.altFx55OpcodeCheckbox = document.getElementById("Fx55-checkbox") as HTMLInputElement;
        this.offColorPicker = document.getElementById("color-picker-off") as HTMLInputElement;
        this.onColorPicker = document.getElementById("color-picker-on") as HTMLInputElement;
        this.rendererSelect = document.getElementById("select-renderer") as HTMLSelectElement;
        this.renderContainer = document.getElementById("render-container") as HTMLDivElement;

        this.chip8Worker = new Chip8Worker();

        // Set HTML page event listeners
        this.playButton.addEventListener("click", this.RunButtonOnClick);
        this.stopButton.addEventListener("click", this.StopButtonOnClick);
        this.alt8xy6OpcodeCheckbox.addEventListener("change", this.SettingsCheckBoxOnChange);
        this.altFx55OpcodeCheckbox.addEventListener("change", this.SettingsCheckBoxOnChange);
        this.offColorPicker.addEventListener("change", this.ColorsInputOnChange);
        this.onColorPicker.addEventListener("change", this.ColorsInputOnChange);
        this.rendererSelect.addEventListener("change", this.RendererSelectOnChange);

        // Initialize worker
        this.InitializeWorker();
    }

    private InitializeEmulation = (): void => {
        if (this.input === undefined) {
            this.input = new InputEvents(this);
        }

        if (this.sound === undefined) {
            this.sound = new Sound();
        }

        this.SetRenderer(this.rendererSelect.selectedIndex);
    }

    private TerminateEmulation = (): void => {
        if (this.input !== undefined) {
            this.input.Dispose();
            this.input = undefined;
        }

        if (this.sound !== undefined) {
            this.sound.Dispose();
            this.sound = undefined;
        }

        if (this.renderer !== undefined) {
            this.renderer.Dispose();
            this.renderer = undefined;
        }
    }

    private OnChip8StateChanged = (state: EmulationStates): void => {
        switch (state) {
            case EmulationStates.Stopped:
                this.playButton.disabled = false;
                this.stopButton.disabled = true;
                this.TerminateEmulation();
                break;
            case EmulationStates.LoadingROM:
                this.playButton.disabled = true;
                this.stopButton.disabled = true;
                break;
            case EmulationStates.Run:
                this.playButton.disabled = true;
                this.stopButton.disabled = false;
                this.InitializeEmulation();
                break;
        }
    }

    private SetRenderer = (index: number): void => {
        if (this.renderer !== undefined) this.renderer.Dispose();

        switch (index) {
            case 0:
                this.renderer = new WebGLRenderer(this.renderContainer, this.offColorPicker.value, this.onColorPicker.value);
                break;
            case 1:
                this.renderer = new CanvasRenderer(this.renderContainer, this.offColorPicker.value, this.onColorPicker.value);
                break;
            case 2:
                this.renderer = new ASCIIRenderer(this.renderContainer, this.offColorPicker.value, this.onColorPicker.value)
                break;
        }
    }

    // HTML Page --------------------------------------------------------------------------------------------------------------

    private RunButtonOnClick = (): void => {
        let files = this.openFileButton.files;

        if (files != null && files.length > 0) {
            let initialSettings: InitialSettings = {
                alt8xy6Opcode: this.alt8xy6OpcodeCheckbox.checked,
                altFx55Opcode: this.altFx55OpcodeCheckbox.checked
            }
            this.SendCommand({ id: MainCommandIDs.Run, parameters: [files[0], initialSettings] });
        }
        else {
            alert('Please select a file!');
        }
    }

    private StopButtonOnClick = (): void => {
        this.SendCommand({ id: MainCommandIDs.Stop });
    }

    private SettingsCheckBoxOnChange = (): void => {
        this.SendCommand({ id: MainCommandIDs.SetSettings, parameters: [this.alt8xy6OpcodeCheckbox.checked, this.altFx55OpcodeCheckbox.checked] });
    }

    private ColorsInputOnChange = (): void => {
        if (this.renderer === undefined) return;
        this.renderer.SetColors(this.offColorPicker.value, this.onColorPicker.value);
    }

    private RendererSelectOnChange = (): void => {
        this.SetRenderer(this.rendererSelect.selectedIndex);
    }

    // Worker -----------------------------------------------------------------------------------------------------------------

    private InitializeWorker = (): void => {
        this.chip8Worker.addEventListener("message", this.ReceiveCommand);
        this.chip8Worker.addEventListener("error", this.ReceiveError);
    }

    public SendCommand = (command: MainCommand): void => {
        this.chip8Worker.postMessage(command);
    }

    private ReceiveCommand = (event: MessageEvent) => {
        let command: Chip8Command = event.data as Chip8Command;
        //console.log(`Received command from Chip8: { id: ${command.id}, parameters: ${command.parameters} }`);

        switch (command.id) {
            case Chip8CommandIDs.EmulationStateChanged:
                if (command.parameters === undefined) break;
                let parameter = command.parameters[0] as EmulationStates;
                this.OnChip8StateChanged(parameter);
                break;
            case Chip8CommandIDs.SendVRAM:
                if (command.parameters === undefined) break;
                this.renderer!.SetVRAM(command.parameters[0]);
                break;
            case Chip8CommandIDs.PlaySound:
                this.sound!.Play();
                break;
            case Chip8CommandIDs.StopSound:
                this.sound!.Stop();
                break;
        }
    }

    private ReceiveError = (event: ErrorEvent) => {
        console.error(`Received error from Chip8: ${event.message}`);
    }
}

const main = new Main();