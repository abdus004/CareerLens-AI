import { Component } from "react";
import Hero3DFallback from "./Hero3DFallback";

/**
 * Guards the 3D hero specifically. If WebGL is unavailable, blocked
 * by the browser, or three.js throws for any reason, this quietly
 * swaps to the same lightweight CSS placeholder used during loading -
 * per the brief's "do not break any existing functionality," a
 * decorative hero visual must never be able to take the whole landing
 * page down with it.
 */
export default class Hero3DErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn("Hero3D failed to render, falling back to static visual:", error);
    }
  }

  render() {
    if (this.state.hasError) {
      return <Hero3DFallback />;
    }
    return this.props.children;
  }
}
