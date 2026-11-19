export type CapturedPhoto = {
  blob: Blob;
  url: string;
};

export type CollageStyle =
  | { kind: 'photo'; background: string }
  | { kind: 'nursery'; title: string; bears: [string, string]; horse: string };

type Picture = ImageBitmap | HTMLImageElement;

const PHOTO_SIZE = 1200;
const STRIP_WIDTH = 1080;
const STRIP_HEIGHT = 1920;
const POLAROIDS = [
  { x: 700, y: 600, size: 470, rotation: 0.05 },
  { x: 330, y: 1050, size: 430, rotation: -0.06 },
  { x: 640, y: 1500, size: 520, rotation: -0.035 },
] as const;
const SPARKLE_COLORS = ['255, 214, 120', '255, 236, 190', '255, 245, 220', '255, 190, 140'];

const images = new Map<string, Promise<HTMLImageElement>>();

function loadImage(url: string) {
  let image = images.get(url);
  if (!image) {
    const element = new Image();
    element.src = url;
    image = element.decode().then(
      () => element,
      (error: unknown) => {
        images.delete(url);
        throw error;
      },
    );
    images.set(url, image);
  }
  return image;
}

function pictureSize(picture: Picture) {
  return picture instanceof HTMLImageElement
    ? { width: picture.naturalWidth, height: picture.naturalHeight }
    : { width: picture.width, height: picture.height };
}

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function drawGlow(context: CanvasRenderingContext2D, x: number, y: number, radius: number, rgb: string, alpha: number) {
  const glow = context.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `rgba(${rgb}, ${alpha})`);
  glow.addColorStop(0.6, `rgba(${rgb}, ${alpha * 0.35})`);
  glow.addColorStop(1, `rgba(${rgb}, 0)`);
  context.fillStyle = glow;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function drawSparkle(context: CanvasRenderingContext2D, x: number, y: number, size: number, rgb: string) {
  drawGlow(context, x, y, size * 1.7, rgb, 0.5);
  context.beginPath();
  context.moveTo(x, y - size);
  context.quadraticCurveTo(x, y, x + size, y);
  context.quadraticCurveTo(x, y, x, y + size);
  context.quadraticCurveTo(x, y, x - size, y);
  context.quadraticCurveTo(x, y, x, y - size);
  context.fillStyle = 'rgba(255, 255, 255, .9)';
  context.fill();
}

function drawShimmer(context: CanvasRenderingContext2D) {
  const random = createRandom(2026);
  context.save();
  context.globalCompositeOperation = 'lighter';
  for (let index = 0; index < 1800; index += 1) {
    const x = random() * STRIP_WIDTH;
    const y = random() * STRIP_HEIGHT;
    const size = 0.6 + random() * 1.8;
    context.fillStyle = `rgba(${SPARKLE_COLORS[index % SPARKLE_COLORS.length]}, ${0.15 + random() * 0.55})`;
    context.fillRect(x, y, size, size);
  }
  for (let index = 0; index < 50; index += 1) {
    const x = random() * STRIP_WIDTH;
    const y = random() * STRIP_HEIGHT;
    drawSparkle(context, x, y, 5 + random() * 14, SPARKLE_COLORS[index % SPARKLE_COLORS.length]);
  }
  context.restore();
}

