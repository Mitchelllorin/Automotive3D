/**
 * ErrorBoundary — stops one component's render error from white-screening the
 * whole app (exactly what the missing-import crash did). Wrap the app for a
 * catastrophic fallback, and wrap individual panels with `compact` so a bad panel
 * shows an inline retry while the 3D scene keeps running.
 *
 * Note: React error boundaries catch errors thrown during *render/lifecycle* —
 * which is the common case (a bad prop, a missing import, a null deref in JSX).
 * They do not catch throws inside useFrame loops; those are guarded separately.
 */
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface it for debugging without taking the app down.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.compact) {
      return (
        <div className="error-fallback compact">
          <span>⚠ This panel hit a snag.</span>
          <button onClick={this.reset}>Retry</button>
        </div>
      );
    }

    return (
      <div className="error-fallback">
        <div className="error-fallback-icon">⚠</div>
        <h2>Something went wrong</h2>
        <p>The app hit an unexpected error — your build is safe.</p>
        <div className="error-fallback-btns">
          <button onClick={this.reset}>Try again</button>
          <button className="secondary" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}
