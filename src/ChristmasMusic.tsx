import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

type Chord = { root: number; fifth: number; chord: number[] };
export type Song = { beat: number; octave: number; bells: boolean; melody: [number, number][]; halfBarChords: Chord[] };

const C = { root: 48, fifth: 55, chord: [60, 64, 67] };
const F = { root: 53, fifth: 48, chord: [60, 65, 69] };
const G7 = { root: 55, fifth: 50, chord: [59, 62, 65, 67] };
const D7 = { root: 50, fifth: 57, chord: [57, 60, 62, 66] };

const JINGLE_VERSE: [number, number][] = [
  [64, 1], [64, 1], [64, 2], [64, 1], [64, 1], [64, 2],
  [64, 1], [67, 1], [60, 1.5], [62, 0.5], [64, 4],
  [65, 1], [65, 1], [65, 1.5], [65, 0.5], [65, 1], [64, 1], [64, 1], [64, 0.5], [64, 0.5],
];

export const JINGLE_BELLS: Song = {
  beat: 0.33,
  octave: 12,
  bells: true,
  melody: [
    ...JINGLE_VERSE,
    [64, 1], [62, 1], [62, 1], [64, 1], [62, 2], [67, 2],
    ...JINGLE_VERSE,
    [67, 1], [67, 1], [65, 1], [62, 1], [60, 4],
  ],
  halfBarChords: [C, C, C, C, F, C, D7, G7, C, C, C, C, F, C, G7, C].flatMap((chord) => [chord, chord]),
};

const TWINKLE_A: [number, number][] = [
  [60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2],
  [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2],
];
const TWINKLE_B: [number, number][] = [[67, 1], [67, 1], [65, 1], [65, 1], [64, 1], [64, 1], [62, 2]];
const TWINKLE_A_CHORDS = [C, C, F, C, F, C, G7, C];
const TWINKLE_B_CHORDS = [C, F, C, G7];

export const TWINKLE_TWINKLE: Song = {
  beat: 0.46,
  octave: 24,
  bells: false,
  melody: [...TWINKLE_A, ...TWINKLE_B, ...TWINKLE_B, ...TWINKLE_A],
  halfBarChords: [...TWINKLE_A_CHORDS, ...TWINKLE_B_CHORDS, ...TWINKLE_B_CHORDS, ...TWINKLE_A_CHORDS],
};

function melodySteps(song: Song) {
  const steps = new Map<number, [number, number]>();
  song.melody.reduce((step, event) => {
    steps.set(step, event);
    return step + event[1] * 2;
  }, 0);
  return steps;
}

function toFrequency(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

function playPluck(context: AudioContext, output: AudioNode, note: number, when: number, duration: number, volume: number, type: OscillatorType) {
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.001, when);
  envelope.gain.exponentialRampToValueAtTime(volume, when + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.001, when + duration);
  envelope.connect(output);
  const voice = context.createOscillator();
  voice.type = type;
  voice.frequency.value = toFrequency(note);
  voice.connect(envelope);
  voice.start(when);
  voice.stop(when + duration);
  voice.onended = () => envelope.disconnect();
}

function createNoise(context: AudioContext) {
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * 0.2), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

function playSleighBells(context: AudioContext, output: AudioNode, noise: AudioBuffer, when: number, volume: number) {
  const source = context.createBufferSource();
  source.buffer = noise;
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6500;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.001, when);
  envelope.gain.exponentialRampToValueAtTime(volume, when + 0.005);
  envelope.gain.exponentialRampToValueAtTime(0.001, when + 0.11);
  source.connect(filter).connect(envelope).connect(output);
  source.start(when);
  source.stop(when + 0.12);
  source.onended = () => {
    filter.disconnect();
    envelope.disconnect();
  };
}

