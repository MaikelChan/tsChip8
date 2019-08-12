//import { Chip8 } from "./chip8";
import Chip8Worker from "worker-loader?name=worker.js!./chip8/chip8";
import { EmulationStates, MainCommandIDs, Chip8CommandIDs } from "./chip8/chip8";
import { IInitialSettings, IMainCommand, IChip8Command, IRenderer, IPanel, IROMArchive, IROMInfo } from "./chip8/interfaces";
import { InputEvents } from "./input-events";
import { Sound } from "./sound";
import { WebGLRenderer } from "./renderers/webgl-renderer";
import { WebGLVoxelRenderer } from "./renderers/webgl-voxel-renderer";
import { CanvasRenderer } from "./renderers/canvas-renderer";
import { ASCIIRenderer } from "./renderers/ascii-renderer";
import { InfoPanel } from "./info-panel";

// "this" context lost: https://charliejwalter.net/this-context-lost-in-javascript-typescript/

const enum SidePanels { None, Info, Debug }

export class Main {

    // HTML Elements
    private readonly loadFileButton: HTMLInputElement;
    private readonly playButton: HTMLDivElement;
    private readonly stopButton: HTMLDivElement;
    private readonly romSelect: HTMLSelectElement;
    private readonly alt8xy6OpcodeCheckbox: HTMLInputElement;
    private readonly altFx55OpcodeCheckbox: HTMLInputElement;
    private readonly offColorPicker: HTMLInputElement;
    private readonly onColorPicker: HTMLInputElement;
    private readonly rendererSelect: HTMLSelectElement;
    private readonly renderContainer: HTMLDivElement;
    private readonly infoButton: HTMLDivElement;

    private readonly infoPanel: InfoPanel;
    //private readonly debugPanel: IPanel;

    private chip8Worker: Chip8Worker;
    private isRunning: boolean;

    private input?: InputEvents;
    private sound?: Sound;
    private renderer?: IRenderer;

    private VRAM?: Uint8Array;

    private romArchive?: IROMArchive;
    private currentSidePanel: SidePanels;

    private currentROMFile?: Blob;

    constructor() {
        this.loadFileButton = document.getElementById("files") as HTMLInputElement;
        this.playButton = document.getElementById("button-run") as HTMLDivElement;
        this.stopButton = document.getElementById("button-stop") as HTMLDivElement;
        this.romSelect = document.getElementById("select-rom") as HTMLSelectElement;
        this.alt8xy6OpcodeCheckbox = document.getElementById("8xy6-checkbox") as HTMLInputElement;
        this.altFx55OpcodeCheckbox = document.getElementById("Fx55-checkbox") as HTMLInputElement;
        this.offColorPicker = document.getElementById("color-picker-off") as HTMLInputElement;
        this.onColorPicker = document.getElementById("color-picker-on") as HTMLInputElement;
        this.rendererSelect = document.getElementById("select-renderer") as HTMLSelectElement;
        this.renderContainer = document.getElementById("render-container") as HTMLDivElement;
        this.infoButton = document.getElementById("button-info-panel") as HTMLDivElement;

        this.infoPanel = new InfoPanel();
        //this.debugPanel = new DebugPanel();

        this.chip8Worker = new Chip8Worker();
        this.isRunning = false;

        // Set HTML page event listeners
        this.loadFileButton.addEventListener("change", this.LoadROMOnChange);
        this.playButton.addEventListener("click", this.RunButtonOnClick);
        this.stopButton.addEventListener("click", this.StopButtonOnClick);
        this.romSelect.addEventListener("change", this.ROMSelectOnChange);
        this.alt8xy6OpcodeCheckbox.addEventListener("change", this.SettingsCheckBoxOnChange);
        this.altFx55OpcodeCheckbox.addEventListener("change", this.SettingsCheckBoxOnChange);
        this.offColorPicker.addEventListener("change", this.ColorsInputOnChange);
        this.onColorPicker.addEventListener("change", this.ColorsInputOnChange);
        this.rendererSelect.addEventListener("change", this.RendererSelectOnChange);
        this.infoButton.addEventListener("click", this.InfoButtonOnClick);

        this.currentSidePanel = SidePanels.None;

        this.currentROMFile = undefined;
        this.infoPanel.SetInfo(undefined);

        // Load ROM data
        this.LoadROMData();

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

        this.isRunning = true;
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

        this.isRunning = false;
    }

    private OnChip8StateChanged = (state: EmulationStates): void => {
        switch (state) {
            case EmulationStates.Stopped:
                this.playButton.classList.remove("disabled");
                this.stopButton.classList.add("disabled");
                this.TerminateEmulation();
                break;
            case EmulationStates.LoadingROM:
                this.playButton.classList.add("disabled");
                this.stopButton.classList.add("disabled");
                break;
            case EmulationStates.Run:
                this.playButton.classList.add("disabled");
                this.stopButton.classList.remove("disabled");
                this.InitializeEmulation();
                break;
        }
    }

    private SetRenderer = (index: number): void => {
        if (!this.isRunning) return;

        if (this.renderer !== undefined) this.renderer.Dispose();

        switch (index) {
            default:
                this.renderer = new WebGLRenderer(this.renderContainer, this.offColorPicker.value, this.onColorPicker.value);
                break;
            case 1:
                this.renderer = new WebGLVoxelRenderer(this.renderContainer, this.offColorPicker.value, this.onColorPicker.value);
                break;
            case 2:
                this.renderer = new CanvasRenderer(this.renderContainer, this.offColorPicker.value, this.onColorPicker.value);
                break;
            case 3:
                this.renderer = new ASCIIRenderer(this.renderContainer, this.offColorPicker.value, this.onColorPicker.value)
                break;
        }

        if (this.VRAM !== undefined) this.renderer.SetVRAM(this.VRAM);
    }

