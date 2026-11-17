export type CapturedPhoto = {
  blob: Blob;
  url: string;
};

const PHOTO_SIZE = 1200;
const FRAME = 132;
const GAP = 42;
const HEADER = 210;
const FOOTER = 320;
const STRIP_WIDTH = PHOTO_SIZE + FRAME * 2;
const STRIP_HEIGHT = HEADER + PHOTO_SIZE * 3 + GAP * 2 + FOOTER;

function drawHolly(context: CanvasRenderingContext2D, x: number, y: number, scale = 1, flip = 1, rotation = 0) {
  context.save();
  context.translate(x, y);
  context.scale(flip * scale, scale);
  context.rotate(rotation);

  for (const angle of [-0.82, 0, 0.82]) {
    context.save();
    context.rotate(angle);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(9, -11);
    context.lineTo(9, -22);
    context.lineTo(18, -17);
    context.lineTo(29, -22);
    context.lineTo(28, -10);
    context.lineTo(39, -5);
    context.lineTo(28, 2);
    context.lineTo(31, 14);
    context.lineTo(19, 10);
    context.lineTo(12, 20);
    context.lineTo(8, 8);
    context.closePath();
    context.fillStyle = '#245b3d';
    context.fill();
    context.strokeStyle = '#17462f';
    context.lineWidth = 1.5;
    context.stroke();
    context.beginPath();
    context.moveTo(4, 2);
    context.lineTo(28, -12);
    context.strokeStyle = '#88a96e';
    context.lineWidth = 1.25;
    context.stroke();
    context.restore();
  }

  for (const [berryX, berryY] of [[15, 0], [24, 5], [19, 13]]) {
    context.beginPath();
    context.arc(berryX, berryY, 5, 0, Math.PI * 2);
    context.fillStyle = '#bd493a';
    context.fill();
    context.beginPath();
    context.arc(berryX - 1.5, berryY - 1.5, 1.4, 0, Math.PI * 2);
    context.fillStyle = '#f2b28f';
    context.fill();
  }
  context.restore();
}

function drawSnowflake(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = '#b7a56c';
  context.lineWidth = 2;
  context.lineCap = 'round';
  for (let arm = 0; arm < 6; arm += 1) {
    context.save();
    context.rotate((Math.PI / 3) * arm);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, -size);
    context.moveTo(0, -size * 0.55);
    context.lineTo(-size * 0.2, -size * 0.76);
    context.moveTo(0, -size * 0.55);
    context.lineTo(size * 0.2, -size * 0.76);
    context.stroke();
    context.restore();
  }
  context.restore();
}

function drawBauble(context: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  context.beginPath();
  context.moveTo(x, y - radius - 14);
  context.lineTo(x, y - radius - 3);
  context.strokeStyle = '#e0c47e';
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = '#d7bd7d';
  context.fillRect(x - radius * 0.32, y - radius - 4, radius * 0.64, 7);

  const gradient = context.createRadialGradient(x - radius * 0.35, y - radius * 0.38, 1, x, y, radius);
  gradient.addColorStop(0, '#fff0cc');
  gradient.addColorStop(0.25, color);
  gradient.addColorStop(1, '#7f2825');
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = '#e4cb86';
  context.lineWidth = 2;
  context.stroke();

  context.beginPath();
  context.ellipse(x - radius * 0.32, y - radius * 0.35, radius * 0.14, radius * 0.26, -0.5, 0, Math.PI * 2);
  context.fillStyle = 'rgba(255, 250, 224, .78)';
  context.fill();
}

function drawBell(context: CanvasRenderingContext2D, x: number, y: number, flip = 1) {
  context.save();
  context.translate(x, y);
  context.scale(flip, 1);
  context.strokeStyle = '#f1d98c';
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(-2, -33);
  context.bezierCurveTo(-2, -48, 23, -48, 23, -33);
  context.stroke();

  context.beginPath();
  context.moveTo(0, -27);
  context.bezierCurveTo(-3, -6, -23, 12, -28, 24);
  context.quadraticCurveTo(-1, 38, 29, 22);
  context.bezierCurveTo(20, 7, 7, -9, 8, -27);
  context.closePath();
  const gold = context.createLinearGradient(-18, 0, 20, 18);
  gold.addColorStop(0, '#fff0b0');
  gold.addColorStop(0.42, '#d7aa4e');
  gold.addColorStop(1, '#8e6128');
  context.fillStyle = gold;
  context.fill();
  context.strokeStyle = '#f4d985';
  context.lineWidth = 2;
  context.stroke();

  context.beginPath();
  context.ellipse(0, 23, 30, 7, 0, 0, Math.PI * 2);
  context.fillStyle = '#f2d47d';
  context.fill();
  context.beginPath();
  context.arc(0, 33, 5, 0, Math.PI * 2);
  context.fillStyle = '#bd493a';
  context.fill();
  context.restore();
}

