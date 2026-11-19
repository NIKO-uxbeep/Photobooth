import { useEffect, useRef, type CSSProperties, type ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { Theme } from './themes';

type Flake = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  phase: number;
  angle: number;
  spin: number;
  sprite: HTMLCanvasElement | null;
  alpha: number;
  color: string;
  horse: boolean;
};

const SPRITE_SIZE = 64;
const CONFETTI_COLORS = ['#6fb1f5', '#f9e3a3', '#ffffff', '#3b82d6', '#cfe6ff'];

function makeStarSprite(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SPRITE_SIZE;
  const context = canvas.getContext('2d')!;
  context.translate(SPRITE_SIZE / 2, SPRITE_SIZE / 2);
  context.shadowColor = color;
  context.shadowBlur = 6;
  context.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    const radius = point % 2 ? 11 : 26;
    context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  context.closePath();
  context.fillStyle = color;
  context.fill();
  return canvas;
}

function makeImageSprite(url: string, width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const image = new Image();
  image.onload = () => canvas.getContext('2d')?.drawImage(image, 0, 0, width, height);
  image.src = url;
  return canvas;
}

function makeSprite(variant: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SPRITE_SIZE;
  const context = canvas.getContext('2d')!;
  const middle = SPRITE_SIZE / 2;
  const arm = middle - 6;
  context.translate(middle, middle);
  context.strokeStyle = '#ffffff';
  context.lineCap = 'round';
  context.lineWidth = variant === 2 ? 3 : 2.4;
  context.shadowColor = 'rgba(255,255,255,0.9)';
  context.shadowBlur = 4;
  for (let index = 0; index < 6; index += 1) {
    context.save();
    context.rotate((Math.PI / 3) * index);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, -arm);
    const branches = variant === 0 ? [0.45, 0.7] : variant === 1 ? [0.35, 0.55, 0.75] : [0.6];
    for (const branch of branches) {
      const length = arm * (variant === 2 ? 0.35 : 0.22) * (1.2 - branch);
      context.moveTo(0, -arm * branch);
      context.lineTo(-length, -arm * branch - length);
      context.moveTo(0, -arm * branch);
      context.lineTo(length, -arm * branch - length);
    }
    context.stroke();
    context.restore();
  }
  if (variant === 1) {
    context.beginPath();
    context.arc(0, 0, 4, 0, Math.PI * 2);
    context.fillStyle = '#ffffff';
    context.fill();
  }
  return canvas;
}

function Snow({ confetti }: { confetti: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current!;
    const context = canvas.getContext('2d')!;
    const sprites = confetti ? [makeStarSprite('#f9e3a3'), makeStarSprite('#ffffff'), makeStarSprite('#9fd0ff')] : [makeSprite(0), makeSprite(1), makeSprite(2)];
    const figureSprites = confetti ? [makeImageSprite(NURSERY_ART.horse, 100, 85), makeImageSprite(HIGHLAND_COW, 100, 80)] : [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let flakes: Flake[] = [];

    const make = (y?: number): Flake => {
      if (figureSprites.length && Math.random() < 0.26) {
        return {
          x: Math.random() * width,
          y: y ?? Math.random() * height,
          size: Math.random() * 18 + 30,
          speed: Math.random() * 0.4 + 0.55,
          drift: Math.random() * 0.6 + 0.2,
          phase: Math.random() * Math.PI * 2,
          angle: 0,
          spin: 0,
          sprite: figureSprites[Math.floor(Math.random() * figureSprites.length)],
          alpha: 0.95,
          color: '#ffffff',
          horse: true,
        };
      }
      const crystal = Math.random() < 0.6;
      const size = crystal ? Math.random() * 14 + 8 : Math.random() * 2.4 + 1;
      return {
        x: Math.random() * width,
        y: y ?? Math.random() * height,
        size,
        speed: crystal ? size * 0.05 + 0.3 : Math.random() * 0.6 + 0.3,
        drift: Math.random() * 0.7 + 0.2,
        phase: Math.random() * Math.PI * 2,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.02,
        sprite: crystal ? sprites[Math.floor(Math.random() * sprites.length)] : null,
        alpha: crystal ? Math.random() * 0.4 + 0.55 : Math.random() * 0.4 + 0.4,
        color: confetti ? CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] : '#ffffff',
        horse: false,
      };
    };

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      flakes = Array.from({ length: Math.round(Math.min(130, (width * height) / 11000)) }, () => make());
    };

    const tick = () => {
      context.clearRect(0, 0, width, height);
      for (const flake of flakes) {
        flake.phase += 0.01;
        flake.y += flake.speed;
        flake.x += Math.sin(flake.phase) * flake.drift;
        flake.angle = flake.horse ? Math.sin(flake.phase * 4) * 0.28 : flake.angle + flake.spin;
        if (flake.y > height + 40) Object.assign(flake, make(-40));
        context.globalAlpha = flake.alpha;
        if (flake.sprite) {
          const spriteHeight = flake.size * (flake.sprite.height / flake.sprite.width);
          context.save();
          context.translate(flake.x, flake.y);
          context.rotate(flake.angle);
          context.drawImage(flake.sprite, -flake.size / 2, -spriteHeight / 2, flake.size, spriteHeight);
          context.restore();
        } else if (confetti) {
          context.save();
          context.translate(flake.x, flake.y);
          context.rotate(flake.angle * 6);
          context.fillStyle = flake.color;
          context.fillRect(-flake.size * 1.4, -flake.size * 0.7, flake.size * 2.8, flake.size * 1.4);
          context.restore();
        } else {
          context.fillStyle = '#ffffff';
          context.beginPath();
          context.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
          context.fill();
        }
      }
      frame = requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [confetti]);

  return <canvas ref={ref} className="snow" aria-hidden="true" />;
}

