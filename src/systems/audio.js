/**
 * Stackr Quest — Audio Engine
 *
 * Manages all audio playback: SFX (sprite-based) and BGM (per-world loops).
 * Built on Howler.js for cross-browser Web Audio support.
 *
 * Features:
 * - SFX sprite sheet: one Howl, many sounds
 * - BGM per world theme + menu + boss tracks
 * - Volume controls (SFX / Music separate)
 * - Mute toggle
 * - Respects user preference (persisted in progress.js settings)
 * - Graceful degradation when audio isn't available
 *
 * Usage:
 *   import { audio } from './systems/audio.js';
 *   audio.playSfx('lock');
 *   audio.playBgm('menu');
 *   audio.setMusicVolume(0.5);
 */

import { Howl, Howler } from 'howler';

// ─── SFX definitions ─────────────────────────────────────────────────
// We use Web Audio oscillators for SFX to avoid needing audio files.
// This keeps the project self-contained with zero external assets.

/** @type {AudioContext|null} */
let _ctx = null;

function getAudioCtx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (autoplay policy)
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

// ─── Synthesized SFX ─────────────────────────────────────────────────

const SFX_DEFS = {
  // Piece move — subtle tick/click
  move: { type: 'square', freq: 600, dur: 0.03, vol: 0.08 },
  // Rotate — short whip
  rotate: { type: 'sawtooth', freq: 800, dur: 0.06, vol: 0.1, slide: 1200 },
  // Piece lock — thud
  lock: { type: 'sine', freq: 150, dur: 0.1, vol: 0.15 },
  // Soft drop — whoosh
  softdrop: { type: 'sawtooth', freq: 400, dur: 0.05, vol: 0.06, slide: 200 },
  // Hard drop — slam
  harddrop: { type: 'square', freq: 100, dur: 0.15, vol: 0.2, noise: true },
  // Line clear — ascending chime
  clear1: { type: 'sine', freq: 523, dur: 0.15, vol: 0.15 },
  clear2: { type: 'sine', freq: 659, dur: 0.18, vol: 0.18 },
  clear3: { type: 'sine', freq: 784, dur: 0.22, vol: 0.2 },
  clear4: { type: 'sine', freq: 1047, dur: 0.3, vol: 0.25, slide: 1200 },
  // Combo — escalating pitch (play with pitch modifier)
  combo: { type: 'triangle', freq: 700, dur: 0.1, vol: 0.12 },
  // Level win — fanfare
  levelWin: { type: 'sine', freq: 523, dur: 0.5, vol: 0.2, arp: [523, 659, 784, 1047] },
  // Level fail — deflating
  levelFail: { type: 'sawtooth', freq: 400, dur: 0.4, vol: 0.15, slide: 100 },
  // UI tap
  uiTap: { type: 'sine', freq: 1000, dur: 0.04, vol: 0.08 },
  // Star earn — sparkle
  starEarn: { type: 'sine', freq: 1200, dur: 0.2, vol: 0.12, slide: 1800 },
  // Coin earn
  coinEarn: { type: 'square', freq: 988, dur: 0.08, vol: 0.1 },
  // Power-up activate
  powerup: { type: 'sawtooth', freq: 440, dur: 0.25, vol: 0.15, slide: 880 },
  // Boss attack
  bossAttack: { type: 'sawtooth', freq: 80, dur: 0.3, vol: 0.2, noise: true },
  // Boss defeat
  bossDefeat: { type: 'sine', freq: 440, dur: 0.6, vol: 0.2, arp: [440, 554, 659, 880, 1047] },
  // Hold
  hold: { type: 'triangle', freq: 500, dur: 0.06, vol: 0.08, slide: 700 },
};

/**
 * Play a synthesized SFX.
 * @param {string} name — key in SFX_DEFS
 * @param {object} [opts] — { pitchMult }
 */
