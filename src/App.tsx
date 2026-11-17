import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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
  TreePine,
  X,
} from 'lucide-react';
import { capturePhoto, createStrip, type CapturedPhoto } from './lib/createStrip';

const WinterScene = lazy(() => import('./WinterScene'));

type Mode = 'ready' | 'camera' | 'result';
type BrowserWithShare = Navigator & {
  canShare?: (data?: ShareData) => boolean;
};

const EMPTY_PHOTOS: (CapturedPhoto | null)[] = [null, null, null];
const COUNTDOWN_SECONDS = 4;

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

function ChristmasBear({ side }: { side: 'left' | 'right' }) {
  const scarfColor = side === 'left' ? '#bd493a' : '#286044';
  const hatColor = side === 'left' ? '#286044' : '#bd493a';

  return (
    <svg className={`bear-visitor bear-visitor-${side}`} viewBox="0 0 120 150" aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="142" rx="33" ry="6" fill="rgba(0,0,0,.2)" />
      <ellipse cx="42" cy="118" rx="21" ry="15" fill="#af8055" />
      <ellipse cx="78" cy="118" rx="21" ry="15" fill="#af8055" />
      <ellipse cx="60" cy="99" rx="36" ry="40" fill="#bf9569" />
      <ellipse cx="29" cy="67" rx="18" ry="24" fill="#b8895d" transform="rotate(-28 29 67)" />
      <ellipse cx="91" cy="67" rx="18" ry="24" fill="#b8895d" transform="rotate(28 91 67)" />
      <circle cx="60" cy="55" r="37" fill="#c79c70" />
      <circle cx="35" cy="28" r="14" fill="#bb8d63" />
      <circle cx="85" cy="28" r="14" fill="#bb8d63" />
      <circle cx="35" cy="29" r="7" fill="#e6c6a0" />
      <circle cx="85" cy="29" r="7" fill="#e6c6a0" />
      <ellipse cx="60" cy="70" rx="22" ry="16" fill="#f0dfc5" />
      <circle cx="47" cy="53" r="3.4" fill="#30231d" />
      <circle cx="73" cy="53" r="3.4" fill="#30231d" />
      <ellipse cx="60" cy="65" rx="5.7" ry="4.3" fill="#30231d" />
      <path d="M53 73 Q60 79 67 73" fill="none" stroke="#70503e" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M28 80 Q60 94 92 79 L88 91 Q60 105 32 92 Z" fill={scarfColor} />
      <path d="M77 91 L91 88 L88 116 L76 113 Z" fill={scarfColor} />
      <path d="M27 27 Q34 3 62 8 Q84 11 91 29 Z" fill={hatColor} />
      <path d="M27 27 Q59 37 92 27 L92 36 Q60 47 28 36 Z" fill="#f4ead8" />
      <circle cx="62" cy="8" r="8" fill="#f4ead8" />
      <path d="M40 107 Q60 117 80 107" fill="none" stroke="rgba(255,244,221,.46)" strokeWidth="2" />
    </svg>
  );
}

