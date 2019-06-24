import { REGISTERS_SIZE, HP48_REGISTERS_SIZE, STACK_SIZE, RES_Y, RES_X, KEYS_LENGTH, ROM_START_ADDRESS, Chip8, FRAME_LENGTH, EmulationModes, Chip8CommandIDs, } from "./chip8";
import { Memory } from "./memory";
import { Input, InputStates } from "./input";

export class CPU {
    private readonly finishCallback: () => void;
    private readonly chip8: Chip8;
    private readonly memory: Memory;
    private readonly input: Input;

    private readonly V: Uint8Array;
    private readonly HP48: Uint8Array;
    private readonly Stack: Uint16Array;

    private PC: number;
    private SP: number;
    private I: number;

    private delayTimer: number;
    private soundTimer: number;

    private alt8xy6Opcode: boolean;
    private altFx55Opcode: boolean;

    private emulationMode: EmulationModes;

    private isRunning: boolean;
    private waitForRender: boolean;

    private intervalLoop?: number;

    constructor(finishCallback: () => void, chip8: Chip8, memory: Memory, input: Input, alt8xy6Opcode: boolean, altFx55Opcode: boolean) {
        this.finishCallback = finishCallback;
        this.chip8 = chip8;
        this.memory = memory;
        this.input = input;

        this.alt8xy6Opcode = alt8xy6Opcode;
        this.altFx55Opcode = altFx55Opcode;

        this.V = new Uint8Array(REGISTERS_SIZE);
        this.HP48 = new Uint8Array(HP48_REGISTERS_SIZE);
        this.Stack = new Uint16Array(STACK_SIZE);

        this.PC = ROM_START_ADDRESS;
        this.SP = 0;
        this.I = 0;

        this.delayTimer = 0;
        this.soundTimer = 0;

        // Clear V registers
        for (let n = 0; n < REGISTERS_SIZE; n++) this.V[n] = 0;

        // Clear HP48 registers
        for (let n = 0; n < HP48_REGISTERS_SIZE; n++) this.HP48[n] = 0;

        // Clear stack
        for (let n = 0; n < STACK_SIZE; n++) this.Stack[n] = 0x0;

        this.emulationMode = EmulationModes.Chip8;

        this.isRunning = false;
        this.waitForRender = false;
    }

    public Update = (): void => {
        this.waitForRender = false;

        for (let n = 0; n < 1024; n++) {
            if (!this.isRunning) return;
            if (this.waitForRender) break;

            this.ProcessOpcodes();
            this.input.Update();
        }

        this.DecrementTimers();
    }

    public Run(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.intervalLoop = setInterval(this.Update, FRAME_LENGTH);
    }

    public Stop(): void {
        if (!this.isRunning) return;

        clearInterval(this.intervalLoop);
        this.isRunning = false;

        this.memory.ClearVRAM();
        this.SendVRAM();
    }

    public SetSettings(alt8xy6Opcode: boolean, altFx55Opcode: boolean): void {
        this.alt8xy6Opcode = alt8xy6Opcode;
        this.altFx55Opcode = altFx55Opcode;
    }

