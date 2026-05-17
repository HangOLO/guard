export function createAudio({ state }) {
  let context;
  let masterGain;

  function ensureContext() {
    if (context || !window.AudioContext && !window.webkitAudioContext) {
      return context;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    context = new AudioContextClass();
    masterGain = context.createGain();
    masterGain.gain.value = 0.16;
    masterGain.connect(context.destination);
    return context;
  }

  function resume() {
    const audioContext = ensureContext();
    if (audioContext?.state === "suspended") {
      audioContext.resume();
    }
  }

  function tone(frequency, duration, options = {}) {
    if (!state.soundEnabled) {
      return;
    }

    const audioContext = ensureContext();
    if (!audioContext || audioContext.state === "closed") {
      return;
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    if (options.slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(options.slideTo, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(options.volume || 0.24, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  return {
    resume,
    play(name) {
      if (!state.soundEnabled) {
        return;
      }

      switch (name) {
        case "start":
          tone(260, 0.1, { type: "triangle" });
          tone(390, 0.12, { type: "triangle", volume: 0.18 });
          break;
        case "contact":
          tone(180, 0.16, { type: "sawtooth", volume: 0.1 });
          break;
        case "dialogue":
          tone(520, 0.045, { type: "square", volume: 0.08 });
          break;
        case "startRun":
          tone(330, 0.08, { type: "triangle" });
          tone(495, 0.08, { type: "triangle", volume: 0.18 });
          break;
        case "jump":
          tone(420, 0.16, { type: "triangle", slideTo: 760 });
          break;
        case "duck":
          tone(160, 0.08, { type: "triangle", volume: 0.12 });
          break;
        case "score":
          tone(740, 0.07, { type: "square", volume: 0.11 });
          break;
        case "hit":
          tone(120, 0.32, { type: "sawtooth", slideTo: 58, volume: 0.19 });
          break;
        case "toggle":
          tone(600, 0.07, { type: "triangle", volume: 0.12 });
          break;
        default:
          break;
      }
    },
  };
}
