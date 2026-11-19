import { useEffect, useState } from 'react';

// One tap hides the browser's top bar and the Windows taskbar (true
// full screen). Browsers only allow this from a tap, so the site cannot
// turn it on by itself when the page loads.
export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Full screen needs a tap and can be refused by the browser; ignore.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={isFullscreen ? 'Exit full screen' : 'Full screen'}
      aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
      className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-slate-950/60 text-white shadow-lg backdrop-blur-xl transition hover:scale-105 hover:bg-slate-900/70"
    >
      {isFullscreen ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14h6v6" />
          <path d="M20 10h-6V4" />
          <path d="M14 10l7-7" />
          <path d="M3 21l7-7" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      )}
    </button>
  );
}