export default function App() {
  const [photos, setPhotos] = useState<(CapturedPhoto | null)[]>(EMPTY_PHOTOS);
  const [mode, setMode] = useState<Mode>('ready');
  const [activeSlot, setActiveSlot] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [pending, setPending] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [stripUrl, setStripUrl] = useState('');
  const [stripBlob, setStripBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stripPanelRef = useRef<HTMLElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photosRef = useRef<(CapturedPhoto | null)[]>(EMPTY_PHOTOS);
  const stripUrlRef = useRef('');
  const sequenceIdRef = useRef(0);
  const sequenceRunningRef = useRef(false);

  const photoCount = photos.filter(Boolean).length;

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
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

  useEffect(() => {
    if (mode !== 'result' || !stripUrl || !window.matchMedia('(max-width: 700px)').matches) return;
    const panel = stripPanelRef.current;
    if (!panel) return;
    const scrollToResult = () => {
      const top = panel.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top - 12), behavior: 'auto' });
    };
    const image = panel.querySelector<HTMLImageElement>('.strip-result');
    if (image && !image.complete) {
      image.addEventListener('load', scrollToResult, { once: true });
      image.addEventListener('error', scrollToResult, { once: true });
      return () => {
        image.removeEventListener('load', scrollToResult);
        image.removeEventListener('error', scrollToResult);
      };
    }
    scrollToResult();
  }, [mode, stripUrl]);

  useEffect(
    () => () => {
      sequenceIdRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      photosRef.current.forEach((photo) => {
        if (photo) URL.revokeObjectURL(photo.url);
      });
      if (stripUrlRef.current) URL.revokeObjectURL(stripUrlRef.current);
    },
    [],
  );

  async function startCamera() {
    setError('');
    clearStrip();
    releasePhotos();
    setActiveSlot(0);
    setCountdown(null);
    setFlash(false);
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
      setMode('camera');
    } catch (cameraError) {
      setError(getCameraError(cameraError));
    } finally {
      setPending(false);
    }
  }

  function beginSequence() {
    if (sequenceRunningRef.current || !videoRef.current) return;
    sequenceRunningRef.current = true;
    const sequenceId = ++sequenceIdRef.current;
    const isCurrentSequence = () => sequenceIdRef.current === sequenceId;
    const wait = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

    void (async () => {
      setError('');
      try {
        for (let slot = 0; slot < 3; slot += 1) {
          if (!isCurrentSequence()) return;
          setActiveSlot(slot);
          for (let seconds = COUNTDOWN_SECONDS; seconds > 0; seconds -= 1) {
            setCountdown(seconds);
            await wait(1000);
            if (!isCurrentSequence()) return;
          }

          const video = videoRef.current;
          if (!video) throw new Error('De camera is niet meer beschikbaar.');
          const blob = await capturePhoto(video);
          if (!isCurrentSequence()) return;

          const next = [...photosRef.current];
          next[slot] = { blob, url: URL.createObjectURL(blob) };
          photosRef.current = next;
          setPhotos(next);
          setCountdown(null);
          setFlash(true);
          await wait(260);
          if (!isCurrentSequence()) return;
          setFlash(false);
          if (slot < 2) await wait(500);
        }

        stopCamera();
        setMode('result');
        setCountdown(null);
        await makeStrip(photosRef.current.filter((photo): photo is CapturedPhoto => photo !== null));
      } catch (captureError) {
        if (!isCurrentSequence()) return;
        stopCamera();
        releasePhotos();
        setMode('ready');
        setError(captureError instanceof Error ? captureError.message : 'De fotosessie is niet gelukt. Probeer het opnieuw.');
      } finally {
        if (isCurrentSequence()) {
          sequenceRunningRef.current = false;
          setFlash(false);
          setCountdown(null);
        }
      }
    })();
  }

  function cancelCamera() {
    sequenceIdRef.current += 1;
    sequenceRunningRef.current = false;
    stopCamera();
    releasePhotos();
    setFlash(false);
    setCountdown(null);
    setError('');
    setMode('ready');
  }

  async function makeStrip(captured = photosRef.current.filter((photo): photo is CapturedPhoto => photo !== null)) {
    if (captured.length !== 3) return;
    setIsProcessing(true);
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
      setIsProcessing(false);
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
    sequenceIdRef.current += 1;
    sequenceRunningRef.current = false;
    stopCamera();
    clearStrip();
    releasePhotos();
    setMode('ready');
    setActiveSlot(0);
    setCountdown(null);
    setFlash(false);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <Suspense fallback={<div className="winter-world winter-world-static" aria-hidden="true" />}>
        <WinterScene interactive={mode === 'ready' && !pending} onTreeClick={() => void startCamera()} />
      </Suspense>
      <div className="winter-wash" aria-hidden="true" />
      <main className={`app-shell ${mode === 'ready' ? 'app-shell-tree' : 'app-shell-session'}`}>
      {mode === 'ready' ? (
        <section className="tree-landing" aria-labelledby="tree-title">
          <div className="bear-visitors" aria-hidden="true">
            <ChristmasBear side="left" />
            <ChristmasBear side="right" />
          </div>
          <div className="tree-copy">
            <div className="tree-wordmark"><Aperture size={19} /><span>POLAROID APP</span><i /></div>
            <p className="eyebrow"><span className="eyebrow-dot" /> KERSTSTUDIO · 2026</p>
            <h1 id="tree-title">DIT WORDT<br /><span>JOUW KERST.</span></h1>
            <p className="tree-intro">Drie momenten. Een kerst om te bewaren.</p>
          </div>
          <div className="tree-action-zone">
            <span className="tree-orbit tree-orbit-one" aria-hidden="true" />
            <span className="tree-orbit tree-orbit-two" aria-hidden="true" />
            <button className="tree-start-button" onClick={() => void startCamera()} disabled={pending}>
              <span className="tree-start-icon"><TreePine size={22} /></span>
              <span className="tree-start-copy">
                <strong>{pending ? 'Camera verbinden...' : 'Tik op de kerstboom'}</strong>
                <small>en maak jouw fotostrip</small>
              </span>
              <ChevronRight className="tree-start-arrow" size={19} />
            </button>
            <p className="tree-action-note"><Sparkles size={13} /> De camera maakt drie foto’s achter elkaar</p>
          </div>
          <span className="tree-edition-mark">NO. 03 <i /> WINTER / 26</span>
        </section>
      ) : (
      <>
      <div className="intro-row">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> POLAROID APP · WINTEREDITIE</p>
          <h1>Vang de kerst.<br /><span>Hou 'm dichtbij.</span></h1>
        </div>
        <p className="intro-note">Een nacht vol kleine wonderen, vastgelegd in jouw eigen kerststrip.</p>
      </div>

      <div className={`workspace ${mode === 'result' ? 'workspace-result' : 'workspace-ready'}`}>
        <section className="shoot-panel" aria-labelledby="shoot-title">
          <div className="section-topline">
            <div>
              <p className="section-kicker">01 / KERSTCAMERA</p>
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
                onCanPlay={beginSequence}
              />
            ) : (
              <div className="viewfinder-empty">
                <span className="finder-mark finder-top-left" />
                <span className="finder-mark finder-top-right" />
                <span className="finder-mark finder-bottom-left" />
                <span className="finder-mark finder-bottom-right" />
                <span className="placeholder-aperture"><Aperture size={34} strokeWidth={1.5} /></span>
                <span className="viewfinder-label">
                  {mode === 'result' ? 'Moment vastgelegd' : 'De kerststudio staat klaar'}
                </span>
              </div>
            )}
            {mode === 'camera' && (
              <>
                <span className="live-badge"><span /> LIVE · {activeSlot + 1}/3</span>
                {countdown !== null && (
                  <div className="countdown-overlay" aria-live="assertive" aria-atomic="true">
                    <span className="countdown-number" key={countdown}>{countdown}</span>
                    <span className="countdown-label">FOTO {activeSlot + 1}</span>
                  </div>
                )}
                {flash && <span className="camera-flash" aria-hidden="true" />}
              </>
            )}
          </div>

          <div className="capture-meta">
            <div className="step-dots" aria-label={`${photoCount} van 3 foto's gemaakt`}>
              {[0, 1, 2].map((slot) => (
                <span className={photos[slot] ? 'step-dot step-dot-filled' : 'step-dot'} key={slot} />
              ))}
            </div>
            <span className="capture-hint" aria-live="polite">
              {mode === 'camera'
                ? countdown !== null ? `Foto ${activeSlot + 1} wordt gemaakt` : 'Camera wordt gestart...'
                : mode === 'result' ? 'Je strip is klaar' : `${photoCount} van 3 foto's`}
            </span>
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <div className="primary-actions">
            {mode === 'camera' && (
              <div className="camera-controls">
                <p className="sequence-message">De magie is bezig...</p>
                <button className="button button-quiet" onClick={cancelCamera} aria-label="Fotosessie stoppen" title="Fotosessie stoppen">
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {mode === 'result' && (
            <button className="text-action" onClick={newSession}><RotateCcw size={15} /> Nieuwe fotosessie</button>
          )}
        </section>

        {mode === 'result' && photoCount === 3 && (
        <section className="strip-panel" aria-labelledby="strip-title" ref={stripPanelRef}>
          <div className="section-topline strip-heading">
            <div>
              <p className="section-kicker">02 / JOUW AANDENKEN</p>
              <h2 id="strip-title">De kerststrip</h2>
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
              <div className="strip-caption"><span>POLAROID APP</span><span>3 MOMENTEN</span></div>
            </div>
          )}

          {mode === 'result' ? (
            <div className="strip-result-actions">
              <button
                className="button button-primary"
                onClick={stripUrl ? downloadStrip : () => void makeStrip()}
                disabled={isProcessing}
              >
                {stripUrl ? <><ArrowDownToLine size={18} /> Download fotostrip</> : isProcessing ? 'Strip maken...' : 'Probeer strip opnieuw'}
              </button>
              {stripUrl && (
                <button className="button button-share" onClick={() => void shareStrip()}>
                  <Share2 size={17} /> Deel met je telefoon
                </button>
              )}
            </div>
          ) : (
            <div className="strip-note"><ImagePlus size={16} /><span>Drie beelden. Een kerst om te bewaren.</span></div>
          )}
        </section>
        )}
      </div>
      </>
      )}

      <footer className="footer-note">
        <span><ShieldCheck size={14} /> Jouw beelden blijven alleen op dit apparaat.</span>
        <span>NO. 03 · KERSTSTUDIO</span>
      </footer>
      </main>
    </>
  );
}