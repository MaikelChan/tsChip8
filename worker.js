!function(t){var e={};function i(s){if(e[s])return e[s].exports;var r=e[s]={i:s,l:!1,exports:{}};return t[s].call(r.exports,r,r.exports,i),r.l=!0,r.exports}i.m=t,i.c=e,i.d=function(t,e,s){i.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:s})},i.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},i.t=function(t,e){if(1&e&&(t=i(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var s=Object.create(null);if(i.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var r in t)i.d(s,r,function(e){return t[e]}.bind(null,r));return s},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=0)}([function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});const s=i(1),r=i(2),h=i(3);e.RES_X=128,e.RES_Y=64,e.ASPECT_RATIO=e.RES_X/e.RES_Y,e.RAM_SIZE=4096,e.ROM_START_ADDRESS=512,e.REGISTERS_SIZE=16,e.HP48_REGISTERS_SIZE=8,e.STACK_SIZE=16,e.FRAME_LENGTH=1e3/60,e.KEYS_LENGTH=16;class a{constructor(){this.FinishLoading=t=>{let e=t.target;if(e.readyState===e.DONE){let t=e.result;this.Run(new Uint8Array(t))}else console.error(`Loading ROM Error: ${t}`),this.SetEmulationState(0)},this.InitializeWorker=()=>{this.worker.addEventListener("message",this.ReceiveCommand)},this.SendCommand=t=>{this.worker.postMessage(t)},this.ReceiveCommand=t=>{let e=t.data;switch(e.id){case 0:if(void 0===e.parameters)break;let t=e.parameters[0];this.Initialize(t,e.parameters[1]);break;case 1:this.Stop();break;case 2:if(void 0===e.parameters)break;this.SetSettings(e.parameters[0],e.parameters[1]);break;case 3:if(void 0===e.parameters)break;this.SetInputKey(e.parameters[0],e.parameters[1]);break;default:console.error("Unknown command")}},this.worker=self,this.emulationState=0,this.InitializeWorker()}get EmulationState(){return this.emulationState}Initialize(t,e){if(0!==this.emulationState)return;this.initialSettings=e,this.SetEmulationState(1);let i=new FileReader;i.readAsArrayBuffer(t),i.addEventListener("loadend",this.FinishLoading)}Run(t){this.memory=new r.Memory(t),this.input=new h.Input,this.cpu=new s.CPU(()=>this.Stop(),this,this.memory,this.input,this.initialSettings.alt8xy6Opcode,this.initialSettings.altFx55Opcode),this.cpu.Run(),this.SetEmulationState(2)}Stop(){2===this.emulationState&&(this.cpu.Stop(),this.SetEmulationState(0),this.memory=void 0,this.input=void 0,this.cpu=void 0)}SetSettings(t,e){2===this.emulationState&&this.cpu.SetSettings(t,e)}SetInputKey(t,e){2===this.emulationState&&this.input.SetInputKey(t,e)}SetEmulationState(t){this.emulationState!==t&&(this.emulationState=t,this.SendCommand({id:0,parameters:[t]}))}}e.Chip8=a;new a},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});const s=i(0);e.CPU=class{constructor(t,e,i,r,h,a){this.Update=()=>{this.waitForRender=!1;for(let t=0;t<1024;t++){if(!this.isRunning)return;if(this.waitForRender)break;this.ProcessOpcodes(),this.input.Update()}this.DecrementTimers()},this.finishCallback=t,this.chip8=e,this.memory=i,this.input=r,this.alt8xy6Opcode=h,this.altFx55Opcode=a,this.V=new Uint8Array(s.REGISTERS_SIZE),this.HP48=new Uint8Array(s.HP48_REGISTERS_SIZE),this.Stack=new Uint16Array(s.STACK_SIZE),this.PC=s.ROM_START_ADDRESS,this.SP=0,this.I=0,this.delayTimer=0,this.soundTimer=0;for(let t=0;t<s.REGISTERS_SIZE;t++)this.V[t]=0;for(let t=0;t<s.HP48_REGISTERS_SIZE;t++)this.HP48[t]=0;for(let t=0;t<s.STACK_SIZE;t++)this.Stack[t]=0;this.emulationMode=0,this.isRunning=!1,this.waitForRender=!1}Run(){this.isRunning||(this.isRunning=!0,this.intervalLoop=setInterval(this.Update,s.FRAME_LENGTH))}Stop(){this.isRunning&&(clearInterval(this.intervalLoop),this.isRunning=!1,this.memory.ClearVRAM(),this.SendVRAM())}SetSettings(t,e){this.alt8xy6Opcode=t,this.altFx55Opcode=e}ProcessOpcodes(){let t=this.memory.RAM[this.PC]<<8|this.memory.RAM[this.PC+1],e=(61440&t)>>12,i=(3840&t)>>8,r=(240&t)>>4,h=15&t;switch(this.PC+=2,e){case 0:switch(t){case 224:this.memory.ClearVRAM(),this.SendVRAM();break;case 238:this.SP--,this.PC=this.Stack[this.SP];break;case 251:for(let t=0;t<s.RES_Y;t++){for(let e=s.RES_X-4-1;e>=0;e--)this.memory.VRAM[this.GetXY(e+4,t)]=this.memory.VRAM[this.GetXY(e,t)];for(let e=0;e<4;e++)this.memory.VRAM[this.GetXY(e,t)]=0}this.SendVRAM();break;case 252:for(let t=0;t<s.RES_Y;t++){for(let e=4;e<s.RES_X;e++)this.memory.VRAM[this.GetXY(e-4,t)]=this.memory.VRAM[this.GetXY(e,t)];for(let e=s.RES_X-4;e<s.RES_X;e++)this.memory.VRAM[this.GetXY(e,t)]=0}this.SendVRAM();break;case 253:this.finishCallback();break;case 254:this.ChangeMode(0),this.SendVRAM();break;case 255:this.ChangeMode(1),this.SendVRAM();break;default:if(12===r){for(let t=0;t<s.RES_X;t++){for(let e=s.RES_Y-h-1;e>=0;e--)this.memory.VRAM[this.GetXY(t,e+h)]=this.memory.VRAM[this.GetXY(t,e)];for(let e=0;e<h;e++)this.memory.VRAM[this.GetXY(t,e)]=0}this.SendVRAM()}else 0!==i||this.UnknownOpcode(t)}break;case 1:this.PC=4095&t;break;case 2:this.Stack[this.SP]=this.PC,this.SP++,this.PC=4095&t;break;case 3:this.V[i]===(255&t)&&(this.PC+=2);break;case 4:this.V[i]!==(255&t)&&(this.PC+=2);break;case 5:0===h?this.V[i]===this.V[r]&&(this.PC+=2):this.UnknownOpcode(t);break;case 6:this.V[i]=255&t;break;case 7:this.V[i]=this.V[i]+t&255;break;case 8:switch(h){case 0:this.V[i]=this.V[r];break;case 1:this.V[i]|=this.V[r];break;case 2:this.V[i]&=this.V[r];break;case 3:this.V[i]^=this.V[r];break;case 4:{let t=this.V[i]+this.V[r];this.V[15]=t>255?1:0,this.V[i]=255&t;break}case 5:this.V[i]>=this.V[r]?this.V[15]=1:this.V[15]=0,this.V[i]=this.V[i]-this.V[r]&255;break;case 6:this.alt8xy6Opcode||0!==this.emulationMode?(this.V[15]=1&this.V[i],this.V[i]=this.V[i]>>1&255):(this.V[15]=1&this.V[r],this.V[i]=this.V[r]>>1&255);break;case 7:this.V[r]>=this.V[i]?this.V[15]=1:this.V[15]=0,this.V[i]=this.V[r]-this.V[i]&255;break;case 14:this.alt8xy6Opcode||0!==this.emulationMode?(this.V[15]=this.V[i]>>7,this.V[i]=this.V[i]<<1&255):(this.V[15]=this.V[r]>>7,this.V[i]=this.V[r]<<1&255);break;default:this.UnknownOpcode(t)}break;case 9:0===h?this.V[i]!==this.V[r]&&(this.PC+=2):this.UnknownOpcode(t);break;case 10:this.I=4095&t;break;case 11:this.PC=(4095&t)+this.V[0];break;case 12:this.V[i]=255&Math.floor(256*Math.random())&t;break;case 13:this.Draw(this.V[i],this.V[r],h);break;case 14:switch(255&t){case 158:1===this.input.currentKeyState[this.V[i]]&&(this.PC+=2);break;case 161:1!==this.input.currentKeyState[this.V[i]]&&(this.PC+=2);break;default:this.UnknownOpcode(t)}break;case 15:switch(255&t){case 7:this.V[i]=this.delayTimer;break;case 10:{let t=!1;if(0==this.emulationMode){for(let e=0;e<s.KEYS_LENGTH;e++)if(2===this.input.currentKeyState[e]){this.V[i]=e,t=!0;break}}else for(let e=0;e<s.KEYS_LENGTH;e++)1===this.input.currentKeyState[e]&&(this.V[i]=e,t=!0);t||(this.PC-=2);break}case 21:this.delayTimer=this.V[i];break;case 24:this.SetSoundTimer(this.V[i]);break;case 30:this.I=this.I+this.V[i]&4095;break;case 41:this.I=5*(15&this.V[i]);break;case 48:this.I=10*(15&this.V[i])+80;break;case 51:{let t="00"+this.V[i];this.memory.RAM[this.I]=parseInt(t.substr(t.length-3,1)),this.memory.RAM[this.I+1]=parseInt(t.substr(t.length-2,1)),this.memory.RAM[this.I+2]=parseInt(t.substr(t.length-1,1));break}case 85:for(let t=0;t<=i;t++)this.memory.RAM[this.I+t]=this.V[t];this.altFx55Opcode||0===this.emulationMode&&(this.I+=i+1);break;case 101:for(let t=0;t<=i;t++)this.V[t]=this.memory.RAM[this.I+t];this.altFx55Opcode||0===this.emulationMode&&(this.I+=i+1);break;case 117:for(let t=0;t<=i;t++)this.HP48[t]=this.V[t];break;case 133:for(let t=0;t<=i;t++)this.V[t]=this.HP48[t];break;default:this.UnknownOpcode(t)}}}Draw(t,e,i){let r,h;if(this.V[15]=0,0===this.emulationMode?(t&=(s.RES_X>>1)-1,e&=(s.RES_Y>>1)-1,r=8,h=i>0?i:16):(t&=s.RES_X-1,e&=s.RES_Y-1,r=i>0?8:16,h=i>0?i:16),0===this.emulationMode)for(let i=0;i<h;i++){let h=this.memory.RAM[this.I+i];for(let a=0;a<r;a++){let r=t+a<<1,n=e+i<<1;128==(h<<a&128)&&r<s.RES_X&&n<s.RES_Y&&(1===this.memory.VRAM[this.GetXY(r,n)]&&(this.V[15]=1),this.memory.VRAM[this.GetXY(r+0,n+0)]^=1,this.memory.VRAM[this.GetXY(r+1,n+0)]^=1,this.memory.VRAM[this.GetXY(r+0,n+1)]^=1,this.memory.VRAM[this.GetXY(r+1,n+1)]^=1)}}else{let a=i>0?1:2;for(let i=0;i<h;i++)for(let h=0;h<a;h++){let n=this.memory.RAM[this.I+i*a+h];for(let a=0;a<r;a++){let r=t+a+8*h,o=e+i;128==(n<<a&128)&&r<s.RES_X&&o<s.RES_Y&&(1===this.memory.VRAM[this.GetXY(r,o)]&&(this.V[15]=1),this.memory.VRAM[this.GetXY(r,o)]^=1)}}}this.SendVRAM()}DecrementTimers(){this.delayTimer>0&&this.delayTimer--,this.soundTimer>0?this.soundTimer--:this.chip8.SendCommand({id:3})}SetSoundTimer(t){this.soundTimer=t,t>0&&this.chip8.SendCommand({id:2})}ChangeMode(t){this.emulationMode=t,this.memory.ClearVRAM()}SendVRAM(){this.waitForRender=!0,this.chip8.SendCommand({id:1,parameters:[this.memory.VRAM]})}GetXY(t,e){return s.RES_X*e+t}UnknownOpcode(t){console.error(`Unknown Opcode: 0x${Number(t).toString(16)} at RAM: 0x${Number(this.PC-2).toString(16)}, ROM: 0x${Number(this.PC-514).toString(16)}`),this.finishCallback()}}},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});const s=i(0),r=new Uint8Array([240,144,144,144,240,32,96,32,32,112,96,144,32,64,240,240,16,240,16,240,144,144,240,16,16,240,128,96,16,224,240,128,240,144,240,240,16,16,16,16,240,144,240,144,240,240,144,240,16,16,96,144,240,144,144,224,144,224,144,224,112,128,128,128,112,224,144,144,144,224,240,128,240,128,240,240,128,240,128,128]),h=new Uint8Array([24,60,102,102,102,102,102,102,60,24,12,28,60,12,12,12,12,12,62,62,60,126,102,6,14,28,56,112,126,126,60,126,102,6,28,30,6,102,126,60,12,28,28,60,44,110,126,12,12,30,126,126,96,96,124,62,6,102,124,56,28,60,112,96,124,102,102,102,60,24,126,126,6,6,12,28,56,48,48,48,24,60,102,102,60,126,102,102,126,60,60,126,102,102,102,62,6,14,60,56,24,24,60,36,36,102,126,102,102,102,124,126,102,102,124,126,102,102,126,124,28,62,118,96,96,96,96,118,62,28,124,126,102,102,102,102,102,102,126,124,126,126,96,96,124,124,96,96,126,126,126,126,96,96,124,124,96,96,96,96]);e.Memory=class{constructor(t){this.RAM=new Uint8Array(s.RAM_SIZE),this.VRAM=new Uint8Array(s.RES_X*s.RES_Y),this.ClearRAM(),this.ClearVRAM(),this.LoadFontsInRAM(),this.LoadROMInRAM(t)}ClearVRAM(){let t=s.RES_X*s.RES_Y;for(let e=0;e<t;e++)this.VRAM[e]=0}LoadROMInRAM(t){for(let e=0;e<t.length;e++)this.RAM[s.ROM_START_ADDRESS+e]=t[e]}ClearRAM(){for(let t=0;t<s.RAM_SIZE;t++)this.RAM[t]=0}LoadFontsInRAM(){for(let t=0;t<80;t++)this.RAM[t]=r[t];for(let t=0;t<160;t++)this.RAM[t+80]=h[t]}}},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});const s=i(0);e.Input=class{constructor(){this.currentKeyState=new Array(s.KEYS_LENGTH),this.lastKeyState=new Array(s.KEYS_LENGTH);for(let t=0;t<s.KEYS_LENGTH;t++)this.currentKeyState[t]=0,this.lastKeyState[t]=0}Update(){for(let t=0;t<s.KEYS_LENGTH;t++)1===this.lastKeyState[t]&&0===this.currentKeyState[t]?this.currentKeyState[t]=2:2===this.currentKeyState[t]&&(this.currentKeyState[t]=0),this.lastKeyState[t]=this.currentKeyState[t]}SetInputKey(t,e){this.currentKeyState[t]=e}}}]);