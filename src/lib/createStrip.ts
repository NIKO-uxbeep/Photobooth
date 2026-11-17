export type CapturedPhoto = {
  blob: Blob;
  url: string;
};

const PHOTO_SIZE = 1200;
const FRAME = 68;
const GAP = 28;
const HEADER = 128;
const FOOTER = 240;
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

function drawChristmasFrame(context: CanvasRenderingContext2D) {
  context.fillStyle = '#1c4b38';
  context.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);
  context.fillStyle = '#fffdf5';
  context.fillRect(25, 25, STRIP_WIDTH - 50, STRIP_HEIGHT - 50);
  context.strokeStyle = '#bd493a';
  context.lineWidth = 3;
  context.strokeRect(12, 12, STRIP_WIDTH - 24, STRIP_HEIGHT - 24);
  context.strokeStyle = '#d7bd7d';
  context.lineWidth = 2;
  context.strokeRect(29, 29, STRIP_WIDTH - 58, STRIP_HEIGHT - 58);

  context.textAlign = 'center';
  context.fillStyle = '#204a3d';
  context.font = '700 24px "DM Sans", sans-serif';
  context.fillText('KERSTEDITIE 2026', STRIP_WIDTH / 2, 59);

  context.beginPath();
  context.moveTo(118, 101);
  context.quadraticCurveTo(STRIP_WIDTH / 2, 112, STRIP_WIDTH - 118, 101);
  context.strokeStyle = '#54714d';
  context.lineWidth = 2;
  context.stroke();
  for (let bulb = 0; bulb < 13; bulb += 1) {
    const x = 132 + bulb * ((STRIP_WIDTH - 264) / 12);
    const curve = (x - STRIP_WIDTH / 2) / (STRIP_WIDTH / 2);
    const y = 101 + (1 - curve * curve) * 5;
    context.beginPath();
    context.arc(x, y + 3, 7, 0, Math.PI * 2);
    context.fillStyle = ['#d7ad55', '#bd493a', '#597e54'][bulb % 3];
    context.fill();
  }

  drawHolly(context, 42, 72, 1.45);
  drawHolly(context, STRIP_WIDTH - 42, 72, 1.45, -1);
  drawHolly(context, 42, STRIP_HEIGHT - 35, 1.45, 1, -0.9);
  drawHolly(context, STRIP_WIDTH - 42, STRIP_HEIGHT - 35, 1.45, -1, 0.9);

  for (let y = HEADER + 430, row = 0; y < STRIP_HEIGHT - FOOTER + 80; y += 360, row += 1) {
    const side = row % 2 === 0 ? 1 : -1;
    for (const x of [34, STRIP_WIDTH - 34]) {
      context.beginPath();
      context.arc(x, y, 7, 0, Math.PI * 2);
      context.fillStyle = row % 3 === 0 ? '#bd493a' : row % 3 === 1 ? '#d7ad55' : '#547e59';
      context.fill();
      drawSnowflake(context, x + side * 20, y + 142, 14);
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
  context.font = '700 44px Fraunces, Georgia, serif';
  context.fillText('KERSTMOMENTEN', FRAME + 30, STRIP_HEIGHT - 88);
  context.textAlign = 'right';
  context.fillStyle = '#a64035';
  context.font = '700 25px "DM Sans", sans-serif';
  context.fillText('VROLIJK KERSTFEEST', STRIP_WIDTH - FRAME - 30, STRIP_HEIGHT - 91);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('De fotostrip kon niet worden opgeslagen.'));
    }, 'image/png');
  });
}