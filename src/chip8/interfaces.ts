import { MainCommandIDs, Chip8CommandIDs } from "./chip8";

export interface IMainCommand {
    id: MainCommandIDs,
    parameters?: any[]
}

export interface IChip8Command {
    id: Chip8CommandIDs,
    parameters?: any[]
}

export interface IInitialSettings {
    alt8xy6Opcode: boolean,
    altFx55Opcode: boolean
}

export interface IUpdatable {
    Update(deltaTime: number): void;
}

export interface IDisposable {
    Dispose(): void;
}

export interface IRenderer extends IDisposable {
    SetVRAM(VRAM: Uint8Array): void;
    SetColors(offColor: string, onColor: string): void;
}