import { Main } from "./main";
import { KEYS_LENGTH, MainCommandIDs } from "./chip8";
import { InputStates } from "./input";
import { IDisposable } from "./interfaces";

export class InputEvents implements IDisposable {
    private readonly main: Main;

    private keyStates: InputStates[];

    constructor(main: Main) {
        this.main = main;

        // Initialize input key states
        this.keyStates = new Array<InputStates>(KEYS_LENGTH);

        for (let k = 0; k < KEYS_LENGTH; k++) {
            this.keyStates[k] = InputStates.KeyUp;
        }

        addEventListener("keydown", this.OnKeyDown);
        addEventListener("keyup", this.OnKeyUp);
    }

    public Dispose(): void {
        removeEventListener("keydown", this.OnKeyDown);
        removeEventListener("keyup", this.OnKeyUp);
    }

    private OnKeyDown = (e: KeyboardEvent) => {
        if (e.keyCode === 49 && this.keyStates[0x1] === InputStates.KeyUp) { this.keyStates[0x1] = InputStates.KeyDown; this.SendInput(0x1, InputStates.KeyDown); } //1
        if (e.keyCode === 50 && this.keyStates[0x2] === InputStates.KeyUp) { this.keyStates[0x2] = InputStates.KeyDown; this.SendInput(0x2, InputStates.KeyDown); } //2
        if (e.keyCode === 51 && this.keyStates[0x3] === InputStates.KeyUp) { this.keyStates[0x3] = InputStates.KeyDown; this.SendInput(0x3, InputStates.KeyDown); } //3
        if (e.keyCode === 52 && this.keyStates[0xc] === InputStates.KeyUp) { this.keyStates[0xc] = InputStates.KeyDown; this.SendInput(0xc, InputStates.KeyDown); } //4
        if (e.keyCode === 81 && this.keyStates[0x4] === InputStates.KeyUp) { this.keyStates[0x4] = InputStates.KeyDown; this.SendInput(0x4, InputStates.KeyDown); } //q
        if (e.keyCode === 87 && this.keyStates[0x5] === InputStates.KeyUp) { this.keyStates[0x5] = InputStates.KeyDown; this.SendInput(0x5, InputStates.KeyDown); } //w
        if (e.keyCode === 69 && this.keyStates[0x6] === InputStates.KeyUp) { this.keyStates[0x6] = InputStates.KeyDown; this.SendInput(0x6, InputStates.KeyDown); } //e
        if (e.keyCode === 82 && this.keyStates[0xd] === InputStates.KeyUp) { this.keyStates[0xd] = InputStates.KeyDown; this.SendInput(0xd, InputStates.KeyDown); } //r
        if (e.keyCode === 65 && this.keyStates[0x7] === InputStates.KeyUp) { this.keyStates[0x7] = InputStates.KeyDown; this.SendInput(0x7, InputStates.KeyDown); } //a
        if (e.keyCode === 83 && this.keyStates[0x8] === InputStates.KeyUp) { this.keyStates[0x8] = InputStates.KeyDown; this.SendInput(0x8, InputStates.KeyDown); } //s
        if (e.keyCode === 68 && this.keyStates[0x9] === InputStates.KeyUp) { this.keyStates[0x9] = InputStates.KeyDown; this.SendInput(0x9, InputStates.KeyDown); } //d
        if (e.keyCode === 70 && this.keyStates[0xe] === InputStates.KeyUp) { this.keyStates[0xe] = InputStates.KeyDown; this.SendInput(0xe, InputStates.KeyDown); } //f
        if (e.keyCode === 90 && this.keyStates[0xa] === InputStates.KeyUp) { this.keyStates[0xa] = InputStates.KeyDown; this.SendInput(0xa, InputStates.KeyDown); } //z
        if (e.keyCode === 88 && this.keyStates[0x0] === InputStates.KeyUp) { this.keyStates[0x0] = InputStates.KeyDown; this.SendInput(0x0, InputStates.KeyDown); } //x
        if (e.keyCode === 67 && this.keyStates[0xb] === InputStates.KeyUp) { this.keyStates[0xb] = InputStates.KeyDown; this.SendInput(0xb, InputStates.KeyDown); } //c
        if (e.keyCode === 86 && this.keyStates[0xf] === InputStates.KeyUp) { this.keyStates[0xf] = InputStates.KeyDown; this.SendInput(0xf, InputStates.KeyDown); } //v
    }

    private OnKeyUp = (e: KeyboardEvent) => {
        if (e.keyCode === 49) { this.keyStates[0x1] = InputStates.KeyUp; this.SendInput(0x1, InputStates.KeyUp); } //1
        if (e.keyCode === 50) { this.keyStates[0x2] = InputStates.KeyUp; this.SendInput(0x2, InputStates.KeyUp); } //2
        if (e.keyCode === 51) { this.keyStates[0x3] = InputStates.KeyUp; this.SendInput(0x3, InputStates.KeyUp); } //3
        if (e.keyCode === 52) { this.keyStates[0xc] = InputStates.KeyUp; this.SendInput(0xc, InputStates.KeyUp); } //4
        if (e.keyCode === 81) { this.keyStates[0x4] = InputStates.KeyUp; this.SendInput(0x4, InputStates.KeyUp); } //q
        if (e.keyCode === 87) { this.keyStates[0x5] = InputStates.KeyUp; this.SendInput(0x5, InputStates.KeyUp); } //w
        if (e.keyCode === 69) { this.keyStates[0x6] = InputStates.KeyUp; this.SendInput(0x6, InputStates.KeyUp); } //e
        if (e.keyCode === 82) { this.keyStates[0xd] = InputStates.KeyUp; this.SendInput(0xd, InputStates.KeyUp); } //r
        if (e.keyCode === 65) { this.keyStates[0x7] = InputStates.KeyUp; this.SendInput(0x7, InputStates.KeyUp); } //a
        if (e.keyCode === 83) { this.keyStates[0x8] = InputStates.KeyUp; this.SendInput(0x8, InputStates.KeyUp); } //s
        if (e.keyCode === 68) { this.keyStates[0x9] = InputStates.KeyUp; this.SendInput(0x9, InputStates.KeyUp); } //d
        if (e.keyCode === 70) { this.keyStates[0xe] = InputStates.KeyUp; this.SendInput(0xe, InputStates.KeyUp); } //f
        if (e.keyCode === 90) { this.keyStates[0xa] = InputStates.KeyUp; this.SendInput(0xa, InputStates.KeyUp); } //z
        if (e.keyCode === 88) { this.keyStates[0x0] = InputStates.KeyUp; this.SendInput(0x0, InputStates.KeyUp); } //x
        if (e.keyCode === 67) { this.keyStates[0xb] = InputStates.KeyUp; this.SendInput(0xb, InputStates.KeyUp); } //c
        if (e.keyCode === 86) { this.keyStates[0xf] = InputStates.KeyUp; this.SendInput(0xf, InputStates.KeyUp); } //v
    }

    private SendInput(key: number, state: InputStates) {
        this.main.SendCommand({ id: MainCommandIDs.SendInput, parameters: [key, state] });
    }
}