function playSynthSfx(name, opts = {}) {
  const def = SFX_DEFS[name];
  if (!def) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (_muted || _sfxVol <= 0) return;

  const now = ctx.currentTime;
  const vol = def.vol * _sfxVol * (opts.volumeMult || 1);
  const pitchMult = opts.pitchMult || 1;

  if (def.arp) {
    // Arpeggio: play notes in sequence
    const noteLen = def.dur / def.arp.length;
    def.arp.forEach((freq, i) => {
      _playTone(ctx, {
        type: def.type,
        freq: freq * pitchMult,
        start: now + i * noteLen,
        dur: noteLen * 0.9,
        vol,
      });
    });
    return;
  }

  _playTone(ctx, {
    type: def.type,
    freq: def.freq * pitchMult,
    start: now,
    dur: def.dur,
    vol,
    slide: def.slide ? def.slide * pitchMult : 0,
    noise: def.noise,
  });
}

function _playTone(ctx, { type, freq, start, dur, vol, slide = 0, noise = false }) {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slide) {
    osc.frequency.exponentialRampToValueAtTime(slide, start + dur);
  }
  osc.connect(gain);
  osc.start(start);
  osc.stop(start + dur + 0.05);

  if (noise) {
    // Add noise burst
    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.5, start);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    noiseNode.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseNode.start(start);
    noiseNode.stop(start + dur + 0.05);
  }
}

// ─── BGM (synthesized loops) ─────────────────────────────────────────

/** @type {Howl|null} */
let _bgmHowl = null;
let _bgmId = null;
let _currentBgmTrack = null;

// Simple BGM: generate looping tones per theme
// In production these would be real audio files. For now we use
// Howler with generated buffers for a placeholder drone.

const BGM_THEMES = {
  menu: { baseFreq: 220, type: 'sine', vol: 0.06 },
  modern: { baseFreq: 165, type: 'sine', vol: 0.05 },
  gameboy: { baseFreq: 196, type: 'square', vol: 0.04 },
  deepsea: { baseFreq: 147, type: 'sine', vol: 0.05 },
  neon: { baseFreq: 185, type: 'triangle', vol: 0.05 },
  volcano: { baseFreq: 110, type: 'sawtooth', vol: 0.04 },
  vaporwave: { baseFreq: 233, type: 'sine', vol: 0.05 },
  storm: { baseFreq: 130, type: 'triangle', vol: 0.04 },
  arctic: { baseFreq: 262, type: 'sine', vol: 0.05 },
  cosmos: { baseFreq: 196, type: 'triangle', vol: 0.05 },
  nexus: { baseFreq: 175, type: 'sawtooth', vol: 0.04 },
  boss: { baseFreq: 98, type: 'sawtooth', vol: 0.06 },
};

/**
 * Generate a short WAV buffer for BGM loop.
 * Creates an ambient drone/pad sound.
 */
function generateBgmBuffer(theme) {
  const def = BGM_THEMES[theme] || BGM_THEMES.menu;
  const sampleRate = 44100;
  const duration = 4; // 4-second loop
  const samples = sampleRate * duration;
  const channels = 1;
  const buffer = new Float32Array(samples);

  const baseFreq = def.baseFreq;
  const fifth = baseFreq * 1.5;
  const octave = baseFreq * 2;

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    // Base tone
    let sample = Math.sin(2 * Math.PI * baseFreq * t) * 0.3;
    // Fifth
    sample += Math.sin(2 * Math.PI * fifth * t) * 0.15;
    // Octave (gentle)
    sample += Math.sin(2 * Math.PI * octave * t) * 0.1;
    // Slow tremolo
    sample *= 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.5 * t);
    // Fade in/out for smooth loop
    const fadeSamples = sampleRate * 0.1;
    if (i < fadeSamples) sample *= i / fadeSamples;
    if (i > samples - fadeSamples) sample *= (samples - i) / fadeSamples;

    buffer[i] = sample * def.vol;
  }

  return { buffer, sampleRate, channels, samples };
}

