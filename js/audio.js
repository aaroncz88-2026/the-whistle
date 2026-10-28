(function () {
  const bus = {
    ctx: null,
    master: null,
    muted: false,

    ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 1;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.crowd();
      return this.ctx;
    },

    toggle() {
      this.ensure();
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 1;
      return !this.muted;
    },

    env(gain, t, peak, dur) {
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    },

    tone(freq, t, dur, peak, type) {
      const ctx = this.ctx;
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      this.env(g, t, peak, dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },

    whistle() {
      if (!this.ensure()) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(1650, t);
      o.frequency.linearRampToValueAtTime(3050, t + 0.11);
      o.frequency.linearRampToValueAtTime(2300, t + 0.46);
      this.env(g, t, 0.06, 0.5);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + 0.52);
      this.tone(2800, t + 0.16, 0.22, 0.035, "sine");
      this.roar();
    },

    advantage() {
      if (!this.ensure()) return;
      const t = this.ctx.currentTime;
      this.tone(880, t, 0.09, 0.04, "triangle");
      this.tone(1320, t + 0.1, 0.12, 0.045, "triangle");
    },

    tick() {
      if (!this.ensure()) return;
      this.tone(1800, this.ctx.currentTime, 0.04, 0.02, "square");
    },

    thud() {
      if (!this.ensure()) return;
      const t = this.ctx.currentTime;
      const ctx = this.ctx;
      const frames = Math.floor(ctx.sampleRate * 0.18);
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();
      src.buffer = buffer;
      filter.type = "lowpass";
      filter.frequency.value = 240;
      this.env(g, t, 0.12, 0.18);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.master);
      src.start(t);
      this.tone(180, t, 0.12, 0.05, "sine");
    },

    crowd() {
      if (!this.ctx || this.crowdGain) return;
      const ctx = this.ctx;
      const seconds = 3.2;
      const frames = Math.floor(ctx.sampleRate * seconds);
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let wash = 0;
      const edge = Math.floor(ctx.sampleRate * 0.06);
      for (let i = 0; i < frames; i++) {
        const white = Math.random() * 2 - 1;
        wash = wash * 0.97 + white * 0.03;
        const beat = (i / ctx.sampleRate) % 0.46;
        const shout = beat < 0.2 ? 1.15 : 0.42;
        let sample = wash * shout * 8;
        if (i < edge) sample *= i / edge;
        if (i > frames - edge) sample *= (frames - i) / edge;
        data[i] = sample;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const high = ctx.createBiquadFilter();
      high.type = "highpass";
      high.frequency.value = 220;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 740;
      band.Q.value = 0.65;
      const bed = ctx.createGain();
      bed.gain.value = 0.16;
      const react = ctx.createGain();
      react.gain.value = 1;
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 0.07;
      depth.gain.value = 0.035;
      lfo.connect(depth);
      depth.connect(bed.gain);
      src.connect(high);
      high.connect(band);
      band.connect(bed);
      bed.connect(react);
      react.connect(this.master);
      src.start();
      lfo.start();
      this.crowdGain = react;
    },

    roar() {
      if (!this.crowdGain || !this.ctx) return;
      const gain = this.crowdGain.gain;
      const t = this.ctx.currentTime;
      gain.cancelScheduledValues(t);
      gain.setValueAtTime(Math.max(0.2, gain.value), t);
      gain.linearRampToValueAtTime(1.8, t + 0.12);
      gain.linearRampToValueAtTime(1, t + 1.6);
    },
  };

  window.AudioBus = bus;
})();
