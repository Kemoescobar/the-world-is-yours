import { Component } from 'react';

/** Catch render crashes so catalogues never die as a silent white screen. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <div className="empty-wall" style={{ margin: 'var(--space-4)', textAlign: 'center' }}>
            <p className="compteur">ERREUR · RENDU</p>
            <h2 style={{ margin: '12px 0' }}>Écran indisponible</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto' }}>
              {this.state.error?.message || 'Une erreur a interrompu l’affichage.'}
            </p>
            <button
              type="button"
              className="btn-ghost"
              style={{ marginTop: 16 }}
              onClick={() => this.setState({ error: null })}
            >
              › Réessayer
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