function Lights() {
  return (
    <div className="lights" aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => <span key={index} style={{ '--i': index } as CSSProperties} />)}
    </div>
  );
}

function Sleigh() {
  return (
    <div className="sleigh-sky" aria-hidden="true">
      <svg className="sleigh" viewBox="0 0 460 180">
        <defs>
          <linearGradient id="sleigh-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e43648" />
            <stop offset="1" stopColor="#8a0b1f" />
          </linearGradient>
          <linearGradient id="sleigh-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff0ad" />
            <stop offset="0.45" stopColor="#e3b54a" />
            <stop offset="1" stopColor="#a66d1b" />
          </linearGradient>
          <linearGradient id="reindeer-coat" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#d39a61" />
            <stop offset="1" stopColor="#754321" />
          </linearGradient>
          <filter id="sleigh-shadow" x="-20%" y="-30%" width="150%" height="170%">
            <feDropShadow dx="0" dy="5" stdDeviation="3" floodColor="#04170d" floodOpacity="0.7" />
          </filter>
        </defs>
        <g fill="#fff6d5">
          <circle cx="29" cy="53" r="2" />
          <circle cx="46" cy="42" r="1.5" />
          <circle cx="105" cy="58" r="1.5" />
        </g>
        <g>
          <path className="reins" d="M126 94 C166 78 193 82 225 91 S292 82 347 88" />
          <path className="reins reins--fine" d="M126 101 C173 88 196 92 227 99 S292 91 347 96" />
          {[0, 1, 2].map((index) => (
            <g key={index} transform={`translate(${174 + index * 87} ${22 + (index % 2) * 3}) scale(${0.68 - index * 0.04})`}>
              <g className="reindeer" style={{ animationDelay: `${index * -0.17}s` }}>
                <ellipse cx="38" cy="73" rx="34" ry="19" fill="url(#reindeer-coat)" />
                <path d="M12 69 Q34 55 60 69 L57 78 Q33 68 13 80Z" fill="#f2d5a9" opacity="0.95" />
                <path d="M18 84 L13 111 M31 87 L30 112 M50 85 L56 109 M61 79 L72 103" className="deer-legs" />
                <path d="M10 76 Q1 79 4 91" stroke="#754321" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M57 71 Q64 57 70 49 L82 44 L91 52 L83 62 Q71 70 64 79Z" fill="url(#reindeer-coat)" />
                <path d="M80 48 Q92 42 100 48 L101 56 Q94 61 84 57Z" fill="#efd4ad" />
                <ellipse cx="99" cy="53" rx="6" ry="4.5" fill={index === 0 ? '#c8102e' : '#4a2d1b'} />
                <circle cx="84" cy="46" r="2.2" fill="#1a120c" />
                <circle cx="84.6" cy="45.3" r="0.7" fill="#fff" />
                <path d="M70 46 Q63 36 66 29 Q74 34 74 42 M73 38 Q81 28 79 22 Q71 27 70 36 M68 34 L61 31" className="antlers" />
                <path d="M66 51 Q60 44 61 38" className="ear" />
                <path d="M27 52 Q34 46 41 52" fill="none" stroke="#e3b54a" strokeWidth="2" />
                <path d="M42 54 Q48 50 54 56" fill="none" stroke="#e3b54a" strokeWidth="2" />
                <circle cx="44" cy="57" r="4" fill="url(#sleigh-gold)" stroke="#8a5a1b" strokeWidth="1" />
              </g>
            </g>
          ))}
        </g>
        <g filter="url(#sleigh-shadow)">
          <path d="M20 112 Q22 130 40 136 L117 136 Q134 133 141 113 L136 103 L31 103Z" fill="url(#sleigh-wood)" stroke="#5d1018" strokeWidth="3" />
          <path d="M27 111 Q79 121 133 110" fill="none" stroke="#f05a62" strokeWidth="3" />
          <path d="M28 119 Q78 128 127 118" fill="none" stroke="#6e101b" strokeWidth="2" />
          <path d="M16 107 Q4 101 7 92 Q11 83 21 87 Q13 90 15 96 Q18 101 28 99 L138 99" fill="none" stroke="url(#sleigh-gold)" strokeWidth="7" strokeLinecap="round" />
          <path d="M27 140 Q74 155 124 140 Q136 136 141 123" fill="none" stroke="url(#sleigh-gold)" strokeWidth="4" strokeLinecap="round" />
          <path d="M42 135 L38 146 M110 135 L115 145" stroke="#e3b54a" strokeWidth="3" />
          <circle cx="38" cy="111" r="3" fill="#f7dc8b" />
          <circle cx="122" cy="111" r="3" fill="#f7dc8b" />
          <path d="M30 102 Q39 94 51 98 L65 102Z" fill="#f7dc8b" />
          <g>
            <path d="M87 99 L90 70 L113 72 L119 101Z" fill="#176b3a" stroke="#0d3b23" strokeWidth="2" />
            <path d="M98 71 L101 100 M88 82 L116 84" stroke="#f7dc8b" strokeWidth="4" />
            <path d="M101 72 Q90 58 98 57 Q105 57 102 71 Q108 55 116 60 Q121 65 101 72Z" fill="#c8102e" />
            <path d="M111 101 L115 80 L135 82 L139 104Z" fill="#e3b54a" stroke="#a66d1b" strokeWidth="2" />
            <path d="M121 81 L124 103 M113 89 L137 91" stroke="#c8102e" strokeWidth="3" />
          </g>
          <g>
            <path d="M45 100 Q45 77 63 71 Q80 68 90 82 L97 101Z" fill="#c8102e" />
            <path d="M48 97 Q68 91 93 98 L95 105 Q68 100 45 106Z" fill="#fbf3e4" />
            <ellipse cx="68" cy="71" rx="17" ry="18" fill="#f0c39a" />
            <path d="M52 69 Q51 47 71 48 Q88 50 84 71 L76 63 L67 67 L59 62Z" fill="#c8102e" />
            <path d="M55 64 Q69 59 83 65 L83 71 Q69 67 54 72Z" fill="#fbf3e4" />
            <circle cx="84" cy="51" r="6" fill="#fbf3e4" />
            <path d="M56 74 Q68 87 81 73 Q85 89 71 94 Q57 91 56 74Z" fill="#fbf3e4" />
            <circle cx="62" cy="70" r="1.7" fill="#24160f" />
            <circle cx="74" cy="70" r="1.7" fill="#24160f" />
            <path d="M65 77 Q70 80 75 77" fill="none" stroke="#8b3f2a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M58 101 L80 101" stroke="#e3b54a" strokeWidth="3" />
          </g>
        </g>
      </svg>
    </div>
  );
}

const ORNAMENTS: [number, number, string][] = [
  [118, 120, '#c8102e'], [180, 135, '#e3b54a'], [96, 200, '#e3b54a'], [160, 190, '#6cc4ff'], [210, 210, '#c8102e'],
  [70, 290, '#c8102e'], [130, 270, '#e3b54a'], [190, 290, '#6cc4ff'], [235, 300, '#e3b54a'],
];

const TREE_LIGHTS: [number, number][] = [
  [140, 95], [165, 105], [105, 160], [135, 168], [195, 162], [80, 245],
  [110, 238], [150, 230], [185, 240], [220, 250], [95, 305], [160, 310], [210, 315],
];

function ChristmasTree() {
  return (
    <svg className="xmas-tree" viewBox="0 0 300 400" aria-hidden="true">
      <defs>
        <linearGradient id="tree-green" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f8f4e" />
          <stop offset="100%" stopColor="#0f4a26" />
        </linearGradient>
        <radialGradient id="star-glow">
          <stop offset="0%" stopColor="#fff6d5" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#e3b54a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="tree-glow" cx="150" cy="34" r="40" fill="url(#star-glow)" />
      <polygon points="150,34 70,150 230,150" fill="url(#tree-green)" />
      <polygon points="150,95 50,230 250,230" fill="url(#tree-green)" />
      <polygon points="150,160 28,325 272,325" fill="url(#tree-green)" />
      <path d="M90 140 Q150 175 215 130" className="garland" />
      <path d="M70 220 Q150 265 235 210" className="garland" />
      <path d="M45 312 Q150 355 260 300" className="garland" />
      <rect x="132" y="325" width="36" height="38" rx="3" fill="#5a3a1e" />
      {TREE_LIGHTS.map(([x, y], index) => (
        <circle key={`l${index}`} cx={x} cy={y} r="3" className="tree-light" style={{ '--d': `${(index * 0.37) % 2}s` } as CSSProperties} />
      ))}
      {ORNAMENTS.map(([x, y, color], index) => (
        <g key={`o${index}`} className="tree-ornament" style={{ '--d': `${index * 0.3}s` } as CSSProperties}>
          <circle cx={x} cy={y} r="9" fill={color} />
          <circle cx={x - 3} cy={y - 3} r="2.5" fill="#fff" opacity="0.6" />
        </g>
      ))}
      <polygon className="tree-star" points="150,10 157,28 177,28 161,40 167,59 150,47 133,59 139,40 123,28 143,28" fill="#f7dc8b" stroke="#e3b54a" strokeWidth="2" />
      <g>
        <rect x="60" y="345" width="50" height="40" rx="3" fill="#c8102e" />
        <rect x="80" y="345" width="10" height="40" fill="#f7dc8b" />
        <rect x="60" y="360" width="50" height="8" fill="#f7dc8b" />
        <rect x="185" y="335" width="60" height="50" rx="3" fill="#1f6b3a" />
        <rect x="210" y="335" width="10" height="50" fill="#fbf3e4" />
        <rect x="185" y="355" width="60" height="9" fill="#fbf3e4" />
        <path d="M215 335 q-14 -16 -4 -18 q8 0 4 18 q4 -18 12 -18 q10 2 -12 18z" fill="#fbf3e4" />
      </g>
    </svg>
  );
}

const FOREST: [number, number][] = [
  [30, 70], [90, 100], [150, 60], [230, 120], [300, 80], [380, 95], [450, 65], [520, 110],
  [600, 75], [680, 125], [760, 85], [830, 60], [900, 105], [980, 70], [1060, 115], [1130, 80], [1190, 95],
];

function SnowyForest() {
  return (
    <svg className="snowy-forest" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true">
      {FOREST.map(([x, height]) => (
        <g key={x}>
          <polygon points={`${x},${140 - height} ${x - height * 0.32},140 ${x + height * 0.32},140`} fill="#04170d" />
          <polygon points={`${x},${140 - height} ${x - height * 0.1},${140 - height * 0.72} ${x + height * 0.1},${140 - height * 0.72}`} fill="#fbf3e4" />
        </g>
      ))}
      <path d="M0 128 Q 100 112 200 126 T 400 124 T 600 128 T 800 120 T 1000 128 T 1200 122 V140 H0Z" fill="#fbf3e4" />
      <path d="M0 136 H1200 V140 H0Z" fill="#04170d" />
    </svg>
  );
}

function Bunting() {
  return (
    <div className="bunting" aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => <span key={index} style={{ '--i': index } as CSSProperties} />)}
    </div>
  );
}

