/**
 * Stackr Quest — Audio Engine v2
 *
 * Rich synthesized SFX + procedural per-world BGM.
 * Zero external audio files — everything generated via Tone.js + Web Audio.
 *
 * SFX: Layered FM synthesis, filtered noise, ADSR envelopes, reverb.
 * BGM: Per-world chord progressions, arpeggios, bass lines, pads, drums.
 *
 * Usage:
 *   import { audio } from './systems/audio.js';
 *   audio.init(settings);
 *   audio.playSfx('lock');
 *   audio.playLineClear(3, 2);
 *   audio.playBgm('deepsea');
 */

import * as Tone from 'tone';

// ─── State ───────────────────────────────────────────────────────────

let _sfxVol = 0.7;
let _musicVol = 0.4;
let _muted = false;
let _initialized = false;
let _toneStarted = false;
let _pendingBgm = null;  // queued BGM theme awaiting first user gesture

// ─── Shared Effects Chain ────────────────────────────────────────────

/** Reverb for SFX (short, punchy). */
let _sfxReverb = null;
/** Limiter before master out. */
let _sfxLimiter = null;

function ensureSfxChain() {
  if (_sfxReverb) return;
  _sfxReverb = new Tone.Reverb({ decay: 0.6, wet: 0.15 }).toDestination();
  _sfxLimiter = new Tone.Limiter(-3).connect(_sfxReverb);
}

async function ensureTone() {
  // Always resume if context was suspended (mobile background, tab switch, etc.)
  if (_toneStarted) {
    if (Tone.context.state !== 'running') {
      try { await Tone.context.resume(); } catch { /* ignore */ }
    }
    return Tone.context.state === 'running';
  }
  try {
    await Tone.start();
    _toneStarted = true;
    return true;
  } catch {
    return false;
  }
}

// ─── SFX: Rich Synthesized Sounds ────────────────────────────────────

/**
 * Play a piece-move click.
 * Layered: short noise tick + filtered square blip.
 */
function sfxMove() {
  ensureSfxChain();
  const vol = -24 + (_sfxVol - 0.7) * 20;

  // Tick — filtered noise burst
  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
    volume: vol - 4,
  }).connect(_sfxLimiter);

  // Blip
  const blip = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 },
    volume: vol - 8,
  }).connect(_sfxLimiter);

  noise.triggerAttackRelease('16n');
  blip.triggerAttackRelease('C6', '32n');
  setTimeout(() => { noise.dispose(); blip.dispose(); }, 200);
}

/**
 * Piece rotate — FM "whip" with filter sweep.
 */
function sfxRotate() {
  ensureSfxChain();
  const vol = -20 + (_sfxVol - 0.7) * 20;

  const synth = new Tone.FMSynth({
    harmonicity: 3.5,
    modulationIndex: 8,
    oscillator: { type: 'sine' },
    modulation: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
    modulationEnvelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.03 },
    volume: vol,
  }).connect(_sfxLimiter);

  const filter = new Tone.AutoFilter({
    frequency: '8n', baseFrequency: 800, octaves: 3,
  }).connect(_sfxLimiter).start();
  synth.connect(filter);

  synth.triggerAttackRelease('G5', '32n');
  setTimeout(() => { synth.dispose(); filter.dispose(); }, 300);
}

/**
 * Piece lock — satisfying "thunk" with sub-bass thud + noise.
 */
function sfxLock() {
  ensureSfxChain();
  const vol = -16 + (_sfxVol - 0.7) * 20;

  // Sub thud
  const sub = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
    volume: vol,
  }).connect(_sfxLimiter);

  // Noise crunch
  const crunch = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.03 },
    volume: vol - 6,
  }).connect(_sfxLimiter);

  sub.triggerAttackRelease('C2', '16n');
  crunch.triggerAttackRelease('32n');
  setTimeout(() => { sub.dispose(); crunch.dispose(); }, 300);
}

/**
 * Hard drop — heavy slam. Membrane + noise + distorted pluck.
 */
function sfxHardDrop() {
  ensureSfxChain();
  const vol = -12 + (_sfxVol - 0.7) * 20;

  const membrane = new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
    volume: vol,
  }).connect(_sfxLimiter);

  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
    volume: vol - 3,
  }).connect(_sfxLimiter);

  const dist = new Tone.Distortion(0.4).connect(_sfxLimiter);
  const pluck = new Tone.PluckSynth({ volume: vol - 6 }).connect(dist);

  membrane.triggerAttackRelease('C1', '8n');
  noise.triggerAttackRelease('16n');
  pluck.triggerAttackRelease('G1');
  setTimeout(() => { membrane.dispose(); noise.dispose(); pluck.dispose(); dist.dispose(); }, 500);
}

/**
 * Line clear — ascending chime. More lines = richer chord.
 * Each line adds a harmony note, like Candy Crush match escalation.
 */
