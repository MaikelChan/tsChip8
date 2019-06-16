import { CPU } from "./cpu";
import { Memory } from "./memory";
import { Sound } from "./sound";
import { InputStates, Input } from "./input";
import { InitialSettings, Chip8Command, MainCommand } from "./interfaces";

export const enum EmulationModes {
	Chip8, SuperChip
}

export const enum MainCommandIDs {
	Run, Stop, SetSettings, SendInput
};

export const enum Chip8CommandIDs {
	EmulationStateChanged, SendVRAM, PlaySound, StopSound
};

export const enum EmulationStates { Stopped, LoadingROM, Run };

export const RES_X: number = 128;
export const RES_Y: number = 64;
export const ASPECT_RATIO: number = RES_X / RES_Y;
export const RAM_SIZE: number = 0x1000;
export const ROM_START_ADDRESS: number = 0x200;
export const REGISTERS_SIZE: number = 16;
export const HP48_REGISTERS_SIZE: number = 8;
export const STACK_SIZE: number = 16;
export const FRAME_LENGTH: number = 1000 / 60;
export const KEYS_LENGTH = 16;

export class Chip8 {

	private readonly worker: Worker;

	private emulationState: EmulationStates;
	public get EmulationState(): EmulationStates { return this.emulationState; }

	// Emulator modules
	private memory?: Memory;
	private input?: Input;
	private cpu?: CPU;

	// Initial config variables
	private initialSettings?: InitialSettings;

	constructor() {
		this.worker = self as any;

		this.emulationState = EmulationStates.Stopped;

		// Initialize worker
		this.InitializeWorker();
	}

	private Initialize(file: File, initialSettins: InitialSettings): void {
		if (this.emulationState !== EmulationStates.Stopped) return;

		this.initialSettings = initialSettins;

		this.SetEmulationState(EmulationStates.LoadingROM);

		let reader = new FileReader();
		reader.readAsArrayBuffer(file);
		reader.addEventListener("loadend", this.FinishLoading);
	}

	private FinishLoading = (evt: ProgressEvent): void => {
		let reader = evt.target as FileReader;
		if (reader.readyState === reader.DONE) {
			let buffer: ArrayBuffer = reader.result as ArrayBuffer;
			this.Run(new Uint8Array(buffer));
		}
		else {
			console.error(`Loading ROM Error: ${evt}`);
			this.SetEmulationState(EmulationStates.Stopped);
		}
	}

	private Run(romData: Uint8Array): void {
		this.memory = new Memory(romData);
		this.input = new Input();
		this.cpu = new CPU(() => this.Stop(), this, this.memory, this.input, this.initialSettings!.alt8xy6Opcode, this.initialSettings!.altFx55Opcode);

		this.cpu.Run();
		this.SetEmulationState(EmulationStates.Run);
	}

	private Stop(): void {
		if (this.emulationState !== EmulationStates.Run) return;

		this.cpu!.Stop();
		this.SetEmulationState(EmulationStates.Stopped);

		this.memory = undefined;
		this.input = undefined;
		this.cpu = undefined;
	}

	private SetSettings(alt8xy6Opcode: boolean, altFx55Opcode: boolean): void {
		if (this.emulationState !== EmulationStates.Run) return;

		this.cpu!.SetSettings(alt8xy6Opcode, altFx55Opcode);
	}

	private SetInputKey(key: number, state: InputStates): void {
		if (this.emulationState !== EmulationStates.Run) return;

		this.input!.SetInputKey(key, state);
	}

	private SetEmulationState(state: EmulationStates): void {
		if (this.emulationState === state) return;
		this.emulationState = state;

		this.SendCommand({ id: Chip8CommandIDs.EmulationStateChanged, parameters: [state] });
	}

	// Worker -------------------------------------------------------------------------------------

	private InitializeWorker = (): void => {
		this.worker.addEventListener("message", this.ReceiveCommand);
	}

	public SendCommand = (command: Chip8Command): void => {
		this.worker.postMessage(command);
	}

	private ReceiveCommand = (event: MessageEvent): void => {
		let command: MainCommand = event.data as MainCommand;
		//console.log(`Received command from Main: { id: ${command.id}, parameters: ${command.parameters} }`);

		switch (command.id) {
			case MainCommandIDs.Run:
				if (command.parameters === undefined) break;
				let file = command.parameters[0] as File;
				this.Initialize(file, command.parameters[1]);
				break;
			case MainCommandIDs.Stop:
				this.Stop();
				break;
			case MainCommandIDs.SetSettings:
				if (command.parameters === undefined) break;
				this.SetSettings(command.parameters[0], command.parameters[1]);
				break;
			case MainCommandIDs.SendInput:
				if (command.parameters === undefined) break;
				this.SetInputKey(command.parameters[0], command.parameters[1]);
				break;
			default:
				console.error("Unknown command");
				break;
		}
	}
}

const chip8 = new Chip8();