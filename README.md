# tsChip8

tsChip8 is an accurate Chip8 and SuperChip emulator written in TypeScript and rendered with WebGL.

You can test it here: [tsChip8](https://maikelchan.github.io/tsChip8/) 

## About this project

This is a rewrite of an old Chip8 and SuperChip emulator I did around 2012 in C#. My main motivations for doing this are:
- Get more familiar with JavaScript and TypeScript. I code mainly in C# and the last time I did some web / JavaScript stuff was before all these packages and build systems were common. So there was quite a lot to learn there.
- Take the opportunity to do something with WebGL by using [three.js](https://threejs.org/).
- Learn about web workers. CPU emulation is executed in a web worker in order to have rendering and emulation in different threads and have a more responsive application. That's in theory. In practice however, I'm sure that this is not needed at all to run such a simple emulator and it's probably a bit detrimental. But hey, it's for learning purposes and it works fine anyway!
- Implement sound with realtime square waves generated with the AudioContext API.

## About Chip8 and my original project

> [CHIP-8](https://en.wikipedia.org/wiki/CHIP-8) is an interpreted programming language, developed by Joseph Weisbecker. It was initially used on the COSMAC VIP and Telmac 1800 8-bit microcomputers in the mid-1970s. CHIP-8 programs are run on a CHIP-8 virtual machine. It was made to allow video games to be more easily programmed for these computers.

I love emulation, so back in 2012 I wanted to do my first emulator, and Chip8 seemed ideal for beginners. So I learned how the language works and I coded an emulator in C#. After that, I didn't want to stop there. I didn't want to have my emulator to run a couple of games and that's it. I wanted it to be compatible with all of them, and also support SuperChip games.

> CHIP-8 has a descendant called [SCHIP (Super Chip)](https://en.wikipedia.org/wiki/CHIP-8#CHIP-8_today), introduced by Erik Bryntse. In 1990, a CHIP-8 interpreter called CHIP-48 was made for HP-48 graphing calculators so that games could be programmed more easily. Its extensions to CHIP-8 are what became known as SCHIP. It features a larger resolution and several additional opcodes meant to make programming easier.

This complicated things a bit because, besides the extended capabilities of the SuperChip, Chip8 games can also work differently in a SuperChip capable device.

Back in the day, there was also a lack of proper documentation of some features from Chip8, so that didn't help either, since this also affected to some games that were programmed incorrectly. So even if a Chip8 emulator implements the specs right, it will fail to execute correctly those games, and they will only work on emulators that implement those specs also wrong.

So after much investigation, I figured out what the actual behaviour of the Chip8 should be, and implemented some user configurable settings that will allow the user to play those problematic games by emulating those specs wrong on purpose.

## Features

- Full Chip8 and SuperChip compatibility.
- Settings that allow to simulate wrong behaviours in order to execute problematic games.
- Four rendering modes that can be switched at any time:
    1. WebGL: The game is shown in some kind of led screen in a virtual 3D environment, that features some realtime lighting and a screen refresh rate shader effect. Because why not!
    2. WebGL-Voxel: Similar to the WebGL renderer but the screen is rendered with GPU instanced voxels.
    3. Canvas: The game will be rendered into a 2D canvas.
    4. ASCII: The game will be rendered with text characters. Easy to implement since the Chip8 and SuperChip are monochrome.
- All rendering modes allow to customize rendering colors.
- Sound is also emulated. Chip8 has very basic sound capabilities. It's only capable to reproduce a "beep" sound of configurable duration.
- It includes a bunch of public domain ROMs for you to play and test, and also a simple game made by myself called LOL Hunt.

## How to play

Right now, you will need to load a Chip8 or SuperChip from your PC. It would be nice to include several ROMs, but I need to check I'm allowed to do that.

The Chip8 / SuperChip key pad is mapped to the following keyboard keys (the inputs depend on each game):

    1 2 3 4
    Q W E R
    A S D F
    Z X C V

## Screenshots

![Screenshot 00](/00.jpg)
![Screenshot 00](/01.jpg)
![Screenshot 00](/02.jpg)
![Screenshot 00](/03.jpg)