function Stork() {
  return (
    <div className="sleigh-sky" aria-hidden="true">
      <svg className="sleigh" viewBox="0 0 460 180">
        <defs>
          <linearGradient id="bundle-blue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9fd0ff" />
            <stop offset="1" stopColor="#3b82d6" />
          </linearGradient>
        </defs>
        <path d="M200 92 L140 104 M204 98 L146 112" stroke="#f08a3c" strokeWidth="4" strokeLinecap="round" />
        <g className="stork-wing stork-wing--back">
          <path d="M250 70 Q210 10 150 18 Q190 40 205 75 Z" fill="#e8eef6" stroke="#9fb3c8" strokeWidth="2" />
          <path d="M150 18 Q175 26 186 40 L172 44 Q162 30 150 18Z" fill="#1d2a3a" />
        </g>
        <path d="M186 78 L160 70 L166 86 Z" fill="#1d2a3a" />
        <ellipse cx="245" cy="82" rx="62" ry="26" fill="#ffffff" stroke="#9fb3c8" strokeWidth="2" />
        <path d="M296 72 Q330 50 352 46" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" fill="none" />
        <circle cx="358" cy="44" r="14" fill="#ffffff" stroke="#9fb3c8" strokeWidth="2" />
        <circle cx="362" cy="40" r="2.4" fill="#1d2a3a" />
        <path d="M370 42 L428 54 L370 50 Z" fill="#f08a3c" />
        <g className="stork-wing">
          <path d="M260 74 Q240 0 170 4 Q214 34 222 80 Z" fill="#ffffff" stroke="#9fb3c8" strokeWidth="2" />
          <path d="M170 4 Q196 10 208 26 L194 32 Q184 16 170 4Z" fill="#1d2a3a" />
        </g>
        <path d="M424 54 L402 96 M424 54 L446 96" stroke="#cfe6ff" strokeWidth="2" />
        <path d="M396 96 Q424 86 452 96 Q458 126 424 132 Q390 126 396 96Z" fill="url(#bundle-blue)" stroke="#2f6fb8" strokeWidth="2" />
        <circle cx="424" cy="104" r="10" fill="#f6d3b8" />
        <path d="M419 103 q2 2 4 0 M425 103 q2 2 4 0" stroke="#7a4a2c" strokeWidth="1.3" fill="none" />
        <circle cx="424" cy="90" r="4" fill="#2f6fb8" />
      </svg>
    </div>
  );
}

