import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };

const DISMISS_KEY = 'fotobooth-installtip';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export default function InstallTip() {
  const [visible, setVisible] = useState(false);
  const [ios] = useState(isIos);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;
    let timer = 0;
    if (ios) timer = window.setTimeout(() => setVisible(true), 1500);
    const onPrompt = (event: Event) => {
      if (!window.matchMedia('(pointer: coarse)').matches) return;
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onPrompt);
    };
  }, [ios]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Without storage the tip simply returns next visit.
    }
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="install-tip" role="dialog" aria-label="Fotobooth als app installeren">
      <div className="install-tip-text">
        <strong>Maak er een app van</strong>
        {ios ? (
          <p>
            Tik op <Share size={16} aria-label="Delen" className="install-tip-icon" /> en kies <b>Zet op beginscherm</b>.
          </p>
        ) : (
          <p>Zet de Fotobooth op je beginscherm.</p>
        )}
      </div>
      {!ios && installEvent && (
        <button type="button" className="install-tip-button" onClick={() => void install()}>Installeren</button>
      )}
      <button type="button" className="install-tip-close" aria-label="Sluiten" onClick={dismiss}><X size={18} /></button>
    </div>
  );
}