function sfxLineClear(lines) {
  ensureSfxChain();
  const vol = -16 + (_sfxVol - 0.7) * 20;

  // Musical scale notes — C major pentatonic for pleasant sound
  const scaleNotes = [
    ['C5'],                       // 1 line
    ['C5', 'E5'],                 // 2 lines
    ['C5', 'E5', 'G5'],          // 3 lines
    ['C5', 'E5', 'G5', 'C6'],    // 4 lines (Tetris!)
  ];
  const notes = scaleNotes[Math.min(lines, 4) - 1];

  // Shimmer synth — detuned oscillators for chorus effect
  notes.forEach((note, i) => {
    const delay = i * 0.06; // stagger for arpeggio effect
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.25 + lines * 0.05, sustain: 0.1, release: 0.3 },
      volume: vol + lines * 1.5,
    }).connect(_sfxLimiter);

    // Detune for richness
    const detuneSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.25 },
      volume: vol - 6,
      detune: 7,
    }).connect(_sfxLimiter);

    setTimeout(() => {
      synth.triggerAttackRelease([note], 0.2 + lines * 0.05);
      detuneSynth.triggerAttackRelease(note, 0.15);
    }, delay * 1000);

    setTimeout(() => { synth.dispose(); detuneSynth.dispose(); }, 800 + lines * 100);
  });

  // Sparkle noise on top
  if (lines >= 2) {
    const shimmer = new Tone.MetalSynth({
      frequency: 800 + lines * 200,
      envelope: { attack: 0.001, decay: 0.15, release: 0.1 },
      harmonicity: 5.1,
      modulationIndex: 16,
      resonance: 4000 + lines * 500,
      octaves: 1.5,
      volume: vol - 10,
    }).connect(_sfxLimiter);
    shimmer.triggerAttackRelease('32n');
    setTimeout(() => shimmer.dispose(), 400);
  }
}

/**
 * Combo sound — plays a note from an ascending scale.
 * Higher combo = higher pitch, like Candy Crush chain reactions.
 */
function sfxCombo(comboCount) {
  ensureSfxChain();
  const vol = -18 + (_sfxVol - 0.7) * 20;

  // C major scale ascending — clamp at 2 octaves
  const comboScale = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'];
  const noteIdx = Math.min(comboCount - 1, comboScale.length - 1);

  const synth = new Tone.FMSynth({
    harmonicity: 2,
    modulationIndex: 4,
    oscillator: { type: 'sine' },
    modulation: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.12, sustain: 0.05, release: 0.15 },
    modulationEnvelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.1 },
    volume: vol + Math.min(comboCount, 6),
  }).connect(_sfxLimiter);

  synth.triggerAttackRelease(comboScale[noteIdx], '16n');
  setTimeout(() => synth.dispose(), 400);
}

/**
 * Level win — triumphant fanfare with chord arpeggio.
 */
function sfxLevelWin() {
  ensureSfxChain();
  const vol = -14 + (_sfxVol - 0.7) * 20;

  const fanfare = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'];
  const noteLen = 0.08;

  fanfare.forEach((note, i) => {
    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.3 - i * 0.02, sustain: 0.15, release: 0.4 },
      volume: vol + i * 0.5,
    }).connect(_sfxLimiter);

    const bell = new Tone.FMSynth({
      harmonicity: 4,
      modulationIndex: 2,
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.3 },
      volume: vol - 8,
    }).connect(_sfxLimiter);

    setTimeout(() => {
      synth.triggerAttackRelease(note, 0.2);
      bell.triggerAttackRelease(note, 0.15);
    }, i * noteLen * 1000);

    setTimeout(() => { synth.dispose(); bell.dispose(); }, 1500);
  });

  // Cymbal shimmer at the end
  setTimeout(() => {
    const cymbal = new Tone.MetalSynth({
      frequency: 300,
      envelope: { attack: 0.001, decay: 0.4, release: 0.3 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 5000,
      octaves: 1.5,
      volume: vol - 8,
    }).connect(_sfxLimiter);
    cymbal.triggerAttackRelease('8n');
    setTimeout(() => cymbal.dispose(), 800);
  }, fanfare.length * noteLen * 1000);
}

/**
 * Level fail — descending sad tones.
 */
function sfxLevelFail() {
  ensureSfxChain();
  const vol = -16 + (_sfxVol - 0.7) * 20;

  const notes = ['E4', 'C4', 'A3', 'F3'];
  notes.forEach((note, i) => {
    const synth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.25, sustain: 0.1, release: 0.3 },
      volume: vol - i * 2,
    }).connect(_sfxLimiter);

    const lpFilter = new Tone.Filter({
      frequency: 2000 - i * 400,
      type: 'lowpass',
      rolloff: -12,
    }).connect(_sfxLimiter);
    synth.connect(lpFilter);

    setTimeout(() => {
      synth.triggerAttackRelease(note, 0.2);
    }, i * 120);
    setTimeout(() => { synth.dispose(); lpFilter.dispose(); }, 800);
  });
}