    private LoadROMData() {
        let request = new XMLHttpRequest();
        request.addEventListener("load", this.FinishROMDataLoading);
        request.open("GET", "./roms/roms.json", true);
        request.send(null);
    }

    private FinishROMDataLoading = (evt: Event): void => {
        let request = evt.target as XMLHttpRequest;
        if (request.readyState !== request.DONE) return;
        if (request.status !== 200) return;

        this.romArchive = JSON.parse(request.responseText);
        this.PopulateROMList();
    }

    private PopulateROMList(): void {
        if (this.romArchive === undefined) return;

        let base: string = "<option>" + this.romArchive.chip8.basePath + "/";
        for (let r: number = 0; r < this.romArchive.chip8.roms.length; r++) {
            this.romSelect.innerHTML += base + this.romArchive.chip8.roms[r].fileName + "</option>";
        }

        base = "<option>" + this.romArchive.schip.basePath + "/";
        for (let r: number = 0; r < this.romArchive.schip.roms.length; r++) {
            this.romSelect.innerHTML += base + this.romArchive.schip.roms[r].fileName + "</option>";
        }
    }

    private LoadROMFromList(index: number): void {
        if (index === 0) {
            this.currentROMFile = undefined;
            this.infoPanel.SetInfo(undefined);
            return;
        }

        if (this.romArchive === undefined) return;

        let info = this.GetROMInfo(this.romSelect.selectedIndex);
        if (info === undefined) return;

        let path: string = "./roms/" + info.basePath + "/" + info.romInfo.fileName;

        let request = new XMLHttpRequest();
        request.addEventListener("load", this.FinishROMLoadingFromList);
        request.open("GET", path, true);
        request.responseType = "blob";
        request.send(null);
    }

    private FinishROMLoadingFromList = (evt: Event): void => {
        let request = evt.target as XMLHttpRequest;
        if (request.readyState !== request.DONE) return;
        if (request.status !== 200) return;

        this.currentROMFile = request.response;
        let romInfo = this.GetROMInfo(this.romSelect.selectedIndex);
        this.infoPanel.SetInfo(romInfo);
    }

    private GetROMInfo(index: number): { romInfo: IROMInfo, basePath: string } | undefined {
        if (index === 0) return undefined;
        if (this.romArchive === undefined) return undefined;

        index--;
        if (index < this.romArchive.chip8.roms.length) { // It's a Chip8 game
            return { romInfo: this.romArchive.chip8.roms[index], basePath: this.romArchive.chip8.basePath };
        }
        else // It's a SuperChip game
        {
            index -= this.romArchive.chip8.roms.length;
            return { romInfo: this.romArchive.schip.roms[index], basePath: this.romArchive.schip.basePath };
        }
    }

    // HTML Page --------------------------------------------------------------------------------------------------------------

    private LoadROMOnChange = (): void => {
        let files = this.loadFileButton.files;

        if (files != null && files.length > 0) {
            this.romSelect.selectedIndex = 0;
            this.currentROMFile = files[0];
            this.infoPanel.SetInfo(undefined);
        }
    }

    private RunButtonOnClick = (): void => {
        if (this.currentROMFile === undefined) {
            alert("Please select a file!");
            return;
        }

        let initialSettings: IInitialSettings = {
            alt8xy6Opcode: this.alt8xy6OpcodeCheckbox.checked,
            altFx55Opcode: this.altFx55OpcodeCheckbox.checked
        }

        this.SendCommand({ id: MainCommandIDs.Run, parameters: [this.currentROMFile, initialSettings] });
    }

    private StopButtonOnClick = (): void => {
        this.SendCommand({ id: MainCommandIDs.Stop });
    }

    private ROMSelectOnChange = (): void => {
        this.LoadROMFromList(this.romSelect.selectedIndex);
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

    private InfoButtonOnClick = (): void => {
        if (this.currentSidePanel === SidePanels.Info) {
            this.currentSidePanel = SidePanels.None;
            this.infoPanel.Disable();
        }
        else {
            this.currentSidePanel = SidePanels.Info;
            this.infoPanel.Enable();
        }

        if (this.renderer !== undefined)
            this.renderer.UpdateRendererResolution();
    }

    // Worker -----------------------------------------------------------------------------------------------------------------

    private InitializeWorker = (): void => {
        this.chip8Worker.addEventListener("message", this.ReceiveCommand);
        this.chip8Worker.addEventListener("error", this.ReceiveError);
    }

    public SendCommand = (command: IMainCommand): void => {
        this.chip8Worker.postMessage(command);
    }

    private ReceiveCommand = (event: MessageEvent) => {
        let command: IChip8Command = event.data as IChip8Command;
        //console.log(`Received command from Chip8: { id: ${command.id}, parameters: ${command.parameters} }`);

        switch (command.id) {
            case Chip8CommandIDs.EmulationStateChanged:
                if (command.parameters === undefined) break;
                let parameter = command.parameters[0] as EmulationStates;
                this.OnChip8StateChanged(parameter);
                break;
            case Chip8CommandIDs.SendVRAM:
                if (command.parameters === undefined) break;
                this.VRAM = command.parameters[0];
                if (this.VRAM !== undefined) this.renderer!.SetVRAM(this.VRAM);
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