function drawSnow(context: CanvasRenderingContext2D) {
  const random = createRandom(1225);
  for (let index = 0; index < 320; index += 1) {
    const x = random() * STRIP_WIDTH;
    const y = random() * STRIP_HEIGHT;
    const radius = 1.5 + random() ** 2 * 7;
    const flake = context.createRadialGradient(x, y, 0, x, y, radius);
    flake.addColorStop(0, `rgba(255, 255, 255, ${0.65 + random() * 0.35})`);
    flake.addColorStop(0.55, 'rgba(255, 255, 255, .45)');
    flake.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = flake;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawCoverPhoto(context: CanvasRenderingContext2D, picture: Picture, x: number, y: number, width: number, height: number) {
  const size = pictureSize(picture);
  const sourceAspect = size.width / size.height;
  const targetAspect = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = size.width;
  let sourceHeight = size.height;

  if (sourceAspect > targetAspect) {
    sourceWidth = size.height * targetAspect;
    sourceX = (size.width - sourceWidth) / 2;
  } else {
    sourceHeight = size.width / targetAspect;
    sourceY = (size.height - sourceHeight) / 2;
  }

  context.drawImage(picture, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawPhotoBackground(context: CanvasRenderingContext2D, background: Picture) {
  drawCoverPhoto(context, background, 0, 0, STRIP_WIDTH, STRIP_HEIGHT);
  const vignette = context.createRadialGradient(STRIP_WIDTH / 2, STRIP_HEIGHT / 2, 420, STRIP_WIDTH / 2, STRIP_HEIGHT / 2, 1150);
  vignette.addColorStop(0, 'rgba(10, 4, 2, .25)');
  vignette.addColorStop(1, 'rgba(10, 4, 2, .5)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);
  context.save();
  context.globalCompositeOperation = 'lighter';
  drawGlow(context, STRIP_WIDTH / 2, STRIP_HEIGHT / 2, 820, '255, 180, 100', 0.18);
  context.restore();
}

function drawStar(context: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  context.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const angle = -Math.PI / 2 + (point * Math.PI) / 5;
    const distance = point % 2 ? radius * 0.45 : radius;
    context.lineTo(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
  }
  context.closePath();
  context.fillStyle = color;
  context.fill();
}

function drawCloud(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  context.fillStyle = 'rgba(255, 255, 255, .78)';
  for (const [dx, dy, radius] of [[-60, 10, 38], [-20, -12, 50], [30, -4, 44], [70, 12, 32], [0, 18, 40]] as const) {
    context.beginPath();
    context.arc(x + dx * scale, y + dy * scale, radius * scale, 0, Math.PI * 2);
    context.fill();
  }
}

function drawNurseryBackground(context: CanvasRenderingContext2D) {
  const sky = context.createLinearGradient(0, 0, 0, STRIP_HEIGHT);
  sky.addColorStop(0, '#dceeff');
  sky.addColorStop(0.55, '#b4d7f7');
  sky.addColorStop(1, '#8fc0ee');
  context.fillStyle = sky;
  context.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);

  context.fillStyle = 'rgba(255, 255, 255, .35)';
  for (let y = 30, row = 0; y < STRIP_HEIGHT; y += 70, row += 1) {
    for (let x = row % 2 ? 65 : 30; x < STRIP_WIDTH; x += 70) {
      context.beginPath();
      context.arc(x, y, 5, 0, Math.PI * 2);
      context.fill();
    }
  }
  for (const [x, y, scale] of [[170, 330, 1.1], [940, 280, 0.9], [900, 1250, 1], [110, 1320, 0.8], [560, 1880, 1.4], [980, 1860, 0.9]] as const) {
    drawCloud(context, x, y, scale);
  }
  const random = createRandom(714);
  for (let index = 0; index < 34; index += 1) {
    drawStar(context, random() * STRIP_WIDTH, random() * STRIP_HEIGHT, 6 + random() * 10, index % 3 ? 'rgba(242, 207, 107, .85)' : 'rgba(255, 255, 255, .9)');
  }
}

function drawArt(context: CanvasRenderingContext2D, art: HTMLImageElement, x: number, y: number, width: number, rotation = 0) {
  const height = width * (art.naturalHeight / art.naturalWidth);
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(rotation);
  context.shadowColor = 'rgba(29, 63, 115, .25)';
  context.shadowBlur = 18;
  context.shadowOffsetY = 8;
  context.drawImage(art, -width / 2, -height / 2, width, height);
  context.restore();
}

function drawTitle(context: CanvasRenderingContext2D, title: string) {
  let size = 160;
  context.font = `${size}px "Great Vibes", cursive`;
  while (context.measureText(title).width > 940 && size > 60) {
    size -= 4;
    context.font = `${size}px "Great Vibes", cursive`;
  }
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.shadowColor = 'rgba(255, 255, 255, .95)';
  context.shadowBlur = 22;
  context.fillStyle = '#1d3f73';
  context.fillText(title, STRIP_WIDTH / 2, 200);
  context.restore();
  const half = context.measureText(title).width / 2;
  drawStar(context, STRIP_WIDTH / 2 - half - 26, 120, 14, '#f2cf6b');
  drawStar(context, STRIP_WIDTH / 2 + half + 26, 120, 14, '#f2cf6b');
}

function drawPolaroid(context: CanvasRenderingContext2D, bitmap: ImageBitmap, { x, y, size, rotation }: (typeof POLAROIDS)[number]) {
  const width = size + 52;
  const height = size + 150;
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.save();
  context.shadowColor = 'rgba(0, 0, 0, .55)';
  context.shadowBlur = 34;
  context.shadowOffsetY = 16;
  const paper = context.createLinearGradient(0, -height / 2, 0, height / 2);
  paper.addColorStop(0, '#fdfcf8');
  paper.addColorStop(1, '#ece8de');
  context.fillStyle = paper;
  context.fillRect(-width / 2, -height / 2, width, height);
  context.restore();
  const photoX = -size / 2;
  const photoY = -height / 2 + 26;
  drawCoverPhoto(context, bitmap, photoX, photoY, size, size);
  context.strokeStyle = 'rgba(0, 0, 0, .14)';
  context.lineWidth = 2;
  context.strokeRect(photoX, photoY, size, size);
  context.restore();
}

function drawTape(context: CanvasRenderingContext2D, x: number, y: number, width: number, rotation: number) {
  const height = 54;
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.beginPath();
  context.moveTo(-width / 2, -height / 2);
  context.lineTo(width / 2, -height / 2);
  for (let step = 0; step <= 6; step += 1) context.lineTo(width / 2 + (step % 2 ? -7 : 0), -height / 2 + (height / 6) * step);
  context.lineTo(-width / 2, height / 2);
  for (let step = 6; step >= 0; step -= 1) context.lineTo(-width / 2 + (step % 2 ? 7 : 0), -height / 2 + (height / 6) * step);
  context.closePath();
  context.fillStyle = 'rgba(222, 222, 214, .78)';
  context.shadowColor = 'rgba(0, 0, 0, .2)';
  context.shadowBlur = 6;
  context.fill();
  context.shadowColor = 'transparent';
  context.strokeStyle = 'rgba(255, 255, 255, .3)';
  context.lineWidth = 2;
  for (let line = -width / 2 + 18; line < width / 2 - 10; line += 22) {
    context.beginPath();
    context.moveTo(line, -height / 2 + 6);
    context.lineTo(line + 10, height / 2 - 6);
    context.stroke();
  }
  context.restore();
}

function drawHeart(context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.beginPath();
  context.moveTo(0, size * 0.35);
  context.bezierCurveTo(-size * 1.1, -size * 0.35, -size * 0.45, -size * 1.05, 0, -size * 0.45);
  context.bezierCurveTo(size * 0.45, -size * 1.05, size * 1.1, -size * 0.35, 0, size * 0.35);
  context.fillStyle = 'rgba(236, 236, 232, .82)';
  context.shadowColor = 'rgba(255, 255, 255, .35)';
  context.shadowBlur = 10;
  context.fill();
  context.restore();
}

function drawDoodles(context: CanvasRenderingContext2D) {
  drawHeart(context, 250, 400, 58, -0.25);
  drawHeart(context, 305, 520, 30, 0.2);
  drawHeart(context, 920, 1060, 36, 0.3);
  context.save();
  context.strokeStyle = 'rgba(240, 240, 236, .85)';
  context.lineWidth = 5;
  context.lineCap = 'round';
  for (const [x, y, size] of [[140, 620, 26], [990, 1000, 18], [190, 1640, 30]] as const) {
    context.beginPath();
    for (let arm = 0; arm < 4; arm += 1) {
      const angle = (Math.PI / 4) * arm;
      context.moveTo(x - Math.cos(angle) * size, y - Math.sin(angle) * size);
      context.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
    }
    context.stroke();
  }
  context.restore();
}

export async function capturePhoto(video: HTMLVideoElement): Promise<Blob> {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!sourceWidth || !sourceHeight) throw new Error('De camera is nog niet klaar.');

  const side = Math.min(sourceWidth, sourceHeight);
  const sourceX = Math.floor((sourceWidth - side) / 2);
  const sourceY = Math.floor((sourceHeight - side) / 2);
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('De foto kon niet worden verwerkt.');
  context.drawImage(video, sourceX, sourceY, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('De foto kon niet worden verwerkt.'));
    }, 'image/jpeg', 0.92);
  });
}