/**
 * Life loss — a dramatic "heart-breaking" sound.
 * Short painful sting: chromatic descent + glass break noise + sub-thud.
 */
function sfxLifeLoss() {
  ensureSfxChain();
  const vol = -14 + (_sfxVol - 0.7) * 20;

  // Chromatic descent — minor second intervals for pain
  const painNotes = ['E5', 'Eb5', 'D5', 'C#5'];
  painNotes.forEach((note, i) => {
    const synth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.002, decay: 0.08, sustain: 0, release: 0.06 },
      volume: vol - 4 - i * 2,
    }).connect(_sfxLimiter);
    setTimeout(() => synth.triggerAttackRelease(note, '32n'), i * 50);
    setTimeout(() => synth.dispose(), i * 50 + 200);
  });

  // Glass shatter noise
  setTimeout(() => {
    const shatter = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
      volume: vol - 6,
    }).connect(_sfxLimiter);
    shatter.triggerAttackRelease('16n');
    setTimeout(() => shatter.dispose(), 300);
  }, 150);

  // Sub thud — gut punch
  setTimeout(() => {
    const thud = new Tone.MembraneSynth({
      pitchDecay: 0.03,
      octaves: 3,
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      volume: vol - 2,
    }).connect(_sfxLimiter);
    thud.triggerAttackRelease('F1', '16n');
    setTimeout(() => thud.dispose(), 300);
  }, 200);
}

/**
 * Game over — all lives gone. Ominous & final.
 * Descending tritone doom chord + rumble + reverse cymbal feel.
 */
function sfxGameOver() {
  ensureSfxChain();
  const vol = -10 + (_sfxVol - 0.7) * 20;

  // Doom chord — tritone (the "devil's interval") for dread
  const doomChord = ['E3', 'Bb3', 'E4', 'Bb4'];
  const doom = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.8, sustain: 0.2, release: 1.0 },
    volume: vol - 4,
  }).connect(_sfxLimiter);

  const doomFilter = new Tone.Filter({
    frequency: 3000,
    type: 'lowpass',
    rolloff: -12,
  }).connect(_sfxLimiter);
  doom.connect(doomFilter);
  doom.triggerAttackRelease(doomChord, 0.8);

  // Sweep filter down for "closing" feel
  doomFilter.frequency.rampTo(200, 1.0);

  // Deep rumble
  const rumble = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.1, decay: 0.7, sustain: 0, release: 0.3 },
    volume: vol - 2,
  }).connect(_sfxLimiter);
  rumble.triggerAttackRelease('4n');

  // Heavy sub hit
  const subHit = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
    volume: vol,
  }).connect(_sfxLimiter);
  subHit.triggerAttackRelease('C1', '4n');

  // Descending metallic toll — funeral bell
  setTimeout(() => {
    const bell = new Tone.MetalSynth({
      frequency: 120,
      envelope: { attack: 0.001, decay: 0.6, release: 0.4 },
      harmonicity: 3,
      modulationIndex: 16,
      resonance: 2000,
      octaves: 1,
      volume: vol - 8,
    }).connect(_sfxLimiter);
    bell.triggerAttackRelease('8n');
    setTimeout(() => bell.dispose(), 1000);
  }, 300);

  setTimeout(() => { doom.dispose(); doomFilter.dispose(); rumble.dispose(); subHit.dispose(); }, 2000);
}

/**
 * UI tap — clean, clicky.
 */
function sfxUiTap() {
  ensureSfxChain();
  const vol = -22 + (_sfxVol - 0.7) * 20;

  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
    volume: vol,
  }).connect(_sfxLimiter);

  synth.triggerAttackRelease('A5', '64n');
  setTimeout(() => synth.dispose(), 150);
}

/**
 * Star earn — bright sparkle arpeggio.
 */
function sfxStarEarn() {
  ensureSfxChain();
  const vol = -16 + (_sfxVol - 0.7) * 20;

  const notes = ['E6', 'G6', 'B6', 'E7'];
  notes.forEach((note, i) => {
    const synth = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 6,
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.05, release: 0.2 },
      volume: vol,
    }).connect(_sfxLimiter);
    setTimeout(() => synth.triggerAttackRelease(note, '32n'), i * 50);
    setTimeout(() => synth.dispose(), 400);
  });
}

/**
 * Coin earn — classic coin "pling".
 */