function drawChristmasFrame(context: CanvasRenderingContext2D) {
  context.fillStyle = '#aa302b';
  context.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);

  context.save();
  context.beginPath();
  context.rect(8, 0, 28, STRIP_HEIGHT);
  context.rect(STRIP_WIDTH - 36, 0, 28, STRIP_HEIGHT);
  context.clip();
  for (let y = -52; y < STRIP_HEIGHT + 72; y += 104) {
    context.beginPath();
    context.moveTo(8, y);
    context.lineTo(36, y + 28);
    context.lineTo(36, y + 68);
    context.lineTo(8, y + 40);
    context.closePath();
    context.fillStyle = '#f3e7d0';
    context.fill();
    context.beginPath();
    context.moveTo(STRIP_WIDTH - 36, y + 28);
    context.lineTo(STRIP_WIDTH - 8, y);
    context.lineTo(STRIP_WIDTH - 8, y + 40);
    context.lineTo(STRIP_WIDTH - 36, y + 68);
    context.closePath();
    context.fillStyle = '#f3e7d0';
    context.fill();
  }
  context.restore();

  context.fillStyle = '#fffdf5';
  context.fillRect(FRAME - 16, HEADER - 14, PHOTO_SIZE + 32, STRIP_HEIGHT - HEADER - FOOTER + 28);
  context.strokeStyle = '#26553d';
  context.lineWidth = 6;
  context.strokeRect(13, 13, STRIP_WIDTH - 26, STRIP_HEIGHT - 26);
  context.strokeStyle = '#d7bd7d';
  context.lineWidth = 3;
  context.strokeRect(28, 28, STRIP_WIDTH - 56, STRIP_HEIGHT - 56);

  context.textAlign = 'center';
  context.fillStyle = '#fff3d4';
  context.font = '700 34px "DM Sans", sans-serif';
  context.fillText('KERSTEDITIE 2026', STRIP_WIDTH / 2, 63);
  drawBell(context, 148, 105);
  drawBell(context, STRIP_WIDTH - 148, 105, -1);

  context.beginPath();
  context.moveTo(215, 143);
  context.quadraticCurveTo(STRIP_WIDTH / 2, 162, STRIP_WIDTH - 215, 143);
  context.strokeStyle = '#e9c977';
  context.lineWidth = 2;
  context.stroke();
  for (let bulb = 0; bulb < 13; bulb += 1) {
    const x = 232 + bulb * ((STRIP_WIDTH - 464) / 12);
    const curve = (x - STRIP_WIDTH / 2) / (STRIP_WIDTH / 2);
    const y = 143 + (1 - curve * curve) * 8;
    context.beginPath();
    context.arc(x, y + 4, 9, 0, Math.PI * 2);
    context.fillStyle = ['#d7ad55', '#bd493a', '#597e54'][bulb % 3];
    context.fill();
  }

  drawHolly(context, 74, 80, 1.7);
  drawHolly(context, STRIP_WIDTH - 74, 80, 1.7, -1);
  drawHolly(context, 74, STRIP_HEIGHT - 45, 1.7, 1, -0.9);
  drawHolly(context, STRIP_WIDTH - 74, STRIP_HEIGHT - 45, 1.7, -1, 0.9);

  const baubles: [number, number, number, string][] = [
    [61, HEADER + 290, 19, '#d64b38'],
    [STRIP_WIDTH - 61, HEADER + 760, 17, '#e1ba5f'],
    [61, HEADER + 1530, 16, '#e1ba5f'],
    [STRIP_WIDTH - 61, HEADER + 1900, 20, '#d64b38'],
    [61, STRIP_HEIGHT - FOOTER - 520, 17, '#d64b38'],
    [STRIP_WIDTH - 61, STRIP_HEIGHT - FOOTER - 190, 18, '#e1ba5f'],
  ];
  for (const [x, y, radius, color] of baubles) {
    drawBauble(context, x, y, radius, color);
  }

  for (let y = HEADER + 450, row = 0; y < STRIP_HEIGHT - FOOTER + 50; y += 430, row += 1) {
    const side = row % 2 === 0 ? 1 : -1;
    for (const x of [61, STRIP_WIDTH - 61]) {
      drawSnowflake(context, x + side * 25, y + 145, 18);
    }
  }
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

export async function createStrip(photos: CapturedPhoto[]): Promise<Blob> {
  if (photos.length !== 3) throw new Error('Maak eerst drie foto\'s.');
  const bitmaps = await Promise.all(photos.map((photo) => createImageBitmap(photo.blob)));
  const canvas = document.createElement('canvas');
  canvas.width = STRIP_WIDTH;
  canvas.height = STRIP_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmaps.forEach((bitmap) => bitmap.close());
    throw new Error('De fotostrip kon niet worden gemaakt.');
  }

  context.fillStyle = '#fffdf5';
  context.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);
  drawChristmasFrame(context);
  bitmaps.forEach((bitmap, index) => {
    const y = HEADER + index * (PHOTO_SIZE + GAP);
    context.drawImage(bitmap, FRAME, y, PHOTO_SIZE, PHOTO_SIZE);
    bitmap.close();
  });

  await document.fonts.ready;
  context.fillStyle = '#204a3d';
  context.textAlign = 'left';
  context.font = 'italic 700 54px Fraunces, Georgia, serif';
  context.fillText('KERSTMOMENTEN', FRAME + 36, STRIP_HEIGHT - 126);
  context.textAlign = 'right';
  context.fillStyle = '#a64035';
  context.font = '700 29px "DM Sans", sans-serif';
  context.fillText('FIJNE FEESTDAGEN', STRIP_WIDTH - FRAME - 36, STRIP_HEIGHT - 126);
  context.textAlign = 'center';
  context.fillStyle = '#54714d';
  context.font = '600 23px Fraunces, Georgia, serif';
  context.fillText('Een kerst om te bewaren', STRIP_WIDTH / 2, STRIP_HEIGHT - 71);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('De fotostrip kon niet worden opgeslagen.'));
    }, 'image/png');
  });
}