function createBgmWavBlob(theme) {
  const { buffer, sampleRate, samples } = generateBgmBuffer(theme);
  // Encode as WAV
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const dataSize = samples * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  // RIFF header
  writeStr(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' }));
}

function writeStr(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ─── State ───────────────────────────────────────────────────────────

let _sfxVol = 0.7;
let _musicVol = 0.4;
let _muted = false;
let _initialized = false;

// ─── Public API ──────────────────────────────────────────────────────

export const audio = {
  /**
   * Initialize audio system. Call once after user gesture.
   * Respects persisted settings.
   */
  init(settings = {}) {
    if (_initialized) return;
    _initialized = true;

    if (settings.soundEnabled === false) _muted = true;
    if (settings.musicEnabled === false) _musicVol = 0;

    // Unlock audio context on first user interaction
    const unlock = () => {
      getAudioCtx();
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  },

  /**
   * Play a sound effect.
   * @param {string} name — SFX name (key in SFX_DEFS)
   * @param {object} [opts] — { pitchMult, volumeMult }
   */
  playSfx(name, opts) {
    if (_muted) return;
    playSynthSfx(name, opts);
  },

  /**
   * Play line clear SFX based on count.
   * @param {number} lines — 1-4
   * @param {number} [combo] — current combo count for pitch scaling
   */
  playLineClear(lines, combo = 0) {
    if (_muted) return;
    const name = `clear${Math.min(lines, 4)}`;
    const pitchMult = combo > 1 ? 1 + (combo - 1) * 0.08 : 1;
    playSynthSfx(name, { pitchMult });
    if (combo > 1) {
      playSynthSfx('combo', { pitchMult: 1 + combo * 0.1 });
    }
  },

  /**
   * Play BGM for a theme.
   * @param {string} theme — 'menu', 'modern', 'boss', etc.
   */
  playBgm(theme) {
    if (_currentBgmTrack === theme) return;
    this.stopBgm();

    if (_muted || _musicVol <= 0) {
      _currentBgmTrack = theme;
      return;
    }

    try {
      const url = createBgmWavBlob(theme);
      _bgmHowl = new Howl({
        src: [url],
        loop: true,
        volume: _musicVol,
        format: ['wav'],
      });
      _bgmId = _bgmHowl.play();
      _currentBgmTrack = theme;
    } catch {
      // Audio not available
    }
  },

  /** Stop current BGM. */
  stopBgm() {
    if (_bgmHowl) {
      _bgmHowl.stop();
      _bgmHowl.unload();
      _bgmHowl = null;
      _bgmId = null;
    }
    _currentBgmTrack = null;
  },

  /** Pause BGM (e.g., when game pauses). */
  pauseBgm() {
    if (_bgmHowl && _bgmId !== null) _bgmHowl.pause(_bgmId);
  },

  /** Resume BGM after pause. */
  resumeBgm() {
    if (_bgmHowl && _bgmId !== null) _bgmHowl.play(_bgmId);
  },

  /** @param {number} vol — 0..1 */
  setSfxVolume(vol) {
    _sfxVol = Math.max(0, Math.min(1, vol));
  },

  /** @param {number} vol — 0..1 */
  setMusicVolume(vol) {
    _musicVol = Math.max(0, Math.min(1, vol));
    if (_bgmHowl) _bgmHowl.volume(_musicVol);
    Howler.volume(_musicVol);
  },

  /** Toggle global mute. */
  toggleMute() {
    _muted = !_muted;
    Howler.mute(_muted);
    if (_muted) {
      this.stopBgm();
    }
    return _muted;
  },

  /** @param {boolean} m */
  setMuted(m) {
    _muted = m;
    Howler.mute(_muted);
    if (_muted) this.stopBgm();
  },

  /** @returns {boolean} */
  isMuted() {
    return _muted;
  },

  /** @returns {{ sfxVol: number, musicVol: number, muted: boolean }} */
  getState() {
    return { sfxVol: _sfxVol, musicVol: _musicVol, muted: _muted };
  },

  /** Get the current BGM track name. */
  getCurrentBgm() {
    return _currentBgmTrack;
  },
};
