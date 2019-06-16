import { IDisposable } from "./interfaces";

export class Sound implements IDisposable {
    private audioContext: AudioContext;
    private oscillatorNode: OscillatorNode;
    private gainNode: GainNode;

    private IsSoundPlaying: boolean;

    constructor() {
        // Create web audio api context
        this.audioContext = new AudioContext();

        // Create nodes
        this.oscillatorNode = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        // Connect oscillator to gain node
        this.oscillatorNode.connect(this.gainNode);
        // Connect gain node to the speakers
        this.gainNode.connect(this.audioContext.destination);

        this.gainNode.gain.value = 0;
        this.oscillatorNode.type = "square";
        this.oscillatorNode.frequency.value = 440; // value in hertz

        this.oscillatorNode.start();

        this.IsSoundPlaying = false;
    }

    public Dispose(): void {
        this.oscillatorNode.stop();
        this.oscillatorNode.disconnect();
        this.gainNode.disconnect();
        this.audioContext.close();
    }

    public Play(): void {
        if (this.IsSoundPlaying) return;

        this.gainNode.gain.value = 0.075;
        this.IsSoundPlaying = true;
    }

    public Stop(): void {
        if (!this.IsSoundPlaying) return;

        this.gainNode.gain.value = 0;
        this.IsSoundPlaying = false;
    }
}