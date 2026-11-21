// AnimatedButton now renders the premium LiquidButton — one button system
// site-wide (merged 2026-11-21). All existing call sites (Login, Signup,
// Onboarding, LecturerDashboard) keep working unchanged; the 2026-11-21
// morning liquid-glass implementation is superseded by LiquidButton's
// 8-layer system (mouse-tracking highlight, turbulence, chromatic
// aberration, ripple, rotating border glow). Kept as a re-export so no
// call site needs editing.
export { default } from './LiquidButton';
