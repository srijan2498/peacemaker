/**
 * CozyNest Enhanced Procedural Audio Engine
 * Ethereal, meditative, and peaceful sound generator for:
 * - 🧘 Meditation & Yoga (Tibetan Singing Bowls, 528Hz Solfeggio, Zen Garden, Sacred Om)
 * - 📚 Study & Focus (10Hz Binaural Alpha Waves, Lo-Fi Piano, Library Sanctuary, Flow Drone)
 * - 🌙 Deep Sleep (2Hz Binaural Delta Waves, Velvet Brown Noise, Night Rain, Music Box)
 * - 🌸 Calm & Relaxation (Peaceful Ambient Piano, Whispering Pines, Twilight Ocean Waves, Flowing Stream)
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private activeGenerators: Map<string, { gain: GainNode; stop: () => void }> = new Map();
  private activeStreams: Map<string, { audio: HTMLAudioElement; baseVolume: number }> = new Map();
  private masterGain: GainNode | null = null;
  private masterVolumeLevel: number = 0.75;
  public isInitialized = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.setValueAtTime(this.masterVolumeLevel, this.ctx.currentTime);
      this.isInitialized = true;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(volume: number) {
    this.initContext();
    this.masterVolumeLevel = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolumeLevel, this.ctx.currentTime, 0.05);
    }
    this.activeStreams.forEach(stream => {
      stream.audio.volume = Math.max(0, Math.min(1, stream.baseVolume * this.masterVolumeLevel));
    });
  }

  public fadeOutAndStop(durationSeconds: number = 3, onComplete?: () => void) {
    const stepInterval = 100;
    const steps = (durationSeconds * 1000) / stepInterval;
    let currentStep = 0;
    const initialStreamVolumes = new Map<string, number>();
    this.activeStreams.forEach((stream, id) => {
      initialStreamVolumes.set(id, stream.audio.volume);
    });

    const streamFadeInterval = setInterval(() => {
      currentStep++;
      const factor = Math.max(0, 1 - (currentStep / steps));
      this.activeStreams.forEach((stream, id) => {
        const initVol = initialStreamVolumes.get(id) || stream.audio.volume;
        stream.audio.volume = Math.max(0, initVol * factor);
      });
      if (currentStep >= steps) {
        clearInterval(streamFadeInterval);
      }
    }, stepInterval);

    if (this.masterGain && this.ctx) {
      const currTime = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, currTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, currTime + durationSeconds);
    }

    setTimeout(() => {
      this.stopAll();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.masterVolumeLevel, this.ctx.currentTime);
      }
      if (onComplete) onComplete();
    }, durationSeconds * 1000);
  }

  public playStream(id: string, audioUrl: string, volume: number = 0.7) {
    this.initContext();
    this.stopStream(id);

    try {
      const audio = new Audio();
      audio.src = audioUrl;
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = Math.max(0, Math.min(1, volume * this.masterVolumeLevel));

      audio.play().catch(err => {
        console.warn('Jamendo stream autoplay deferred or blocked:', err);
      });

      this.activeStreams.set(id, { audio, baseVolume: volume });
    } catch (err) {
      console.error('Failed to initialize stream audio:', err);
    }
  }

  public stopStream(id: string) {
    const stream = this.activeStreams.get(id);
    if (stream) {
      try {
        stream.audio.pause();
        stream.audio.src = '';
      } catch (e) {}
      this.activeStreams.delete(id);
    }
  }

  public setStreamVolume(id: string, volume: number) {
    const stream = this.activeStreams.get(id);
    if (stream) {
      stream.baseVolume = Math.max(0, Math.min(1, volume));
      stream.audio.volume = Math.max(0, Math.min(1, stream.baseVolume * this.masterVolumeLevel));
    }
  }

  public playSound(id: string, soundType: string, volume: number = 0.7) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.activeGenerators.has(id)) {
      this.setTrackVolume(id, volume);
      return;
    }

    const trackGain = this.ctx.createGain();
    trackGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    trackGain.connect(this.masterGain);

    const stopFn = this.createGenerator(soundType, trackGain);
    this.activeGenerators.set(id, { gain: trackGain, stop: stopFn });
  }

  public setTrackVolume(id: string, volume: number) {
    if (this.activeStreams.has(id)) {
      this.setStreamVolume(id, volume);
      return;
    }
    const item = this.activeGenerators.get(id);
    if (item && this.ctx) {
      const clamped = Math.max(0, Math.min(1, volume));
      item.gain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
    }
  }

  public stopSound(id: string) {
    this.stopStream(id);
    const item = this.activeGenerators.get(id);
    if (item) {
      try {
        item.stop();
        item.gain.disconnect();
      } catch (e) {}
      this.activeGenerators.delete(id);
    }
  }

  public stopAll() {
    this.activeStreams.forEach(stream => {
      try {
        stream.audio.pause();
        stream.audio.src = '';
      } catch (e) {}
    });
    this.activeStreams.clear();

    this.activeGenerators.forEach(item => {
      try {
        item.stop();
        item.gain.disconnect();
      } catch (e) {}
    });
    this.activeGenerators.clear();
  }

  private createGenerator(type: string, destination: GainNode): () => void {
    if (!this.ctx) return () => {};

    switch (type) {
      case 'singing_bowl':
        return this.createTibetanBowls(destination, 432);
      case 'solfeggio_528':
        return this.createTibetanBowls(destination, 528);
      case 'om_drone':
        return this.createOmDrone(destination);
      case 'zen':
        return this.createZenGarden(destination);
      case 'binaural_alpha':
        return this.createBinauralBeats(destination, 216, 10); // 10Hz Alpha focus
      case 'binaural_delta':
        return this.createBinauralBeats(destination, 108, 2);  // 2Hz Delta sleep
      case 'ambient_piano':
        return this.createAmbientPiano(destination);
      case 'rhodes_chill':
        return this.createRhodesChill(destination);
      case 'rain':
        return this.createGentleRain(destination);
      case 'waves':
        return this.createOceanWaves(destination);
      case 'brown_noise':
        return this.createVelvetNoise(destination, 'brown');
      case 'wind':
        return this.createWhisperingWind(destination);
      case 'music_box':
        return this.createMusicBox(destination);
      case 'library':
      case 'focus_drone':
      case 'river':
      default:
        return this.createAmbientFlow(destination, type);
    }
  }

  /**
   * 🧘 Tibetan Singing Bowls (432Hz & 528Hz Solfeggio)
   * Authentic multi-harmonic acoustic singing bowl with phase tremolo & long ethereal decay.
   */
  private createTibetanBowls(dest: GainNode, fundamentalHz: number): () => void {
    if (!this.ctx) return () => {};
    // Acoustic bowl partials: Fundamental, 2.76x, 5.4x, 8.9x
    const partialRatios = [1.0, 2.76, 5.4, 8.9];

    const playStrike = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const strikeGain = this.ctx.createGain();
      strikeGain.connect(dest);

      partialRatios.forEach((ratio, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const pGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamentalHz * ratio, now);

        // Subtle slow beating tremolo (acoustic interference)
        const tremolo = this.ctx.createOscillator();
        const tremoloGain = this.ctx.createGain();
        tremolo.frequency.setValueAtTime(0.12 * (idx + 1), now);
        tremoloGain.gain.setValueAtTime(0.015, now);
        tremolo.connect(tremoloGain);
        tremoloGain.connect(pGain.gain);

        const amp = 0.12 / (idx * 1.5 + 1);
        pGain.gain.setValueAtTime(amp, now);
        pGain.gain.exponentialRampToValueAtTime(0.00001, now + 8.5);

        osc.connect(pGain);
        pGain.connect(strikeGain);

        osc.start(now);
        tremolo.start(now);
        osc.stop(now + 8.5);
        tremolo.stop(now + 8.5);
      });
    };

    // Play initial strike immediately, then gentle strikes every 9 seconds
    playStrike();
    const interval = setInterval(playStrike, 9000);

    return () => clearInterval(interval);
  }

  /**
   * 🕉️ Sacred Om Drone with vocal overtone resonance (Yoga & Meditation)
   */
  private createOmDrone(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    const rootHz = 108; // Sacred 108Hz harmonic
    const harmonics = [1, 1.5, 2, 3, 4];
    const oscs: OscillatorNode[] = [];

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.connect(dest);

    harmonics.forEach(h => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(rootHz * h, this.ctx.currentTime);
      g.gain.setValueAtTime(0.06 / h, this.ctx.currentTime);

      osc.connect(g);
      g.connect(filter);
      osc.start();
      oscs.push(osc);
    });

    return () => {
      oscs.forEach(o => {
        try { o.stop(); } catch (e) {}
      });
    };
  }

  /**
   * 🎹 Peaceful Ambient Piano
   * Generates slow, serene, beautiful acoustic piano chords with warm reverb.
   */
  private createAmbientPiano(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    // Consonant peaceful chords: Cmaj9, Am9, Fmaj7#11, Em9, Gsus2
    const peacefulChords = [
      [261.63, 329.63, 392.0, 493.88, 587.33], // Cmaj9
      [220.0, 261.63, 329.63, 392.0, 493.88],  // Am9
      [174.61, 261.63, 329.63, 369.99, 440.0], // Fmaj7#11
      [164.81, 246.94, 293.66, 329.63, 392.0], // Em7
      [196.0, 293.66, 329.63, 392.0, 440.0]   // Gsus2
    ];
    let chordIndex = 0;

    const playChord = () => {
      if (!this.ctx) return;
      const chord = peacefulChords[chordIndex];
      chordIndex = (chordIndex + 1) % peacefulChords.length;
      const now = this.ctx.currentTime;

      chord.forEach((freq, noteIdx) => {
        if (!this.ctx) return;
        const noteTime = now + noteIdx * 0.18; // Gentle rolled chord
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        // Dual sine + triangle for acoustic piano body
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        // Soft piano envelope: quick attack, long gentle singing decay
        noteGain.gain.setValueAtTime(0.0001, noteTime);
        noteGain.gain.exponentialRampToValueAtTime(0.06, noteTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.00001, noteTime + 6.0);

        osc.connect(noteGain);
        noteGain.connect(dest);

        osc.start(noteTime);
        osc.stop(noteTime + 6.0);
      });
    };

    playChord();
    const interval = setInterval(playChord, 5500);

    return () => clearInterval(interval);
  }

  /**
   * ☕ Lo-Fi / Warm Fender Rhodes Electric Piano Chords (Study & Focus)
   */
  private createRhodesChill(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    const rhodesChords = [
      [261.63, 329.63, 392.0, 523.25], // Cmaj7
      [220.0, 261.63, 349.23, 440.0],  // F/A
      [196.0, 246.94, 293.66, 392.0],  // G
      [220.0, 261.63, 329.63, 440.0]   // Am7
    ];
    let idx = 0;

    const playRhodes = () => {
      if (!this.ctx) return;
      const notes = rhodesChords[idx];
      idx = (idx + 1) % rhodesChords.length;
      const now = this.ctx.currentTime;

      notes.forEach((f, i) => {
        if (!this.ctx) return;
        const carrier = this.ctx.createOscillator();
        const modulator = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const noteGain = this.ctx.createGain();

        // FM bell tone synthesis
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(f, now);
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(f * 2, now); // 2nd harmonic bell tine

        modGain.gain.setValueAtTime(f * 0.5, now);
        modGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        noteGain.gain.setValueAtTime(0.05, now + i * 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.00001, now + 5.0);

        carrier.connect(noteGain);
        noteGain.connect(dest);

        carrier.start(now + i * 0.08);
        modulator.start(now + i * 0.08);
        carrier.stop(now + 5.0);
        modulator.stop(now + 5.0);
      });
    };

    playRhodes();
    const interval = setInterval(playRhodes, 5000);

    return () => clearInterval(interval);
  }

  /**
   * 🧠 Binaural Beat Generator
   * Generates true stereophonic frequency offset (10Hz Alpha for Focus or 2Hz Delta for Sleep)
   */
  private createBinauralBeats(dest: GainNode, baseHz: number, beatHz: number): () => void {
    if (!this.ctx) return () => {};
    // Left ear oscillator
    const oscLeft = this.ctx.createOscillator();
    const panLeft = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const gainLeft = this.ctx.createGain();

    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseHz, this.ctx.currentTime);
    gainLeft.gain.setValueAtTime(0.08, this.ctx.currentTime);

    // Right ear oscillator offset by beatHz
    const oscRight = this.ctx.createOscillator();
    const panRight = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const gainRight = this.ctx.createGain();

    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(baseHz + beatHz, this.ctx.currentTime);
    gainRight.gain.setValueAtTime(0.08, this.ctx.currentTime);

    if (panLeft && panRight) {
      panLeft.pan.setValueAtTime(-0.9, this.ctx.currentTime);
      panRight.pan.setValueAtTime(0.9, this.ctx.currentTime);
      oscLeft.connect(gainLeft);
      gainLeft.connect(panLeft);
      panLeft.connect(dest);

      oscRight.connect(gainRight);
      gainRight.connect(panRight);
      panRight.connect(dest);
    } else {
      oscLeft.connect(gainLeft);
      gainLeft.connect(dest);
      oscRight.connect(gainRight);
      gainRight.connect(dest);
    }

    // Warm sub-drone foundation
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(baseHz / 2, this.ctx.currentTime);
    subGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(dest);

    oscLeft.start();
    oscRight.start();
    subOsc.start();

    return () => {
      try {
        oscLeft.stop();
        oscRight.stop();
        subOsc.stop();
      } catch (e) {}
    };
  }

  /**
   * 🎋 Zen Bamboo Garden & Soft Water Trickle
   */
  private createZenGarden(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    // Soft stream noise
    const stopStream = this.createVelvetNoise(dest, 'brown', 0.04);

    // Occasional gentle bamboo water chime
    const scale = [432, 540, 648, 864];
    const chimeInterval = setInterval(() => {
      if (!this.ctx) return;
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      g.gain.setValueAtTime(0.06, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.0);

      osc.connect(g);
      g.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 3.0);
    }, 3800);

    return () => {
      clearInterval(chimeInterval);
      stopStream();
    };
  }

  /**
   * 🌧️ Gentle Night Rain on Window (Soft multi-stage low-pass pink noise, zero harshness)
   */
  private createGentleRain(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.18;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    // Warm 450Hz low-pass filter (velvety soft rain, completely removes harsh high hiss)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, this.ctx.currentTime);

    rainSource.connect(filter);
    filter.connect(dest);
    rainSource.start();

    return () => {
      try {
        rainSource.stop();
        rainSource.disconnect();
      } catch (e) {}
    };
  }

  /**
   * 🌊 Twilight Ocean Waves (10-second slow tidal swells)
   */
  private createOceanWaves(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    // 10-second wave swell LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(dest);

    noise.start();
    lfo.start();

    return () => {
      try {
        noise.stop();
        lfo.stop();
      } catch (e) {}
    };
  }

  /**
   * 🛌 Velvet Brown Noise for Sleep (Warm deep low-frequency rumble)
   */
  private createVelvetNoise(dest: GainNode, kind: 'brown' | 'pink' = 'brown', gainVol = 0.35): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.2 * gainVol;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Additional warmth filter
    const warmFilter = this.ctx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

    source.connect(warmFilter);
    warmFilter.connect(dest);
    source.start();

    return () => {
      try {
        source.stop();
      } catch (e) {}
    };
  }

  /**
   * 🍃 Whispering Wind in Pines
   */
  private createWhisperingWind(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.18;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, this.ctx.currentTime);
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(dest);

    noise.start();
    lfo.start();

    return () => {
      try {
        noise.stop();
        lfo.stop();
      } catch (e) {}
    };
  }

  /**
   * 🧸 Celestial Music Box Lullaby
   */
  private createMusicBox(dest: GainNode): () => void {
    if (!this.ctx) return () => {};
    // Pentatonic celestial lullaby notes
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const interval = setInterval(() => {
      if (!this.ctx) return;
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      g.gain.setValueAtTime(0.08, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.5);

      osc.connect(g);
      g.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 2.5);
    }, 850);

    return () => clearInterval(interval);
  }

  /**
   * ✨ Flow State / Library Ambient Resonance
   */
  private createAmbientFlow(dest: GainNode, _subtype: string): () => void {
    if (!this.ctx) return () => {};
    const padFreqs = [216, 324, 432, 540];
    const oscs: OscillatorNode[] = [];

    padFreqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      g.gain.setValueAtTime(0.035 / (idx + 1), this.ctx.currentTime);

      osc.connect(g);
      g.connect(dest);
      osc.start();
      oscs.push(osc);
    });

    return () => {
      oscs.forEach(o => {
        try { o.stop(); } catch (e) {}
      });
    };
  }
}

export const audioEngine = new AudioEngine();