export async function createStrip(photos: CapturedPhoto[], style: CollageStyle): Promise<Blob> {
  if (photos.length !== 3) throw new Error('Maak eerst drie foto\'s.');
  const artUrls = style.kind === 'photo' ? [style.background] : [style.horse, ...style.bears];
  const [art, bitmaps] = await Promise.all([
    Promise.all(artUrls.map(loadImage)),
    Promise.all(photos.map((photo) => createImageBitmap(photo.blob))),
    style.kind === 'nursery' ? document.fonts.load('160px "Great Vibes"').catch(() => []) : null,
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = STRIP_WIDTH;
  canvas.height = STRIP_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmaps.forEach((bitmap) => bitmap.close());
    throw new Error('De fotostrip kon niet worden gemaakt.');
  }

  if (style.kind === 'photo') {
    drawPhotoBackground(context, art[0]);
    drawShimmer(context);
    drawSnow(context);
    drawDoodles(context);
  } else {
    const [horse, leftBear, rightBear] = art;
    drawNurseryBackground(context);
    drawTitle(context, style.title);
    drawArt(context, rightBear, 110, 390, 270, -0.06);
    drawArt(context, horse, 690, 905, 310, 0.04);
    drawArt(context, leftBear, 30, 1490, 300, 0.05);
    drawArt(context, horse, 944, 1690, 124, -0.1);
  }
  bitmaps.forEach((bitmap, index) => drawPolaroid(context, bitmap, POLAROIDS[index]));
  drawTape(context, 716, 294, 210, 0.03);
  drawTape(context, 912, 1168, 150, 0.72);
  bitmaps.forEach((bitmap) => bitmap.close());

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('De fotostrip kon niet worden opgeslagen.'));
    }, 'image/png');
  });
}