function sfxCoinEarn() {
  ensureSfxChain();
  const vol = -18 + (_sfxVol - 0.7) * 20;

  const synth = new Tone.FMSynth({
    harmonicity: 5,
    modulationIndex: 10,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
    volume: vol,
  }).connect(_sfxLimiter);
  const synth2 = new Tone.FMSynth({
    harmonicity: 5,
    modulationIndex: 10,
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
    volume: vol - 4,
  }).connect(_sfxLimiter);

  synth.triggerAttackRelease('B5', '32n');
  setTimeout(() => synth2.triggerAttackRelease('E6', '32n'), 60);
  setTimeout(() => { synth.dispose(); synth2.dispose(); }, 300);
}

/**
 * Power-up activate — rising whoosh with shimmer.
 */
function sfxPowerup() {
  ensureSfxChain();
  const vol = -14 + (_sfxVol - 0.7) * 20;

  const synth = new Tone.FMSynth({
    harmonicity: 2,
    modulationIndex: 12,
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.2 },
    modulationEnvelope: { attack: 0.02, decay: 0.15, sustain: 0, release: 0.1 },
    volume: vol,
  }).connect(_sfxLimiter);

  const shimmer = new Tone.MetalSynth({
    frequency: 600,
    envelope: { attack: 0.01, decay: 0.2, release: 0.15 },
    volume: vol - 8,
  }).connect(_sfxLimiter);

  synth.triggerAttackRelease('C4', '8n');
  setTimeout(() => synth.triggerAttackRelease('C5', '16n'), 100);
  shimmer.triggerAttackRelease('16n');
  setTimeout(() => { synth.dispose(); shimmer.dispose(); }, 600);
}

/**
 * Boss attack — menacing low rumble.
 */
function sfxBossAttack() {
  ensureSfxChain();
  const vol = -12 + (_sfxVol - 0.7) * 20;

  const membrane = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
    volume: vol,
  }).connect(_sfxLimiter);

  const noise = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.01, decay: 0.25, sustain: 0, release: 0.15 },
    volume: vol - 4,
  }).connect(_sfxLimiter);

  const dist = new Tone.Distortion(0.6).connect(_sfxLimiter);
  const metal = new Tone.MetalSynth({
    frequency: 60,
    envelope: { attack: 0.01, decay: 0.2, release: 0.1 },
    harmonicity: 2,
    modulationIndex: 20,
    volume: vol - 6,
  }).connect(dist);

  membrane.triggerAttackRelease('E1', '8n');
  noise.triggerAttackRelease('8n');
  metal.triggerAttackRelease('16n');
  setTimeout(() => { membrane.dispose(); noise.dispose(); metal.dispose(); dist.dispose(); }, 600);
}

/**
 * Boss defeat — epic triumphant explosion.
 */
function sfxBossDefeat() {
  ensureSfxChain();
  const vol = -12 + (_sfxVol - 0.7) * 20;

  // Ascending power chord
  const chord = ['C4', 'G4', 'C5', 'E5', 'G5', 'C6'];
  chord.forEach((note, i) => {
    const synth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.4 - i * 0.03, sustain: 0.1, release: 0.5 },
      volume: vol - 4 + i,
    }).connect(_sfxLimiter);

    setTimeout(() => synth.triggerAttackRelease(note, 0.3), i * 70);
    setTimeout(() => synth.dispose(), 1500);
  });

  // Cymbal crash
  setTimeout(() => {
    const crash = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.6, release: 0.4 },
      harmonicity: 5.1,
      modulationIndex: 40,
      resonance: 5000,
      octaves: 2,
      volume: vol - 6,
    }).connect(_sfxLimiter);
    crash.triggerAttackRelease('4n');
    setTimeout(() => crash.dispose(), 1200);
  }, 200);
}

/**
 * Hold piece — quick swap sound.
 */
function sfxHold() {
  ensureSfxChain();
  const vol = -20 + (_sfxVol - 0.7) * 20;

  const synth = new Tone.FMSynth({
    harmonicity: 2.5,
    modulationIndex: 5,
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.04 },
    volume: vol,
  }).connect(_sfxLimiter);
  const synth2 = new Tone.FMSynth({
    harmonicity: 2.5,
    modulationIndex: 5,
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.04 },
    volume: vol - 4,
  }).connect(_sfxLimiter);

  synth.triggerAttackRelease('D5', '64n');
  setTimeout(() => synth2.triggerAttackRelease('A5', '64n'), 30);
  setTimeout(() => { synth.dispose(); synth2.dispose(); }, 200);
}

/**
 * Soft drop tick — very subtle.
 */
function sfxSoftDrop() {
  ensureSfxChain();
  const vol = -28 + (_sfxVol - 0.7) * 20;

  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
    volume: vol,
  }).connect(_sfxLimiter);
  synth.triggerAttackRelease('E5', '64n');
  setTimeout(() => synth.dispose(), 100);
}

