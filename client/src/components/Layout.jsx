import Nav from './Nav.jsx';
import QuickCapture from './QuickCapture.jsx';

/** Layout privé — nav dashboard + capture rapide. */
export default function Layout({ children }) {
  return (
    <div className="layout">
      <div className="halftone-overlay" />
      <Nav />
      <main>{children}</main>
      <QuickCapture />
    </div>
  );
}
