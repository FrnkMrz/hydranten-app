/**
 * Plays a success sound using Web Audio API
 * Simple "Ding" / Chime
 */
export function playSuccessSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        // Oscillator 1 (Main Tone)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        // Oscillator 2 (Harmonic/Chime)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        const now = ctx.currentTime;

        // Setup Tone 1 (High C -> Higher C)
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6

        // Setup Tone 2 (E5)
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, now); // E5
        osc2.frequency.linearRampToValueAtTime(1318.5, now + 0.1); // E6

        // Envelope 1
        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        // Envelope 2
        gain2.gain.setValueAtTime(0.05, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        // Play
        osc1.start(now);
        osc1.stop(now + 0.8);
        osc2.start(now);
        osc2.stop(now + 0.8);

    } catch (e) {
        console.warn("Could not play success sound", e);
    }
}