/**
 * Brand Jingle — the "Stackr Quest" signature sound.
 *
 * A playful, brain-tickling 2-second jingle:
 * 1. Bouncy ascending pentatonic arpeggio (xylophone-like FM bells)
 * 2. Bright major chord bloom (pad + shimmer)
 * 3. Sparkle tail with descending fairy dust
 *
 * Designed to be instantly recognizable and dopamine-triggering.
 */
function sfxBrandJingle() {
  ensureSfxChain();
  const vol = -10 + (_sfxVol - 0.7) * 20;

  // --- Wide reverb just for the jingle ---
  const jingleReverb = new Tone.Reverb({ decay: 1.8, wet: 0.3 }).toDestination();
  const jingleGain = new Tone.Gain(0.9).connect(jingleReverb);

  // --- Phase 1: Bouncy ascending pentatonic "boing-boing-boing" ---
  // C major pentatonic: C E G A C — mapped to bell-like FM tones
  const bounceNotes = ['C5', 'E5', 'G5', 'A5', 'C6'];
  const bounceTimings = [0, 110, 200, 280, 350]; // ms — accelerating rhythm

  bounceNotes.forEach((note, i) => {
    const bell = new Tone.FMSynth({
      harmonicity: 3.5,
      modulationIndex: 6,
      oscillator: { type: 'sine' },
      modulation: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.18, sustain: 0.02, release: 0.2 },
      modulationEnvelope: { attack: 0.002, decay: 0.1, sustain: 0, release: 0.15 },
      volume: vol - 2 + i * 0.5, // crescendo
    }).connect(jingleGain);

    // Bounce "body" — a second detuned layer for width
    const body = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.003, decay: 0.12, sustain: 0.01, release: 0.15 },
      volume: vol - 8,
      detune: 5,
    }).connect(jingleGain);

    setTimeout(() => {
      bell.triggerAttackRelease(note, 0.12);
      body.triggerAttackRelease(note, 0.1);
    }, bounceTimings[i]);

    setTimeout(() => { bell.dispose(); body.dispose(); }, bounceTimings[i] + 400);
  });

  // --- Phase 2: Chord bloom at beat peak (major triad + octave) ---
  setTimeout(() => {
    const chordNotes = ['C5', 'E5', 'G5', 'C6'];
    const bloom = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.03, decay: 0.5, sustain: 0.15, release: 0.6 },
      volume: vol - 4,
    }).connect(jingleGain);

    // Bright shimmer layer
    const shimmerBloom = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.08, release: 0.4 },
      volume: vol - 10,
      detune: 8,
    }).connect(jingleGain);

    bloom.triggerAttackRelease(chordNotes, 0.4);
    shimmerBloom.triggerAttackRelease(chordNotes, 0.3);

    // Sub-bass "punch" under the chord
    const sub = new Tone.MembraneSynth({
      pitchDecay: 0.03,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
      volume: vol - 6,
    }).connect(jingleGain);
    sub.triggerAttackRelease('C3', '8n');

    setTimeout(() => { bloom.dispose(); shimmerBloom.dispose(); sub.dispose(); }, 1200);
  }, 420);

  // --- Phase 3: Sparkle tail — descending fairy-dust notes ---
  const sparkleNotes = ['E7', 'C7', 'A6', 'G6', 'E6'];
  const sparkleStart = 650;
  sparkleNotes.forEach((note, i) => {
    const sparkle = new Tone.FMSynth({
      harmonicity: 5,
      modulationIndex: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.1 },
      modulationEnvelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.08 },
      volume: vol - 6 - i * 1.5, // fade out
    }).connect(jingleGain);

    setTimeout(() => sparkle.triggerAttackRelease(note, '64n'), sparkleStart + i * 60);
    setTimeout(() => sparkle.dispose(), sparkleStart + i * 60 + 250);
  });

  // --- Final shimmer (metallic sparkle) ---
  setTimeout(() => {
    const finalShimmer = new Tone.MetalSynth({
      frequency: 1200,
      envelope: { attack: 0.001, decay: 0.3, release: 0.2 },
      harmonicity: 5.1,
      modulationIndex: 20,
      resonance: 5000,
      octaves: 1.5,
      volume: vol - 14,
    }).connect(jingleGain);
    finalShimmer.triggerAttackRelease('16n');
    setTimeout(() => finalShimmer.dispose(), 600);
  }, sparkleStart + sparkleNotes.length * 60);

  // Clean up jingle effects
  setTimeout(() => {
    jingleGain.dispose();
    jingleReverb.dispose();
  }, 2500);
}