    private ProcessOpcodes(): void {
        // Read one opcode. Each one is two bytes long.
        let currentOpcode: number = this.memory.RAM[this.PC] << 8 | this.memory.RAM[this.PC + 1];

        let opcode1 = (currentOpcode & 0xF000) >> 12; // Highest 4 bits from the opcode
        let opcode2 = (currentOpcode & 0x0F00) >> 8;  //X
        let opcode3 = (currentOpcode & 0x00F0) >> 4;  //Y
        let opcode4 = (currentOpcode & 0x000F);  //N

        // Increment Program Counter to read the next opcode later.
        this.PC += 2;

        switch (opcode1) {
            // 0xxx opcodes

            case (0x0):
                {
                    switch (currentOpcode) {
                        case (0x00E0):
                            {
                                // 00E0 - CLS
                                // Clear the display.

                                this.memory.ClearVRAM();
                                this.SendVRAM();
                                break;
                            }
                        case (0x00EE):
                            {
                                // Return from a subroutine.
                                // The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.

                                this.SP--;
                                this.PC = this.Stack[this.SP];
                                break;
                            }

                        case (0x00fb):
                            {
                                // Scroll 4 pixels right

                                for (let y = 0; y < RES_Y; y++) {
                                    for (let x = RES_X - 4 - 1; x >= 0; x--) {
                                        this.memory.SetPixelValue(x + 4, y, this.memory.GetPixel(x, y));
                                    }

                                    for (let x = 0; x < 4; x++) this.memory.SetPixelValue(x, y, 0);
                                }

                                this.SendVRAM();

                                break;
                            }
                        case (0x00fc):
                            {
                                // Scroll 4 pixels left

                                for (let y = 0; y < RES_Y; y++) {
                                    for (let x = 4; x < RES_X; x++) {
                                        this.memory.SetPixelValue(x - 4, y, this.memory.GetPixel(x, y));
                                    }

                                    for (let x = RES_X - 4; x < RES_X; x++) this.memory.SetPixelValue(x, y, 0);
                                }

                                this.SendVRAM();

                                break;
                            }
                        case (0x00fd):
                            {
                                // Finish emulation

                                this.finishCallback();
                                break;
                            }
                        case (0x00fe):
                            {
                                // Change to Chip8 mode

                                this.ChangeMode(EmulationModes.Chip8);
                                this.SendVRAM();
                                break;
                            }
                        case (0x00ff):
                            {
                                // Change to SuperChip mode

                                this.ChangeMode(EmulationModes.SuperChip);
                                this.SendVRAM();
                                break;
                            }
                        default:

                            if (opcode3 === 0xc) {
                                //0x00Cx: Scroll the screen down x lines

                                for (let x = 0; x < RES_X; x++) {
                                    for (let y = RES_Y - opcode4 - 1; y >= 0; y--) {
                                        this.memory.SetPixelValue(x, y + opcode4, this.memory.GetPixel(x, y));
                                    }

                                    for (let y = 0; y < opcode4; y++) this.memory.SetPixelValue(x, y, 0);
                                }

                                this.SendVRAM();
                            }
                            else if (opcode2 !== 0) {
                                //0nnn - SYS addr
                                //Jump to a machine code routine at nnn.
                                //This instruction is only used on the old computers on which Chip-8 was originally implemented. It is ignored by modern interpreters.
                            }
                            else {
                                this.UnknownOpcode(currentOpcode);
                            }

                            break;
                    }

                    break;
                }

            case (0x1):
                {
                    //1nnn - JP addr
                    //Jump to location nnn.
                    //The interpreter sets the program counter to nnn.

                    this.PC = currentOpcode & 0xFFF;
                    break;
                }

            case (0x2):
                {
                    //2nnn - CALL addr
                    //Call subroutine at nnn.
                    //The interpreter increments the Stack pointer, then puts the current PC on the top of the Stack. The PC is then set to nnn.

                    this.Stack[this.SP] = this.PC;
                    this.SP++;
                    this.PC = currentOpcode & 0xFFF;
                    break;
                }

            case (0x3):
                {
                    //3xkk - SE Vx, byte
                    //Skip next instruction if Vx = kk.
                    //The interpreter compares register Vx to kk, and if they are equal, increments the program counter by 2.

                    if (this.V[opcode2] === (currentOpcode & 0xFF)) this.PC += 2;
                    break;
                }

            case (0x4):
                {
                    //4xkk - SNE Vx, byte
                    //Skip next instruction if Vx != kk.
                    //The interpreter compares register Vx to kk, and if they are not equal, increments the program counter by 2.

                    if (this.V[opcode2] !== (currentOpcode & 0xFF)) this.PC += 2;
                    break;
                }

            case (0x5):
                {
                    if (opcode4 === 0) {
                        //5xy0 - SE Vx, Vy
                        //Skip next instruction if Vx = Vy.
                        //The interpreter compares register Vx to register Vy, and if they are equal, increments the program counter by 2.

                        if (this.V[opcode2] === this.V[opcode3]) this.PC += 2;
                    }
                    else {
                        this.UnknownOpcode(currentOpcode);
                    }

                    break;
                }

            case (0x6):
                {
                    //6xkk - LD Vx, byte
                    //Set Vx = kk.
                    //The interpreter puts the value kk into register Vx.

                    this.V[opcode2] = (currentOpcode & 0xFF);
                    break;
                }

            case (0x7):
                {
                    //7xkk - ADD Vx, byte
                    //Set Vx = Vx + kk.
                    //Adds the value kk to the value of register Vx, then stores the result in Vx. 

                    this.V[opcode2] = (this.V[opcode2] + currentOpcode) & 0xFF;
                    break;
                }

            case (0x8):
                {
                    switch (opcode4) {
                        case (0x0):
                            {
                                //8xy0 - LD Vx, Vy
                                //Set Vx = Vy.
                                //Stores the value of register Vy in register Vx.

                                this.V[opcode2] = this.V[opcode3];
                                break;
                            }

                        case (0x1):
                            {
                                //8xy1 - OR Vx, Vy
                                //Set Vx = Vx OR Vy.
                                //Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx.
                                //A bitwise OR compares the corrseponding bits from two values, and if either bit is 1, then the same bit in the result is also 1. Otherwise, it is 0.

                                this.V[opcode2] |= this.V[opcode3];
                                break;
                            }

                        case (0x2):
                            {
                                //8xy2 - AND Vx, Vy
                                //Vx = Vx AND Vy.
                                //Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx.
                                //A bitwise AND compares the corrseponding bits from two values, and if both bits are 1, then the same bit in the result is also 1. Otherwise, it is 0. 

                                this.V[opcode2] &= this.V[opcode3];
                                break;
                            }

                        case (0x3):
                            {
                                //8xy3 - XOR Vx, Vy
                                //Set Vx = Vx XOR Vy.
                                //Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx.
                                //An exclusive OR compares the corrseponding bits from two values, and if the bits are not both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0. 

                                this.V[opcode2] ^= this.V[opcode3];
                                break;
                            }

                        case (0x4):
                            {
                                //8xy4 - ADD Vx, Vy
                                //Set Vx = Vx + Vy, set VF = carry.
                                //The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0.
                                //Only the lowest 8 bits of the result are kept, and stored in Vx.

                                let N = this.V[opcode2] + this.V[opcode3];
                                this.V[0xF] = N > 0xFF ? 1 : 0;
                                this.V[opcode2] = N & 0xFF;

                                break;
                            }

                        case (0x5):
                            {
                                //8xy5 - SUB Vx, Vy
                                //Set Vx = Vx - Vy, set VF = NOT borrow.
                                //If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.

                                if (this.V[opcode2] >= this.V[opcode3])
                                    this.V[0xF] = 1;
                                else
                                    this.V[0xF] = 0;

                                this.V[opcode2] = (this.V[opcode2] - this.V[opcode3]) & 0xFF;

                                break;
                            }

                        case (0x6):
                            {
                                //8xy6 - SHR Vx {, Vy}
                                //Set Vx = Vx SHR 1.      <--------- THIS IS NOT CORRECT!
                                //If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.

                                //Store the value of register VY shifted right one bit in register VX
                                //Set register VF to the least significant bit prior to the shift

                                if (!this.alt8xy6Opcode && this.emulationMode === EmulationModes.Chip8) {
                                    this.V[0xF] = this.V[opcode3] & 1;
                                    this.V[opcode2] = (this.V[opcode3] >> 1) & 0xFF;
                                }
                                else {
                                    this.V[0xF] = this.V[opcode2] & 1;
                                    this.V[opcode2] = (this.V[opcode2] >> 1) & 0xFF;
                                }

                                break;
                            }

                        case (0x7):
                            {
                                //8xy7 - SUBN Vx, Vy
                                //Set Vx = Vy - Vx, set VF = NOT borrow.
                                //If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.

                                if (this.V[opcode3] >= this.V[opcode2])
                                    this.V[0xF] = 1;
                                else
                                    this.V[0xF] = 0;

                                this.V[opcode2] = (this.V[opcode3] - this.V[opcode2]) & 0xff;

                                break;
                            }

                        case (0xe):
                            {
                                //8xyE - SHL Vx {, Vy}
                                //Set Vx = Vx SHL 1. <---------------------- THIS IS NOT CORRECT
                                //If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.


                                //Store the value of register VY shifted left one bit in register VX
                                //Set register VF to the most significant bit prior to the shift

                                if (!this.alt8xy6Opcode && this.emulationMode === EmulationModes.Chip8) {
                                    this.V[0xf] = this.V[opcode3] >> 7;
                                    this.V[opcode2] = (this.V[opcode3] << 1) & 0xFF;
                                }
                                else {
                                    this.V[0xf] = this.V[opcode2] >> 7;
                                    this.V[opcode2] = (this.V[opcode2] << 1) & 0xFF;
                                }

                                break;
                            }
                        default:
                            this.UnknownOpcode(currentOpcode);
                            break;
                    }
                    break;
                }

            case (0x9):
                {
                    if (opcode4 === 0) {
                        //9xy0 - SNE Vx, Vy
                        //Skip next instruction if Vx != Vy.
                        //The values of Vx and Vy are compared, and if they are not equal, the program counter is increased by 2.

                        if (this.V[opcode2] !== this.V[opcode3]) this.PC += 2;
                    }
                    else {
                        this.UnknownOpcode(currentOpcode);
                    }

                    break;
                }

            case (0xa):
                {
                    //Annn - LD I, addr
                    //Set I = nnn.
                    //The value of register I is set to nnn.

                    this.I = currentOpcode & 0xFFF;
                    break;
                }

            case (0xb):
                {
                    //Bnnn - JP V0, addr
                    //Jump to location nnn + V0.
                    //The program counter is set to nnn plus the value of V0.

                    this.PC = (currentOpcode & 0xFFF) + this.V[0];
                    break;
                }
            case (0xc):
                {
                    //Cxkk - RND Vx, byte
                    //Set Vx = random byte AND kk.
                    //The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk.
                    //The results are stored in Vx. See instruction 8xy2 for more information on AND.

                    this.V[opcode2] = Math.floor(Math.random() * 256) & (currentOpcode & 0xFF);
                    break;
                }

            case (0xd):
                {
                    //Dxyn - DRW Vx, Vy, nibble
                    //Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
                    //The interpreter reads n bytes from memory, starting at the address stored in I.
                    //These bytes are then displayed as sprites on screen at coordinates (Vx, Vy). Sprites are XORed onto the existing screen.
                    //If this causes any pixels to be erased, VF is set to 1, otherwise it is set to 0.
                    //If the sprite is positioned so part of it is outside the coordinates of the display, it wraps around to the opposite side of the screen.
                    //See instruction 8xy3 for more information on XOR, and section 2.4, Display, for more information on the Chip-8 screen and sprites.

                    this.Draw(this.V[opcode2], this.V[opcode3], opcode4);

                    break;
                }

            case (0xe):
                {
                    switch (currentOpcode & 0xFF) {
                        case (0x9e):
                            {
                                //Ex9E - SKP Vx
                                //Skip next instruction if key with the value of Vx is pressed.
                                //Checks the keyboard, and if the key corresponding to the value of Vx is currently in the down position, PC is increased by 2.

                                if (this.input.currentKeyState[this.V[opcode2]] === InputStates.KeyDown) this.PC += 2;
                                break;
                            }

                        case (0xa1):
                            {
                                //ExA1 - SKNP Vx
                                //Skip next instruction if key with the value of Vx is not pressed.
                                //Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.

                                if (this.input.currentKeyState[this.V[opcode2]] !== InputStates.KeyDown) this.PC += 2;
                                break;
                            }

                        default:
                            this.UnknownOpcode(currentOpcode);
                            break;
                    }
                    break;
                }

            case (0xf):
                {
                    switch (currentOpcode & 0xFF) {
                        case (0x07):
                            {
                                //Fx07 - LD Vx, DT
                                //Set Vx = delay timer value.
                                //The value of DT is placed into Vx.

                                this.V[opcode2] = this.delayTimer;
                                break;
                            }

                        case (0x0a):
                            {
                                //Fx0A - LD Vx, K
                                //Wait for a key press, store the value of the key in Vx.
                                //All execution stops until a key is pressed, then the value of that key is stored in Vx.
                                //Chip8 Wait for key release. SCHip, wait for key press.

                                let pressed = false;

                                if (this.emulationMode == EmulationModes.Chip8) {
                                    for (let k = 0; k < KEYS_LENGTH; k++) {
                                        if (this.input.currentKeyState[k] === InputStates.KeyReleased) {
                                            this.V[opcode2] = k;
                                            pressed = true;
                                            break;
                                        }
                                    }
                                }
                                else {
                                    for (let k = 0; k < KEYS_LENGTH; k++) {
                                        if (this.input.currentKeyState[k] === InputStates.KeyDown) {
                                            this.V[opcode2] = k;
                                            pressed = true;
                                        }
                                    }
                                }

                                if (!pressed) this.PC -= 2;

                                break;
                            }

                        case (0x15):
                            {
                                //Fx15 - LD DT, Vx
                                //Set delay timer = Vx.
                                //DT is set equal to the value of Vx.

                                this.delayTimer = this.V[opcode2];
                                break;
                            }

                        case (0x18):
                            {
                                //Fx18 - LD ST, Vx
                                //Set sound timer = Vx.
                                //ST is set equal to the value of Vx.

                                this.SetSoundTimer(this.V[opcode2]);
                                break;
                            }

                        case (0x1e):
                            {
                                //Fx1E - ADD I, Vx
                                //Set I = I + Vx.
                                //The values of I and Vx are added, and the results are stored in I.

                                this.I = (this.I + this.V[opcode2]) & 0xFFF;

                                // Test ROM "SCTEST" states that if I = I + Vx generates an overflow,
                                // Vf should be set to 1, 0 otherwise. That's apparently incorrect.
                                // However, the game Spacefight 2091 needs that feature.
                                // TODO: That should probably be added as an alternate opcode setting

                                // this.I += this.V[opcode2];

                                // if (this.I > 0xFFF)
                                //     this.V[0xF] = 1;
                                // else
                                //     this.V[0xF] = 0;

                                break;
                            }

                        case (0x29):
                            {
                                //Fx29 - LD F, Vx
                                //Set I = location of sprite for digit Vx.
                                //The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx.
                                //See section 2.4, Display, for more information on the Chip-8 hexadecimal font..

                                this.I = (this.V[opcode2] & 0xF) * 5;
                                break;
                            }

                        case (0x30):
                            {
                                //Fx30 - LD F, Vx
                                //Set I = location of sprite for digit Vx.
                                //The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx.
                                //Versión para SChip.

                                this.I = ((this.V[opcode2] & 0xF) * 10) + 80;
                                break;
                            }

                        case (0x33):
                            {
                                //Fx33 - LD B, Vx
                                //Store BCD representation of Vx in memory locations I, I+1, and I+2.
                                //The interpreter takes the decimal value of Vx, and places the hundreds digit in memory at location in I,
                                //the tens digit at location I+1, and the ones digit at location I+2.

                                // Bitwise OR 0 is an efficient way to remove the decimal part after the division
                                this.memory.RAM[this.I + 0] = ((this.V[opcode2] / 100) | 0) % 10;
                                this.memory.RAM[this.I + 1] = ((this.V[opcode2] / 10) | 0) % 10;
                                this.memory.RAM[this.I + 2] = this.V[opcode2] % 10;

                                break;
                            }

                        case (0x55):
                            {
                                //Fx55 - LD [I], Vx
                                //Store registers V0 through Vx in memory starting at location I.
                                //The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.
                                //When done, I=I+X+1. Solo en Chip8

                                for (let n = 0; n <= opcode2; n++) {
                                    this.memory.RAM[this.I + n] = this.V[n];
                                }

                                if (!this.altFx55Opcode)
                                    if (this.emulationMode === EmulationModes.Chip8) this.I += opcode2 + 1;

                                break;
                            }

                        case (0x65):
                            {
                                //Fx65 - LD Vx, [I]
                                //Read registers V0 through Vx from memory starting at location I.
                                //The interpreter reads values from memory starting at location I into registers V0 through Vx.
                                //When done, I=I+X+1. Solo en Chip8

                                for (let n = 0; n <= opcode2; n++) {
                                    this.V[n] = this.memory.RAM[this.I + n];
                                }

                                if (!this.altFx55Opcode)
                                    if (this.emulationMode === EmulationModes.Chip8) this.I += opcode2 + 1;

                                break;
                            }
                        case (0x75):
                            {
                                //Fx75: Save V0...VX (X<8) in the HP48 flags 

                                for (let n = 0; n <= opcode2; n++) {
                                    this.HP48[n] = this.V[n];
                                }

                                break;
                            }
                        case (0x85):
                            {
                                //Fx85: Load V0...VX (X<8) from the HP48 flags

                                for (let n = 0; n <= opcode2; n++) {
                                    this.V[n] = this.HP48[n];
                                }

                                break;
                            }
                        default:
                            this.UnknownOpcode(currentOpcode);
                            break;
                    }
                    break;
                }
        }
    }

