import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDownToLine, RotateCcw, Share2, X } from 'lucide-react';
import { capturePhoto, createStrip, type CapturedPhoto } from './lib/createStrip';
import ChristmasMusic from './ChristmasMusic';
import MaatjesScene, { Marquee } from './MaatjesScene';
import { readThemeId, saveThemeId, THEMES, type ThemeId } from './themes';

type Mode = 'ready' | 'camera' | 'developing' | 'result';
const PHOTO_COUNT = 3;
const LONG_PRESS_MS = 1200;

function Letters({ text }: { text: string }) {
  return [...text].map((char, index) => (
    <span key={index} aria-hidden="true" style={{ '--i': index } as CSSProperties}>{char === ' ' ? '\u00a0' : char}</span>
  ));
}

function getCameraError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') return 'Cameratoegang is geweigerd. Sta de camera toe in je browserinstellingen en probeer opnieuw.';
    if (error.name === 'NotFoundError') return 'Er is geen camera gevonden op dit apparaat.';
    if (error.name === 'NotReadableError') return 'De camera is niet beschikbaar. Sluit andere apps die de camera gebruiken en probeer opnieuw.';
  }
  return 'De camera kon niet worden gestart. Probeer opnieuw.';
}

export default function App() {
  const [mode, setMode] = useState<Mode>('ready');
  const [photoCount, setPhotoCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [themeId, setThemeId] = useState<ThemeId>(readThemeId);
  const [themeMenu, setThemeMenu] = useState(false);
  const theme = THEMES[themeId];
  const pressTimerRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resultUrlRef = useRef('');
  const sessionRef = useRef(0);
  const runningRef = useRef(false);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function reset() {
    sessionRef.current += 1;
    runningRef.current = false;
    stopCamera();
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = '';
    setResult(null);
    setPhotoCount(0);
    setCountdown(null);
    setFlash(false);
    setPending(false);
    setError('');
    setMode('ready');
  }

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
    document.title = `Fotobooth | Jouw ${theme.collageWord}`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.themeColor);
    saveThemeId(themeId);
  }, [themeId, theme]);

  useEffect(() => {
    if (!themeMenu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setThemeMenu(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [themeMenu]);

  function startLongPress() {
    window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = window.setTimeout(() => setThemeMenu(true), LONG_PRESS_MS);
  }

  function cancelLongPress() {
    window.clearTimeout(pressTimerRef.current);
  }

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'camera' || !videoRef.current || !streamRef.current) return;
    const session = sessionRef.current;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => {
      if (sessionRef.current !== session || !streamRef.current) return;
      reset();
      setError('De camerabeelden konden niet worden getoond. Probeer opnieuw.');
    });
  }, [mode]);

  useEffect(() => () => {
    sessionRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  async function startCamera() {
    setError('');
    if (!window.isSecureContext) {
      setError('Open de booth via HTTPS om je camera te gebruiken.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Deze browser biedt geen live cameratoegang.');
      return;
    }

    const session = ++sessionRef.current;
    setPending(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'user' }, width: { ideal: 1920 }, height: { ideal: 1920 } },
      });
      if (sessionRef.current !== session) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setMode('camera');
    } catch (cameraError) {
      if (sessionRef.current === session) setError(getCameraError(cameraError));
    } finally {
      if (sessionRef.current === session) setPending(false);
    }
  }

  async function beginSequence(video: HTMLVideoElement) {
    if (runningRef.current || !streamRef.current || video !== videoRef.current) return;
    runningRef.current = true;
    const session = sessionRef.current;
    const isCurrent = () => sessionRef.current === session;
    const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    const photos: CapturedPhoto[] = [];

    try {
      for (let shot = 0; shot < PHOTO_COUNT; shot += 1) {
        for (let count = 3; count > 0; count -= 1) {
          setCountdown(count);
          await wait(1000);
          if (!isCurrent()) return;
        }
        const blob = await capturePhoto(video);
        if (!isCurrent()) return;
        photos.push({ blob, url: '' });
        setPhotoCount(photos.length);
        setCountdown(null);
        setFlash(true);
        await wait(260);
        if (!isCurrent()) return;
        setFlash(false);
        if (shot < PHOTO_COUNT - 1) {
          await wait(500);
          if (!isCurrent()) return;
        }
      }

      stopCamera();
      setMode('developing');
      const blob = await createStrip(photos, theme.collage);
      if (!isCurrent()) return;
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url });
      setMode('result');
    } catch {
      if (!isCurrent()) return;
      reset();
      setError('De fotosessie is niet gelukt. Probeer het opnieuw.');
    }
  }

  async function shareResult() {
    if (!result) return;
    const file = new File([result.blob], theme.fileName, { type: 'image/png' });
    if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
      const link = document.createElement('a');
      link.href = result.url;
      link.download = theme.fileName;
      link.click();
      return;
    }
    const session = sessionRef.current;
    setError('');
    try {
      await navigator.share({ files: [file], title: `Mijn ${theme.collageWord}` });
    } catch (shareError) {
      if (sessionRef.current !== session || (shareError instanceof DOMException && shareError.name === 'AbortError')) return;
      setError('Delen is niet gelukt. Je kunt de collage ook downloaden.');
    }
  }

  return (
    <main className={`booth booth-${mode}`}>
      <MaatjesScene key={`scene-${themeId}`} theme={theme} showProp={mode === 'ready'} />
      <ChristmasMusic key={`music-${themeId}`} song={theme.song} />
      <section key={mode} className="booth-screen" aria-labelledby="booth-title">
        {mode === 'ready' && (
          <>
            <p className="eyebrow">{theme.eyebrow}</p>
            <h1 id="booth-title" className="mega" ref={headingRef} tabIndex={-1}>
              {theme.words.map((word, index) => (
                <span className="line" key={word}>
                  <span style={{ '--i': index } as CSSProperties}>
                    {index === 1 ? <em className="gold-text">{word}</em> : index === 2 ? <em className="outline-text">{word}</em> : word}
                  </span>
                </span>
              ))}
            </h1>
            <div className="hero-meta">
              {theme.meta.map((item) => <span key={item}>{item}</span>)}
            </div>
            <div className="hero-actions">
              <button type="button" className="spaced spaced--primary" aria-label={pending ? 'Camera openen' : 'Start'} onClick={() => void startCamera()} disabled={pending}>
                <Letters text={pending ? 'Camera openen' : 'Start'} />
              </button>
            </div>
          </>
        )}
        {mode === 'camera' && (
          <>
            <div className="booth-camera-bar">
              <h1 id="booth-title" className="section-title" ref={headingRef} tabIndex={-1}>{theme.cameraPrefix}<span className="gold-text">camera</span></h1>
              <button type="button" className="icon-button" onClick={reset} aria-label="Fotosessie stoppen" title="Fotosessie stoppen"><X size={22} /></button>
            </div>
            <div className="booth-viewfinder">
              <video ref={videoRef} autoPlay muted playsInline onCanPlay={(event) => void beginSequence(event.currentTarget)} />
              {countdown !== null && <span className="booth-countdown" aria-hidden="true"><span key={countdown}>{countdown}</span></span>}
              {flash && <span className="booth-flash" aria-hidden="true" />}
            </div>
            <p className="booth-counter" role="status">{photoCount} / {PHOTO_COUNT} foto's gemaakt</p>
            <span className="booth-announcement" aria-live="polite">{countdown !== null ? `Foto ${photoCount + 1} over ${countdown}` : ''}</span>
          </>
        )}
        {mode === 'developing' && (
          <>
            <span className="booth-developing-star" aria-hidden="true">★</span>
            <p className="eyebrow">Even geduld…</p>
            <h1 id="booth-title" className="section-title" ref={headingRef} tabIndex={-1}>Collage <span className="gold-text">maken</span></h1>
          </>
        )}
        {mode === 'result' && result && (
          <>
            <p className="eyebrow">Klaar!</p>
            <h1 id="booth-title" className="section-title" ref={headingRef} tabIndex={-1}>Jouw <span className="gold-text">{theme.collageWord}</span></h1>
            <img className="booth-collage" src={result.url} alt="Fotocollage met drie foto's" width={1080} height={1920} />
            <div className="hero-actions">
              <a className="spaced spaced--primary spaced--small" href={result.url} download={theme.fileName} aria-label="Downloaden"><ArrowDownToLine size={18} aria-hidden="true" /><Letters text="Downloaden" /></a>
              <button type="button" className="spaced spaced--gold spaced--small" aria-label="Delen" onClick={() => void shareResult()}><Share2 size={18} aria-hidden="true" /><Letters text="Delen" /></button>
              <button type="button" className="spaced spaced--ghost spaced--small" aria-label="Opnieuw" onClick={reset}><RotateCcw size={18} aria-hidden="true" /><Letters text="Opnieuw" /></button>
            </div>
          </>
        )}
        {error && <p className="booth-error" role="alert">{error}</p>}
      </section>
      {mode === 'ready' && (
        <>
          <Marquee items={theme.marquee} />
          <p
            className="booth-privacy"
            onPointerDown={startLongPress}
            onPointerUp={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onContextMenu={(event) => event.preventDefault()}
          >
            Foto's blijven op dit apparaat
          </p>
          {themeMenu && (
            <div className="theme-menu" role="dialog" aria-label="Thema kiezen">
              <p>Thema</p>
              {Object.values(THEMES).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={option.id === themeId}
                  onClick={() => {
                    setThemeId(option.id);
                    setThemeMenu(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
              <button type="button" className="theme-menu-close" onClick={() => setThemeMenu(false)}>Sluiten</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}