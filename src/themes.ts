import { JINGLE_BELLS, TWINKLE_TWINKLE, type Song } from './ChristmasMusic';
import { NURSERY_ART } from './MaatjesScene';
import christmasBackground from './frame-background.jpg';
import type { CollageStyle } from './lib/createStrip';

export type ThemeId = 'christmas' | 'babyshower';

export type Theme = {
  id: ThemeId;
  label: string;
  eyebrow: string;
  words: [string, string, string];
  meta: string[];
  marquee: string[];
  bubbles: [string, string];
  cameraPrefix: string;
  collageWord: string;
  fileName: string;
  themeColor: string;
  collage: CollageStyle;
  song: Song;
};

export const THEMES: Record<ThemeId, Theme> = {
  christmas: {
    id: 'christmas',
    label: 'Kerst',
    eyebrow: 'Kerst Fotobooth',
    words: ['Lach.', 'Flits.', 'Kerst.'],
    meta: ["3 foto's", 'Aftellen vanaf 3', 'Kerstcollage'],
    marquee: ['Merry Christmas', 'Lach', 'Flits', 'Kerstcollage', 'Ho ho ho', 'Proost'],
    bubbles: ['Ho ho ho!', 'Cheese!'],
    cameraPrefix: 'Kerst',
    collageWord: 'kerstcollage',
    fileName: 'mijn-kerstcollage.png',
    themeColor: '#072414',
    collage: { kind: 'photo', background: christmasBackground },
    song: JINGLE_BELLS,
  },
  babyshower: {
    id: 'babyshower',
    label: 'Babyshower (jongen)',
    eyebrow: 'Babyshower Fotobooth',
    words: ['Lach.', 'Flits.', 'Baby.'],
    meta: ["3 foto's", 'Aftellen vanaf 3', 'Babycollage'],
    marquee: ['Welkom baby', "It's a boy", 'Lach', 'Flits', 'Babycollage', 'Oh boy'],
    bubbles: ['Welkom kleintje!', 'Cheese!'],
    cameraPrefix: 'Baby',
    collageWord: 'babycollage',
    fileName: 'mijn-babycollage.png',
    themeColor: '#0e2340',
    collage: { kind: 'nursery', title: 'Daphnes Babyshower', ...NURSERY_ART },
    song: TWINKLE_TWINKLE,
  },
};

const STORAGE_KEY = 'fotobooth-thema';

export function readThemeId(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'babyshower' ? 'babyshower' : 'christmas';
  } catch {
    return 'christmas';
  }
}

export function saveThemeId(id: ThemeId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private browsing can block storage; the theme then only lasts this session.
  }
}
