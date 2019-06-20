import { KEYS_LENGTH } from "./chip8";

export const enum InputStates { KeyUp, KeyDown, KeyReleased };

export class Input {

    public readonly currentKeyState: InputStates[];
    public readonly lastKeyState: InputStates[];

    constructor() {
        this.currentKeyState = new Array<InputStates>(KEYS_LENGTH);
        this.lastKeyState = new Array<InputStates>(KEYS_LENGTH);

        for (let n = 0; n < KEYS_LENGTH; n++) {
            this.currentKeyState[n] = InputStates.KeyUp;
            this.lastKeyState[n] = InputStates.KeyUp;
        }
    }

    public Update(): void {
        for (let n = 0; n < KEYS_LENGTH; n++) {
            if (this.lastKeyState[n] === InputStates.KeyDown && this.currentKeyState[n] === InputStates.KeyUp)
                this.currentKeyState[n] = InputStates.KeyReleased;
            else if (this.currentKeyState[n] === InputStates.KeyReleased)
                this.currentKeyState[n] = InputStates.KeyUp;

            this.lastKeyState[n] = this.currentKeyState[n];
        }
    }

    public SetInputKey(key: number, state: InputStates): void {
        this.currentKeyState[key] = state;
    }
}