const BALLOONS: [number, number, number, number, string][] = [
  [150, 90, 52, 62, 'blue'], [88, 140, 46, 56, 'white'], [212, 138, 48, 58, 'light'], [120, 210, 44, 54, 'gold'],
  [190, 214, 46, 56, 'blue'], [70, 232, 38, 46, 'light'], [236, 240, 36, 44, 'white'],
];

const BALLOON_COLORS: Record<string, [string, string, string]> = {
  blue: ['#9fd0ff', '#3b82d6', '#1d4f94'],
  light: ['#ffffff', '#bfe0ff', '#7fb4e6'],
  white: ['#ffffff', '#f2f5fa', '#c9d3e0'],
  gold: ['#fff3c4', '#e9c46a', '#a8821f'],
};

function Balloons() {
  return (
    <svg className="xmas-tree" viewBox="0 0 300 420" aria-hidden="true">
      <defs>
        {Object.entries(BALLOON_COLORS).map(([name, [light, base, dark]]) => (
          <radialGradient key={name} id={`balloon-${name}`} cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor={light} />
            <stop offset="0.55" stopColor={base} />
            <stop offset="1" stopColor={dark} />
          </radialGradient>
        ))}
      </defs>
      {BALLOONS.map(([x, y, , ry]) => (
        <path key={`s${x}${y}`} d={`M${x} ${y + ry + 6} Q ${(x + 150) / 2 + (x < 150 ? -12 : 12)} ${(y + ry + 380) / 2} 150 380`} stroke="#e9eef5" strokeWidth="1.5" fill="none" />
      ))}
      {BALLOONS.map(([x, y, rx, ry, color], index) => (
        <g key={`b${x}${y}`} className="balloon" style={{ '--d': `${index * -0.6}s` } as CSSProperties}>
          <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#balloon-${color})`} />
          <path d={`M${x - 5} ${y + ry + 6} L${x + 5} ${y + ry + 6} L${x} ${y + ry - 1} Z`} fill={BALLOON_COLORS[color][2]} />
          <ellipse cx={x - rx * 0.35} cy={y - ry * 0.4} rx={rx * 0.16} ry={ry * 0.26} fill="#ffffff" opacity="0.55" transform={`rotate(-25 ${x - rx * 0.35} ${y - ry * 0.4})`} />
        </g>
      ))}
      <rect x="112" y="372" width="76" height="44" rx="4" fill="#3b82d6" />
      <rect x="145" y="372" width="10" height="44" fill="#f9e3a3" />
      <rect x="112" y="388" width="76" height="9" fill="#f9e3a3" />
      <path d="M150 372 q-16 -16 -5 -19 q9 0 5 19 q4 -19 13 -19 q11 3 -13 19z" fill="#f9e3a3" />
    </svg>
  );
}

