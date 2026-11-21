// SVG filter definitions for the premium liquid-glass button system.
// Mounted once at the app root (App.jsx). The #liquid-turbulence filter
// powers the .liquid-turbulence layer in liquid-premium.css.
//
// NOTE: this file was NOT in the uploaded bundle — it was written
// 2026-11-21 during the merge, because liquid-premium.css references
// url(#liquid-turbulence) and no file in the upload defined it.
export default function LiquidFilters() {
  return (
    <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <filter id="liquid-turbulence" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
        </filter>
      </defs>
    </svg>
  );
}
