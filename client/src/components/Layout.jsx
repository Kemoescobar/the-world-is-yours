import Nav from './Nav.jsx';
import QuickCapture from './QuickCapture.jsx';

/** Layout privé — World Poster OS shell (void grid · chrome · HUD). */
export default function Layout({ children }) {
  return (
    <div className="layout layout-os">
      <div className="halftone-overlay halftone-live" />
      <div className="grain grain-live" aria-hidden />
      <div className="layout-os__void atmosphere-void void-grid atmosphere-breathe" aria-hidden />
      <div className="layout-os__bloom" aria-hidden />
      <div className="layout-os__scan scanlines scanlines-live" aria-hidden />
      <div className="hud-corners" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <Nav />
      <main className="layout-os__main">{children}</main>
      <QuickCapture />
    </div>
  );
}