function cloudPath(base: number, amplitude: number, step: number, offset: number) {
  let path = `M0 140 V${base}`;
  for (let x = 0, index = offset; x < 1200; x += step, index += 1) {
    path += ` A ${step / 2} ${amplitude + (index % 3) * 8} 0 0 1 ${Math.min(x + step, 1200)} ${base}`;
  }
  return `${path} V140 Z`;
}

function Clouds() {
  return (
    <svg className="snowy-forest" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true">
      <path d={cloudPath(78, 34, 140, 0)} fill="#bcdcf7" opacity="0.85" />
      <path d={cloudPath(104, 26, 110, 1)} fill="#ffffff" />
    </svg>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = (
    <div>
      {items.map((item) => (
        <span key={item}>
          {item}
          <i>✦</i>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}

type BearVariant = 'hat' | 'scarf' | 'bow' | 'pacifier';

function RockingHorse({ width, height }: { width?: number; height?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 170" width={width} height={height}>
      <path d="M14 146 Q100 182 186 146" stroke="#8a5a2b" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M14 146 Q100 182 186 146" stroke="#e9c46a" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M62 100 L52 152 M76 104 L74 158 M130 104 L128 158 M144 100 L152 152" stroke="#2f6fb8" strokeWidth="14" strokeLinecap="round" />
      <path d="M62 100 L52 152 M76 104 L74 158 M130 104 L128 158 M144 100 L152 152" stroke="#9fd0ff" strokeWidth="9" strokeLinecap="round" />
      <path d="M46 78 Q20 74 16 100 Q24 112 30 100 Q34 90 46 92 Z" fill="#ffffff" stroke="#c9d3e0" strokeWidth="2" />
      <ellipse cx="100" cy="88" rx="60" ry="27" fill="#9fd0ff" stroke="#2f6fb8" strokeWidth="3" />
      <ellipse cx="96" cy="80" rx="40" ry="10" fill="#ffffff" opacity="0.35" />
      <path d="M136 82 Q144 42 164 30 Q180 24 190 38 Q196 48 188 56 L172 56 Q164 70 160 96 Z" fill="#9fd0ff" stroke="#2f6fb8" strokeWidth="3" strokeLinejoin="round" />
      <path d="M162 30 L164 14 L174 28 Z" fill="#9fd0ff" stroke="#2f6fb8" strokeWidth="3" strokeLinejoin="round" />
      <path d="M144 74 Q136 62 146 56 Q140 46 152 40 Q148 30 160 26" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M168 32 L184 54" stroke="#e9c46a" strokeWidth="3" />
      <circle cx="176" cy="40" r="3.5" fill="#1d2a3a" />
      <circle cx="177" cy="39" r="1.2" fill="#ffffff" />
      <circle cx="181" cy="49" r="4" fill="#ff8a98" opacity="0.5" />
      <circle cx="189" cy="46" r="1.6" fill="#2f6fb8" />
      <path d="M78 64 Q100 54 122 64 L120 84 Q100 78 80 84 Z" fill="#3b82d6" stroke="#e9c46a" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="100" cy="71" r="4" fill="#f9e3a3" />
    </svg>
  );
}

function toDataUrl(element: ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  flushSync(() => root.render(element));
  const markup = container.innerHTML;
  root.unmount();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

function HighlandCow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="400" height="320">
      <path d="M162 108 Q186 112 184 136" stroke="#a85a28" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="184" cy="140" r="7" fill="#b5612c" />
      <path d="M60 128 V150 M80 132 V154 M120 132 V154 M140 128 V150" stroke="#8a4a22" strokeWidth="14" strokeLinecap="round" />
      <path d="M60 150 h1 M80 154 h1 M120 154 h1 M140 150 h1" stroke="#3a2418" strokeWidth="14" strokeLinecap="round" />
      <ellipse cx="100" cy="112" rx="64" ry="38" fill="#c8743a" />
      <path d="M52 104 q6 -8 12 0 M70 124 q6 -8 12 0 M118 126 q6 -8 12 0 M136 104 q6 -8 12 0 M96 136 q6 -8 12 0" stroke="#a85a28" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M62 50 Q30 46 20 20 Q40 34 66 38 Z" fill="#f3e3c3" stroke="#b89b6a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M138 50 Q170 46 180 20 Q160 34 134 38 Z" fill="#f3e3c3" stroke="#b89b6a" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="52" cy="64" rx="17" ry="8" fill="#c8743a" transform="rotate(-18 52 64)" />
      <ellipse cx="148" cy="64" rx="17" ry="8" fill="#c8743a" transform="rotate(18 148 64)" />
      <ellipse cx="100" cy="72" rx="40" ry="38" fill="#d98546" />
      <circle cx="86" cy="72" r="3.5" fill="#2a1a12" />
      <circle cx="114" cy="72" r="3.5" fill="#2a1a12" />
      <circle cx="87" cy="71" r="1.1" fill="#ffffff" />
      <circle cx="115" cy="71" r="1.1" fill="#ffffff" />
      <path d="M60 62 Q66 30 100 28 Q134 30 140 62 Q132 54 126 68 Q120 52 112 68 Q106 52 100 68 Q94 52 88 68 Q80 52 74 68 Q68 54 60 62Z" fill="#b5612c" />
      <path d="M76 40 q6 -6 10 2 M98 34 q6 -6 10 2 M116 42 q6 -6 10 2" stroke="#e39a5c" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="76" cy="88" r="6" fill="#ff8a98" opacity="0.4" />
      <circle cx="124" cy="88" r="6" fill="#ff8a98" opacity="0.4" />
      <ellipse cx="100" cy="96" rx="25" ry="16" fill="#f2b8a6" />
      <ellipse cx="92" cy="96" rx="3" ry="4" fill="#8a4a3a" />
      <ellipse cx="108" cy="96" rx="3" ry="4" fill="#8a4a3a" />
      <path d="M94 105 Q100 109 106 105" stroke="#8a4a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const HIGHLAND_COW = toDataUrl(<HighlandCow />);

export const NURSERY_ART = {
  horse: toDataUrl(<RockingHorse width={400} height={340} />),
  bears: [toDataUrl(<Bear variant="bow" width={340} height={464} />), toDataUrl(<Bear variant="pacifier" width={340} height={464} />)] as [string, string],
};

function Bear({ variant, width, height }: { variant: BearVariant; width?: number; height?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 232" width={width} height={height} className="bear-svg">
      <g>
        <circle cx="42" cy="48" r="20" fill="#a0673a" />
        <circle cx="42" cy="48" r="10" fill="#d9a273" />
        <circle cx="122" cy="48" r="20" fill="#a0673a" />
        <circle cx="122" cy="48" r="10" fill="#d9a273" />
        <ellipse cx="82" cy="170" rx="54" ry="42" fill="#a0673a" />
        <ellipse cx="82" cy="176" rx="31" ry="27" fill="#d9a273" />
        {[54, 110].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="214" rx="22" ry="14" fill="#8d5a32" />
            <ellipse cx={x} cy="217" rx="11" ry="7" fill="#d9a273" />
            <circle cx={x - 9} cy="206" r="3" fill="#d9a273" />
            <circle cx={x} cy="204" r="3" fill="#d9a273" />
            <circle cx={x + 9} cy="206" r="3" fill="#d9a273" />
          </g>
        ))}
        <ellipse cx="34" cy="160" rx="13" ry="24" fill="#8d5a32" transform="rotate(25 34 160)" />
        <circle cx="82" cy="84" r="50" fill="#a0673a" />
        <ellipse cx="82" cy="102" rx="22" ry="17" fill="#d9a273" />
        <ellipse cx="82" cy="93" rx="8" ry="6" fill="#3b2414" />
        <path d="M82 99 q-6 9 -12 4 M82 99 q6 9 12 4" stroke="#3b2414" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="64" cy="76" r="5.5" fill="#3b2414" />
        <circle cx="100" cy="76" r="5.5" fill="#3b2414" />
        <circle cx="66" cy="74" r="1.8" fill="#fff" />
        <circle cx="102" cy="74" r="1.8" fill="#fff" />
        <circle cx="54" cy="94" r="7" fill="#ff8a98" opacity="0.45" />
        <circle cx="110" cy="94" r="7" fill="#ff8a98" opacity="0.45" />
      </g>
      {variant === 'hat' && (
        <>
          <path d="M36 58 Q58 6 112 20 Q142 30 150 66 Q128 44 122 58 Z" fill="#c8102e" />
          <path d="M28 54 Q82 34 136 54 L136 68 Q82 50 28 68 Z" fill="#fbf3e4" />
          <circle cx="151" cy="70" r="10" fill="#fbf3e4" />
          <path d="M30 196 V138 q0 -14 12 -14 q12 0 12 12" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M30 196 V138 q0 -14 12 -14 q12 0 12 12" stroke="#c8102e" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="6 6" />
        </>
      )}
      {variant === 'scarf' && (
        <>
          <path d="M40 126 Q82 142 124 126 L126 140 Q82 156 38 140 Z" fill="#1f6b3a" />
          <path d="M98 140 l6 36 l14 -2 l-6 -38 Z" fill="#1f6b3a" />
          <path d="M44 129 l4 12 M58 133 l3 12 M72 135 l2 12 M90 135 l-1 12 M106 132 l-3 12" stroke="#fbf3e4" strokeWidth="3" />
          <path d="M101 160 h13 M103 168 h13" stroke="#fbf3e4" strokeWidth="3" />
          <rect x="14" y="146" width="40" height="34" rx="3" fill="#e3b54a" />
          <rect x="30" y="146" width="8" height="34" fill="#c8102e" />
          <rect x="14" y="159" width="40" height="7" fill="#c8102e" />
          <path d="M34 146 q-12 -14 -3 -16 q7 0 3 16 q3 -16 10 -16 q9 2 -10 16z" fill="#c8102e" />
        </>
      )}
      {variant === 'bow' && (
        <>
          <path d="M30 196 V120" stroke="#ffffff" strokeWidth="2" />
          <ellipse cx="30" cy="96" rx="20" ry="24" fill="#6fb1f5" />
          <path d="M26 121 L34 121 L30 115 Z" fill="#6fb1f5" />
          <ellipse cx="23" cy="88" rx="5" ry="8" fill="#fff" opacity="0.5" />
          <path d="M82 132 L58 120 L58 146 Z M82 132 L106 120 L106 146 Z" fill="#3b82d6" />
          <circle cx="82" cy="132" r="7" fill="#1d4f94" />
        </>
      )}
      {variant === 'pacifier' && (
        <>
          <path d="M50 126 Q82 150 114 126 Q112 160 82 166 Q52 160 50 126Z" fill="#cfe6ff" />
          <path d="M56 132 Q82 152 108 132" stroke="#6fb1f5" strokeWidth="3" fill="none" strokeDasharray="4 5" />
          <ellipse cx="82" cy="104" rx="15" ry="9" fill="#6fb1f5" />
          <circle cx="82" cy="104" r="5" fill="#ffffff" />
          <circle cx="82" cy="115" r="7" fill="none" stroke="#6fb1f5" strokeWidth="3" />
          <path d="M34 194 V162" stroke="#e9c46a" strokeWidth="5" strokeLinecap="round" />
          <circle cx="34" cy="148" r="15" fill="#f9e3a3" />
          <circle cx="34" cy="148" r="15" fill="none" stroke="#3b82d6" strokeWidth="3" strokeDasharray="5 5" />
        </>
      )}
      <g className="bear-wave">
        <ellipse cx="136" cy="118" rx="13" ry="25" fill="#8d5a32" transform="rotate(35 136 118)" />
        <circle cx="148" cy="98" r="9" fill="#d9a273" />
      </g>
    </svg>
  );
}

function SideBears({ variants, bubbles }: { variants: [BearVariant, BearVariant]; bubbles: [string, string] }) {
  return (
    <div aria-hidden="true">
      <div className="side-bear side-bear--left">
        <span className="bear-bubble">{bubbles[0]}</span>
        <Bear variant={variants[0]} />
      </div>
      <div className="side-bear side-bear--right">
        <span className="bear-bubble">{bubbles[1]}</span>
        <Bear variant={variants[1]} />
      </div>
    </div>
  );
}

export default function MaatjesScene({ theme, showProp }: { theme: Theme; showProp: boolean }) {
  const baby = theme.id === 'babyshower';
  return (
    <>
      {baby ? <Bunting /> : <Lights />}
      {baby ? <Stork /> : <Sleigh />}
      {showProp && (baby ? <Balloons /> : <ChristmasTree />)}
      {baby ? <Clouds /> : <SnowyForest />}
      <SideBears variants={baby ? ['bow', 'pacifier'] : ['hat', 'scarf']} bubbles={theme.bubbles} />
      <Snow confetti={baby} />
    </>
  );
}