/** SFX dispatch map. */
const SFX_MAP = {
  move: sfxMove,
  rotate: sfxRotate,
  lock: sfxLock,
  softdrop: sfxSoftDrop,
  harddrop: sfxHardDrop,
  clear1: () => sfxLineClear(1),
  clear2: () => sfxLineClear(2),
  clear3: () => sfxLineClear(3),
  clear4: () => sfxLineClear(4),
  combo: () => sfxCombo(2),
  levelWin: sfxLevelWin,
  levelFail: sfxLevelFail,
  uiTap: sfxUiTap,
  starEarn: sfxStarEarn,
  coinEarn: sfxCoinEarn,
  powerup: sfxPowerup,
  bossAttack: sfxBossAttack,
  bossDefeat: sfxBossDefeat,
  hold: sfxHold,
  brandJingle: sfxBrandJingle,
  lifeLoss: sfxLifeLoss,
  gameOver: sfxGameOver,
};

// ─── BGM: Procedural Per-World Music via Tone.js ─────────────────────

/**
 * Each world theme has:
 * - A chord progression (4 chords looping)
 * - A synth pad for harmonic bed
 * - An arpeggio pattern for melody
 * - A bass line
 * - Optional percussion
 * - Tempo + key signature
 */

const WORLD_MUSIC = {
  menu: {
    name: 'Menu',
    bpm: 90,
    chords: [['C4', 'E4', 'G4'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['C4', 'E4', 'G4']],
    arp: ['C5', 'E5', 'G5', 'E5', 'C5', 'G4', 'E4', 'G4'],
    bass: ['C2', 'F2', 'G2', 'C2'],
    padType: 'sine',
    arpType: 'triangle',
    style: 'gentle',
  },
  modern: {
    name: 'Meadow',
    bpm: 110,
    chords: [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']],
    arp: ['E5', 'G5', 'C6', 'G5', 'E5', 'D5', 'C5', 'D5'],
    bass: ['C2', 'A1', 'F2', 'G2'],
    padType: 'sine',
    arpType: 'triangle',
    style: 'bright',
  },
  deepsea: {
    name: 'Deep Sea',
    bpm: 80,
    chords: [['D3', 'F3', 'A3'], ['Bb3', 'D4', 'F4'], ['C4', 'E4', 'G4'], ['A3', 'C4', 'E4']],
    arp: ['A4', 'D5', 'F5', 'A5', 'F5', 'D5', 'C5', 'A4'],
    bass: ['D2', 'Bb1', 'C2', 'A1'],
    padType: 'sine',
    arpType: 'sine',
    style: 'ethereal',
  },
  volcano: {
    name: 'Volcano',
    bpm: 130,
    chords: [['E3', 'G3', 'B3'], ['C3', 'E3', 'G3'], ['D3', 'F3', 'A3'], ['E3', 'G#3', 'B3']],
    arp: ['E4', 'G4', 'B4', 'E5', 'B4', 'G4', 'F#4', 'E4'],
    bass: ['E1', 'C2', 'D2', 'E1'],
    padType: 'sawtooth',
    arpType: 'square',
    style: 'aggressive',
  },
  storm: {
    name: 'Storm',
    bpm: 120,
    chords: [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['D3', 'F3', 'A3'], ['E3', 'G#3', 'B3']],
    arp: ['A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'B4', 'A4'],
    bass: ['A1', 'F2', 'D2', 'E2'],
    padType: 'triangle',
    arpType: 'sawtooth',
    style: 'intense',
  },
  arctic: {
    name: 'Arctic',
    bpm: 85,
    chords: [['E4', 'G#4', 'B4'], ['C#4', 'E4', 'G#4'], ['A3', 'C#4', 'E4'], ['B3', 'D#4', 'F#4']],
    arp: ['B5', 'G#5', 'E5', 'B4', 'E5', 'G#5', 'C#6', 'B5'],
    bass: ['E2', 'C#2', 'A1', 'B1'],
    padType: 'sine',
    arpType: 'sine',
    style: 'crystalline',
  },
  cosmos: {
    name: 'Cosmos',
    bpm: 95,
    chords: [['D4', 'F#4', 'A4'], ['B3', 'D4', 'F#4'], ['G3', 'B3', 'D4'], ['A3', 'C#4', 'E4']],
    arp: ['D5', 'F#5', 'A5', 'D6', 'A5', 'F#5', 'E5', 'D5'],
    bass: ['D2', 'B1', 'G1', 'A1'],
    padType: 'triangle',
    arpType: 'sine',
    style: 'spacey',
  },
  nexus: {
    name: 'Nexus',
    bpm: 140,
    chords: [['A3', 'C#4', 'E4'], ['F#3', 'A3', 'C#4'], ['D3', 'F#3', 'A3'], ['E3', 'G#3', 'B3']],
    arp: ['A4', 'C#5', 'E5', 'A5', 'E5', 'C#5', 'B4', 'A4'],
    bass: ['A1', 'F#1', 'D2', 'E2'],
    padType: 'sawtooth',
    arpType: 'square',
    style: 'cyberpunk',
  },
  boss: {
    name: 'Boss',
    bpm: 145,
    chords: [['E3', 'G3', 'Bb3'], ['D3', 'F3', 'A3'], ['C3', 'Eb3', 'G3'], ['D3', 'F#3', 'A3']],
    arp: ['E4', 'Bb4', 'E5', 'Bb4', 'G4', 'E4', 'D4', 'E4'],
    bass: ['E1', 'D1', 'C1', 'D1'],
    padType: 'sawtooth',
    arpType: 'square',
    style: 'menacing',
  },
};
// Aliases
WORLD_MUSIC.neon = { ...WORLD_MUSIC.modern, name: 'Neon', bpm: 118, style: 'bright' };
WORLD_MUSIC.vaporwave = { ...WORLD_MUSIC.deepsea, name: 'Vaporwave', bpm: 75, style: 'ethereal' };
WORLD_MUSIC.gameboy = { ...WORLD_MUSIC.modern, name: 'Gameboy', bpm: 105, arpType: 'square', padType: 'square', style: 'chiptune' };

/** Active BGM parts */
let _bgmParts = null;
let _currentBgmTrack = null;

/**
 * Create and start a procedural BGM track.
 */
function startBgm(theme) {
  const def = WORLD_MUSIC[theme] || WORLD_MUSIC.menu;
  Tone.getTransport().bpm.value = def.bpm;

  // Master volume for BGM
  const bgmGain = new Tone.Gain(_musicVol * 0.5).toDestination();

  // --- Pad (chord bed) ---
  const padFilter = new Tone.Filter({
    frequency: def.style === 'aggressive' || def.style === 'menacing' ? 3000 : 1500,
    type: 'lowpass',
    rolloff: -12,
  }).connect(bgmGain);

  const padReverb = new Tone.Reverb({
    decay: ['ethereal', 'crystalline', 'spacey'].includes(def.style) ? 4 : 2,
    wet: 0.4,
  }).connect(padFilter);

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: def.padType },
    envelope: {
      attack: def.style === 'aggressive' ? 0.1 : 0.5,
      decay: 0.3,
      sustain: 0.6,
      release: 1.0,
    },
    volume: -18,
  }).connect(padReverb);

  const padPart = new Tone.Sequence((time, chordIdx) => {
    const chord = def.chords[chordIdx];
    if (chord) {
      pad.triggerAttackRelease(chord, '2n', time);
    }
  }, [0, 1, 2, 3], '1n');

  // --- Arpeggio ---
  const arpDelay = new Tone.FeedbackDelay({
    delayTime: '16n',
    feedback: 0.2,
    wet: 0.15,
  }).connect(bgmGain);

  const arpSynth = new Tone.Synth({
    oscillator: { type: def.arpType },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0.05,
      release: 0.15,
    },
    volume: -22,
  }).connect(arpDelay);

  const arpPart = new Tone.Sequence((time, note) => {
    if (note) {
      arpSynth.triggerAttackRelease(note, '16n', time);
    }
  }, def.arp, '8n');

  // --- Bass ---
  const bassFilter = new Tone.Filter({
    frequency: 400,
    type: 'lowpass',
    rolloff: -24,
  }).connect(bgmGain);

  const bassSynth = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.3 },
    filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2, baseFrequency: 100, octaves: 2 },
    volume: -16,
  }).connect(bassFilter);

  const bassPart = new Tone.Sequence((time, note) => {
    if (note) {
      bassSynth.triggerAttackRelease(note, '2n', time);
    }
  }, def.bass, '1n');

  // --- Percussion (only for energetic styles) ---
  let kickPart = null;
  let hihatPart = null;
  let kickSynth = null;
  let hihatSynth = null;

  const hasPercussion = ['aggressive', 'intense', 'menacing', 'cyberpunk', 'bright', 'chiptune'].includes(def.style);
  if (hasPercussion) {
    kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
      volume: -20,
    }).connect(bgmGain);

    hihatSynth = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.05, release: 0.03 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1,
      volume: -28,
    }).connect(bgmGain);

    // Kick on beats 1 and 3
    kickPart = new Tone.Sequence((time, vel) => {
      if (vel) kickSynth.triggerAttackRelease('C1', '16n', time, vel);
    }, [1, null, null, null, 0.8, null, null, null], '8n');

    // Hi-hat on every 8th note
    hihatPart = new Tone.Sequence((time, vel) => {
      if (vel) hihatSynth.triggerAttackRelease('32n', time, vel);
    }, [0.3, 0.6, 0.3, 0.6, 0.3, 0.6, 0.3, 0.6], '8n');

    kickPart.start(0);
    hihatPart.start(0);
  }

  padPart.start(0);
  arpPart.start(0);
  bassPart.start(0);

  Tone.getTransport().start();

  _bgmParts = {
    bgmGain,
    pad, padPart, padFilter, padReverb,
    arpSynth, arpPart, arpDelay,
    bassSynth, bassPart, bassFilter,
    kickSynth, kickPart,
    hihatSynth, hihatPart,
  };
}

