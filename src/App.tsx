import { useEffect, useRef, useState } from 'react';
import {
  Aperture,
  ArrowDownToLine,
  Check,
  ChevronRight,
  ImagePlus,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { capturePhoto, createStrip, type CapturedPhoto } from './lib/createStrip';

type Mode = 'ready' | 'camera' | 'review' | 'result';
type BrowserWithShare = Navigator & {
  canShare?: (data?: ShareData) => boolean;
};

const EMPTY_PHOTOS: (CapturedPhoto | null)[] = [null, null, null];

function getCameraError(error: unknown) {
  if (!(error instanceof DOMException)) return 'De camera kon niet worden gestart. Probeer het nog een keer.';
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return 'Cameratoegang is geweigerd. Pas de camerarechten aan in je browserinstellingen.';
  }
  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'Er is geen camera gevonden op dit apparaat.';
  }
  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'De camera is al in gebruik door een andere app.';
  }
  if (error.name === 'SecurityError') return 'De camera werkt alleen op een beveiligde HTTPS-verbinding.';
  return 'De camera kon niet worden gestart. Controleer de camerarechten en probeer opnieuw.';
}

export default function App() {
  const [photos, setPhotos] = useState<(CapturedPhoto | null)[]>(EMPTY_PHOTOS);
  const [mode, setMode] = useState<Mode>('ready');
  const [activeSlot, setActiveSlot] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [stripUrl, setStripUrl] = useState('');
  const [stripBlob, setStripBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photosRef = useRef<(CapturedPhoto | null)[]>(EMPTY_PHOTOS);
  const stripUrlRef = useRef('');

  const photoCount = photos.filter(Boolean).length;

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }

  function clearStrip() {
    if (stripUrlRef.current) URL.revokeObjectURL(stripUrlRef.current);
    stripUrlRef.current = '';
    setStripUrl('');
    setStripBlob(null);
  }

  function releasePhotos() {
    photosRef.current.forEach((photo) => {
      if (photo) URL.revokeObjectURL(photo.url);
    });
    photosRef.current = EMPTY_PHOTOS;
    setPhotos(EMPTY_PHOTOS);
  }

  useEffect(() => {
    if (mode !== 'camera' || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => setError('De camerabeelden konden niet worden getoond.'));
  }, [mode]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      photosRef.current.forEach((photo) => {
        if (photo) URL.revokeObjectURL(photo.url);
      });
      if (stripUrlRef.current) URL.revokeObjectURL(stripUrlRef.current);
    },
    [],
  );

  async function startCamera(slot: number) {
    setError('');
    clearStrip();
    setActiveSlot(slot);
    if (!window.isSecureContext && location.hostname !== 'localhost') {
      setError('Voor cameratoegang moet deze website via HTTPS geopend zijn.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Deze browser biedt geen live cameratoegang. Open de site in Safari of Chrome.');
      return;
    }

    setPending(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1920 },
        },
      });
      streamRef.current = stream;
      setCameraReady(false);
      setMode('camera');
    } catch (cameraError) {
      setError(getCameraError(cameraError));
    } finally {
      setPending(false);
    }
  }

  async function takePhoto() {
    const video = videoRef.current;
    if (!video || !cameraReady || pending) return;
    setPending(true);
    setError('');
    try {
      const blob = await capturePhoto(video);
      const next = [...photosRef.current];
      const previous = next[activeSlot];
      if (previous) URL.revokeObjectURL(previous.url);
      next[activeSlot] = { blob, url: URL.createObjectURL(blob) };
      photosRef.current = next;
      setPhotos(next);

      const nextEmptySlot = next.findIndex((photo) => photo === null);
      if (nextEmptySlot === -1) {
        stopCamera();
        setMode('review');
      } else {
        setActiveSlot(nextEmptySlot);
      }
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : 'De foto kon niet worden gemaakt.');
    } finally {
      setPending(false);
    }
  }

  function cancelCamera() {
    stopCamera();
    setError('');
    setMode(photoCount > 0 ? 'review' : 'ready');
  }

  async function makeStrip() {
    const captured = photosRef.current.filter((photo): photo is CapturedPhoto => photo !== null);
    if (captured.length !== 3) return;
    setPending(true);
    setError('');
    try {
      const blob = await createStrip(captured);
      const url = URL.createObjectURL(blob);
      stripUrlRef.current = url;
      setStripBlob(blob);
      setStripUrl(url);
      setMode('result');
    } catch (stripError) {
      setError(stripError instanceof Error ? stripError.message : 'De fotostrip kon niet worden gemaakt.');
    } finally {
      setPending(false);
    }
  }

  function downloadStrip() {
    if (!stripUrl) return;
    const link = document.createElement('a');
    link.href = stripUrl;
    link.download = 'mijn-fotostrip.png';
    document.body.append(link);
    link.click();
    link.remove();
  }

  async function shareStrip() {
    if (!stripBlob) return;
    const file = new File([stripBlob], 'mijn-fotostrip.png', { type: 'image/png' });
    const browser = navigator as BrowserWithShare;
    if (navigator.share && browser.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Mijn fotostrip' });
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
        setError('Delen is niet gelukt. Je kunt de fotostrip ook downloaden.');
      }
    } else {
      downloadStrip();
    }
  }

  function newSession() {
    stopCamera();
    clearStrip();
    releasePhotos();
    setMode('ready');
    setActiveSlot(0);
    setError('');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Klik Klaar startpagina">
          <span className="brand-mark"><Aperture size={22} strokeWidth={2.2} /></span>
          <span>KLIK KLAAR</span>
        </a>
        <div className="privacy-tag"><ShieldCheck size={16} /> Alleen op jouw apparaat</div>
      </header>

      <div className="intro-row">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> DE FOTOSTUDIO IN JE ZAK</p>
          <h1>Drie keer klik.<br /><span>Eentje voor later.</span></h1>
        </div>
        <p className="intro-note">Kleine momenten verdienen een plek buiten je camerarol.</p>
      </div>

      <div className="workspace">
        <section className="shoot-panel" aria-labelledby="shoot-title">
          <div className="section-topline">
            <div>
              <p className="section-kicker">01 / OPNEMEN</p>
              <h2 id="shoot-title">Jouw drie momenten</h2>
            </div>
            <span className="shot-count">{String(photoCount).padStart(2, '0')} <span>/ 03</span></span>
          </div>

          <div className={`viewfinder ${mode === 'camera' ? 'viewfinder-live' : ''}`}>
            {mode === 'camera' ? (
              <video
                ref={videoRef}
                className="camera-video"
                autoPlay
                muted
                playsInline
                onCanPlay={() => setCameraReady(true)}
              />
            ) : (
              <div className="viewfinder-empty">
                <span className="finder-mark finder-top-left" />
                <span className="finder-mark finder-top-right" />
                <span className="finder-mark finder-bottom-left" />
                <span className="finder-mark finder-bottom-right" />
                <span className="placeholder-aperture"><Aperture size={34} strokeWidth={1.5} /></span>
                <span className="viewfinder-label">
                  {mode === 'result' ? 'Moment vastgelegd' : mode === 'review' ? 'Drie momenten klaar' : 'Klaar voor jouw moment'}
                </span>
              </div>
            )}
            {mode === 'camera' && <span className="live-badge"><span /> LIVE</span>}
          </div>

          <div className="capture-meta">
            <div className="step-dots" aria-label={`${photoCount} van 3 foto's gemaakt`}>
              {[0, 1, 2].map((slot) => (
                <span className={photos[slot] ? 'step-dot step-dot-filled' : 'step-dot'} key={slot} />
              ))}
            </div>
            <span className="capture-hint" aria-live="polite">
              {mode === 'camera' ? `Foto ${activeSlot + 1} van 3` : mode === 'result' ? 'Je strip is klaar' : `${photoCount} van 3 foto's`}
            </span>
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <div className="primary-actions">
            {mode === 'ready' && (
              <button className="button button-primary" onClick={() => void startCamera(0)} disabled={pending}>
                <Aperture size={19} /> {pending ? 'Camera starten...' : 'Start camera'} <ChevronRight size={18} />
              </button>
            )}
            {mode === 'camera' && (
              <div className="camera-controls">
                <button className="button button-primary" onClick={() => void takePhoto()} disabled={!cameraReady || pending}>
                  <span className="shutter-icon"><span /></span> {pending ? 'Even wachten...' : 'Maak foto'}
                </button>
                <button className="button button-quiet" onClick={cancelCamera} aria-label="Camera sluiten" title="Camera sluiten">
                  <X size={20} />
                </button>
              </div>
            )}
            {mode === 'review' && (
              <button className="button button-primary" onClick={() => void makeStrip()} disabled={pending}>
                <Sparkles size={18} /> {pending ? 'Strip maken...' : 'Maak mijn fotostrip'} <ChevronRight size={18} />
              </button>
            )}
            {mode === 'result' && (
              <button className="button button-primary" onClick={downloadStrip}>
                <ArrowDownToLine size={18} /> Download fotostrip
              </button>
            )}
          </div>

          {mode === 'review' && (
            <div className="retake-list" aria-label="Gemaakte foto's">
              {photos.map((photo, slot) => photo && (
                <button className="retake-button" key={photo.url} onClick={() => void startCamera(slot)}>
                  <img src={photo.url} alt={`Foto ${slot + 1}`} />
                  <span>{String(slot + 1).padStart(2, '0')} <RotateCcw size={14} /></span>
                </button>
              ))}
            </div>
          )}

          {mode === 'result' && (
            <button className="text-action" onClick={newSession}><RotateCcw size={15} /> Nieuwe fotostrip</button>
          )}
        </section>

        <section className="strip-panel" aria-labelledby="strip-title">
          <div className="section-topline strip-heading">
            <div>
              <p className="section-kicker">02 / JOUW STRIP</p>
              <h2 id="strip-title">Zo wordt-ie</h2>
            </div>
            {mode === 'result' && <span className="ready-label"><Check size={14} /> KLAAR</span>}
          </div>

          {stripUrl ? (
            <div className="strip-result-wrap">
              <img className="strip-result" src={stripUrl} alt="Jouw fotostrip met drie foto's" />
            </div>
          ) : (
            <div className="strip-paper" aria-label="Voorbeeld van drie foto's in een fotostrip">
              {photos.map((photo, slot) => (
                <div className={`strip-frame ${photo ? 'strip-frame-filled' : ''}`} key={slot}>
                  {photo ? <img src={photo.url} alt={`Voorbeeld foto ${slot + 1}`} /> : <span>0{slot + 1}</span>}
                </div>
              ))}
              <div className="strip-caption"><span>KLIK KLAAR</span><span>3 MOMENTEN</span></div>
            </div>
          )}

          {mode === 'result' ? (
            <button className="button button-share" onClick={() => void shareStrip()}>
              <Share2 size={17} /> Deel met je telefoon
            </button>
          ) : (
            <div className="strip-note"><ImagePlus size={16} /><span>Drie beelden. Een klein papieren souvenir.</span></div>
          )}
        </section>
      </div>

      <footer className="footer-note">
        <span>Geen uploads. Geen account.</span>
        <span>Foto's verdwijnen als je deze pagina sluit.</span>
      </footer>
    </main>
  );
}