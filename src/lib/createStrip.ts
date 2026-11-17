export type CapturedPhoto = {
  blob: Blob;
  url: string;
};

const PHOTO_SIZE = 1200;
const FRAME = 68;
const GAP = 28;
const FOOTER = 190;
const STRIP_WIDTH = PHOTO_SIZE + FRAME * 2;
const STRIP_HEIGHT = FRAME * 2 + PHOTO_SIZE * 3 + GAP * 2 + FOOTER;

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
  bitmaps.forEach((bitmap, index) => {
    const y = FRAME + index * (PHOTO_SIZE + GAP);
    context.drawImage(bitmap, FRAME, y, PHOTO_SIZE, PHOTO_SIZE);
    bitmap.close();
  });

  await document.fonts.ready;
  context.fillStyle = '#204a3d';
  context.font = '700 43px Fraunces, Georgia, serif';
  context.fillText('KLIK KLAAR', FRAME, STRIP_HEIGHT - 82);
  context.textAlign = 'right';
  context.fillStyle = '#d95643';
  context.font = '700 24px "DM Sans", sans-serif';
  context.fillText('DRIE MOMENTEN', STRIP_WIDTH - FRAME, STRIP_HEIGHT - 85);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('De fotostrip kon niet worden opgeslagen.'));
    }, 'image/png');
  });
}