    private Draw(x: number, y: number, size: number): void {
        this.V[0xF] = 0;

        let width: number;
        let height: number;

        if (this.emulationMode === EmulationModes.Chip8) {
            x &= (RES_X >> 1) - 1;
            y &= (RES_Y >> 1) - 1;

            // Chip8 always draws sprites with 8 pixels wide
            width = 8;
            // size === 0 means that it's a SuperChip sprite; set it to 16 pixels high.
            // size > 0 means that it's a normal sprite; set it to size pixels high.
            height = size > 0 ? size : 16;
        }
        else {
            x &= RES_X - 1;
            y &= RES_Y - 1;

            // size === 0 means that it's a SuperChip sprite; set it to 16 pixels wide.
            // size > 0 means that it's a normal sprite; set it to 8 pixels wide.
            width = size > 0 ? 8 : 16;
            // size === 0 means that it's a SuperChip sprite; set it to 16 pixels high.
            // size > 0 means that it's a normal sprite; set it to size pixels high.
            height = size > 0 ? size : 16;
        }

        if (this.emulationMode === EmulationModes.Chip8) {
            for (let h = 0; h < height; h++) {
                let line = this.memory.RAM[this.I + h];

                for (let w = 0; w < width; w++) {
                    let px: number = (x + w) << 1;
                    let py: number = (y + h) << 1;

                    if (((line << w) & 0x80) === 0x80) {
                        if (px < RES_X && py < RES_Y) { // Check that the pixel is not drawn out of the screen
                            if (this.memory.GetPixel(px, py) === 1) this.V[0xF] = 1;

                            this.memory.SetPixel(px + 0, py + 0);
                            this.memory.SetPixel(px + 1, py + 0);
                            this.memory.SetPixel(px + 0, py + 1);
                            this.memory.SetPixel(px + 1, py + 1);
                        }
                    }
                }
            }
        }
        else {
            // If size === 0, it's a SuperChip sprite, so each line will be two bytes. One byte otherwise.
            // Each byte contains a line of 8 pixels.
            let bytes: number = size > 0 ? 1 : 2;

            for (let h = 0; h < height; h++) {
                for (let b = 0; b < bytes; b++) {
                    let line = this.memory.RAM[this.I + (h * bytes) + b];

                    for (let w = 0; w < width; w++) {
                        let px: number = x + w + (8 * b);
                        let py: number = y + h;

                        if (((line << w) & 0x80) === 0x80) {
                            if (px < RES_X && py < RES_Y) { // Check that the pixel is not drawn out of the screen
                                if (this.memory.GetPixel(px, py) === 1) this.V[0xF] = 1;
                                this.memory.SetPixel(px, py);
                            }
                        }
                    }
                }
            }
        }

        this.SendVRAM();
    }

    private DecrementTimers(): void {
        if (this.delayTimer > 0) this.delayTimer--;
        if (this.soundTimer > 0) this.soundTimer--;
        else this.chip8.SendCommand({ id: Chip8CommandIDs.StopSound });
    }

    private SetSoundTimer(time: number): void {
        this.soundTimer = time;
        if (time > 0) this.chip8.SendCommand({ id: Chip8CommandIDs.PlaySound });
    }

    private ChangeMode(mode: EmulationModes): void {
        this.emulationMode = mode;
        this.memory.ClearVRAM();
    }

    private SendVRAM(): void {
        this.waitForRender = true;
        this.chip8.SendCommand({ id: Chip8CommandIDs.SendVRAM, parameters: [this.memory.VRAM] });
    }

    private UnknownOpcode(currentOpcode: number): void {
        console.error(`Unknown Opcode: 0x${Number(currentOpcode).toString(16)} at RAM: 0x${Number(this.PC - 0x2).toString(16)}, ROM: 0x${Number(this.PC - 0x202).toString(16)}`);
        this.finishCallback();
    }
}