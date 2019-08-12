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
    UpdateRendererResolution(): void;
}

export interface IPanel {
    Enable(): void;
    Disable(): void;
}

export interface IROMArchive {
    chip8: IROMCategory;
    schip: IROMCategory;
}

export interface IROMCategory {
    basePath: string;
    roms: IROMInfo[];
}

export interface IROMInfo {
    fileName: string;
    title: string;
    author: string;
    date: string;
}