import { Component, type ReactNode } from 'react';
export class SolarRoofErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div role="status" className="h-full flex items-center justify-center p-4 text-center bg-background text-muted-foreground">Aperçu indisponible. Vous pouvez poursuivre votre simulation.</div> : this.props.children;
  }
}