/**
 * Stop and clean up all BGM parts.
 */
function stopBgmParts() {
  if (!_bgmParts) return;
  Tone.getTransport().stop();
  Tone.getTransport().cancel();

  const p = _bgmParts;
  p.padPart?.stop(); p.padPart?.dispose();
  p.arpPart?.stop(); p.arpPart?.dispose();
  p.bassPart?.stop(); p.bassPart?.dispose();
  p.kickPart?.stop(); p.kickPart?.dispose();
  p.hihatPart?.stop(); p.hihatPart?.dispose();
  p.pad?.dispose();
  p.arpSynth?.dispose();
  p.bassSynth?.dispose();
  p.kickSynth?.dispose();
  p.hihatSynth?.dispose();
  p.padFilter?.dispose();
  p.padReverb?.dispose();
  p.arpDelay?.dispose();
  p.bassFilter?.dispose();
  p.bgmGain?.dispose();

  _bgmParts = null;
}

// ─── Public API ──────────────────────────────────────────────────────

export const audio = {
  /**
   * Initialize audio system. Call once after user gesture.
   */
  init(settings = {}) {
    if (_initialized) return;
    _initialized = true;

    if (settings.soundEnabled === false) _muted = true;
    if (settings.musicEnabled === false) _musicVol = 0;

    // Start Tone.js on first user interaction and play any pending BGM
    const unlock = async () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
      const ok = await ensureTone();
      if (ok && _pendingBgm) {
        const theme = _pendingBgm;
        _pendingBgm = null;
        audio.playBgm(theme);
      }
    };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  },

  /**
   * Play a sound effect.
   * @param {string} name — SFX name
   * @param {object} [_opts] — reserved for future use
   */
  playSfx(name, _opts) {
    if (_muted || _sfxVol <= 0) return;
    if (!_toneStarted) return;
    const fn = SFX_MAP[name];
    if (fn) {
      try { fn(); } catch { /* audio not available */ }
    }
  },

  /**
   * Play line clear SFX + combo based on count.
   * @param {number} lines — 1-4
   * @param {number} [combo] — current combo count
   */
  playLineClear(lines, combo = 0) {
    if (_muted || _sfxVol <= 0 || !_toneStarted) return;
    try {
      sfxLineClear(lines);
      if (combo > 1) sfxCombo(combo);
    } catch { /* audio not available */ }
  },

  /**
   * Play BGM for a world theme.
   * @param {string} theme — 'menu', 'modern', 'deepsea', etc.
   */
  async playBgm(theme) {
    if (_currentBgmTrack === theme) return;
    this.stopBgm();

    if (_muted || _musicVol <= 0) {
      _currentBgmTrack = theme;
      return;
    }

    // If Tone hasn't been unlocked yet (no user gesture), queue for later
    if (!_toneStarted) {
      _pendingBgm = theme;
      _currentBgmTrack = theme;
      return;
    }

    const ok = await ensureTone();
    if (!ok) return;

    try {
      startBgm(theme);
      _currentBgmTrack = theme;
    } catch {
      // Audio not available
    }
  },

  /** Stop current BGM. */
  stopBgm() {
    stopBgmParts();
    _currentBgmTrack = null;
  },

  /** Pause BGM. */
  pauseBgm() {
    if (_bgmParts) Tone.getTransport().pause();
  },

  /** Resume BGM. */
  resumeBgm() {
    if (_bgmParts) Tone.getTransport().start();
  },

  /** @param {number} vol — 0..1 */
  setSfxVolume(vol) {
    _sfxVol = Math.max(0, Math.min(1, vol));
  },

  /** @param {number} vol — 0..1 */
  setMusicVolume(vol) {
    _musicVol = Math.max(0, Math.min(1, vol));
    if (_bgmParts?.bgmGain) {
      _bgmParts.bgmGain.gain.value = _musicVol * 0.5;
    }
  },

  /** Toggle global mute. */
  toggleMute() {
    _muted = !_muted;
    if (_muted) this.stopBgm();
    return _muted;
  },

  /** @param {boolean} m */
  setMuted(m) {
    _muted = m;
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

  /**
   * Play the brand jingle — signature "Stackr Quest" sound.
   * Designed to play once on app launch / home screen entry.
   */
  async playBrandJingle() {
    if (_muted || _sfxVol <= 0) return;
    const ok = await ensureTone();
    if (!ok) return;
    try { sfxBrandJingle(); } catch { /* audio not available */ }
  },

  /** Get the current BGM track name. */
  getCurrentBgm() {
    return _currentBgmTrack;
  },
};