function playBell(context: AudioContext, output: AudioNode, note: number, when: number, duration: number, volume: number) {
  const frequency = toFrequency(note);
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.001, when);
  envelope.gain.exponentialRampToValueAtTime(volume, when + 0.018);
  envelope.gain.exponentialRampToValueAtTime(0.001, when + duration);
  envelope.connect(output);
  const tone = context.createOscillator();
  tone.type = 'sine';
  tone.frequency.value = frequency;
  const overtone = context.createOscillator();
  overtone.frequency.value = frequency * 2.01;
  const shimmer = context.createGain();
  shimmer.gain.value = 0.22;
  overtone.connect(shimmer).connect(envelope);
  tone.connect(envelope);
  for (const voice of [tone, overtone]) {
    voice.start(when);
    voice.stop(when + duration);
  }
  tone.onended = () => {
    envelope.disconnect();
    shimmer.disconnect();
  };
}

function startMelody(context: AudioContext, destination: AudioNode, song: Song) {
  const output = context.createGain();
  output.gain.value = 0.32;
  output.connect(destination);
  const noise = createNoise(context);
  const melodyByStep = melodySteps(song);
  const totalSteps = song.halfBarChords.length * 4;
  const step = song.beat / 2;
  let stepIndex = 0;
  let nextStep = context.currentTime + 0.05;
  const schedule = () => {
    if (context.state !== 'running') return;
    nextStep = Math.max(nextStep, context.currentTime + 0.015);
    while (nextStep < context.currentTime + 0.35) {
      const melody = melodyByStep.get(stepIndex);
      if (melody) playBell(context, output, melody[0] + song.octave, nextStep, Math.min(1.3, melody[1] * song.beat + 0.25), 0.42);
      const chord = song.halfBarChords[Math.floor(stepIndex / 4)];
      const inBar = stepIndex % 8;
      if (inBar === 0 || inBar === 4) playPluck(context, output, inBar === 0 ? chord.root : chord.fifth, nextStep, song.beat * 1.6, song.bells ? 0.34 : 0.22, 'triangle');
      if (inBar === 2 || inBar === 6) {
        for (const note of chord.chord) playPluck(context, output, note, nextStep, song.beat * 0.8, 0.05, 'sine');
      }
      if (song.bells) playSleighBells(context, output, noise, nextStep, inBar % 4 === 2 ? 0.2 : 0.08);
      nextStep += step;
      stepIndex = (stepIndex + 1) % totalSteps;
    }
  };
  schedule();
  const timer = window.setInterval(schedule, 120);
  return () => {
    window.clearInterval(timer);
    output.disconnect();
  };
}

export default function ChristmasMusic({ song }: { song: Song }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  function stop() {
    stopRef.current?.();
    stopRef.current = null;
    const player = playerRef.current;
    playerRef.current = null;
    if (player) {
      player.pause();
      player.srcObject = null;
    }
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio && audio.state !== 'closed') void audio.close().catch(() => undefined);
  }

  useEffect(() => stop, []);

  async function toggle() {
    setError(false);
    if (audioRef.current) {
      stop();
      setPlaying(false);
      return;
    }
    let audio: AudioContext;
    try {
      audio = new AudioContext();
    } catch {
      setError(true);
      return;
    }
    audioRef.current = audio;
    setPlaying(true);
    // iOS mutes Web Audio in silent mode, but not media elements.
    const stream = audio.createMediaStreamDestination();
    const player = new Audio();
    player.setAttribute('playsinline', '');
    player.srcObject = stream.stream;
    playerRef.current = player;
    const playback = player.play().then(() => true, () => false);
    try {
      await audio.resume();
      const destination: AudioNode = (await playback) ? stream : audio.destination;
      if (audioRef.current === audio) stopRef.current = startMelody(audio, destination, song);
    } catch {
      if (audioRef.current !== audio) return;
      stop();
      setPlaying(false);
      setError(true);
    }
  }

  return (
    <div className="booth-sound">
      <button type="button" className="icon-button booth-sound-toggle" aria-label="Muziek" aria-pressed={playing} title={playing ? 'Muziek uitzetten' : 'Muziek aanzetten'} onClick={() => void toggle()}>
        {playing ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
      {error && <span className="booth-sound-error" role="status">Muziek niet beschikbaar</span>}
    </div>
  );
}