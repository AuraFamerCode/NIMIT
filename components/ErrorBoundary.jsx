import { Component } from "react";

const C = {
  bg: "#212121",
  surface: "#2f2f2f",
  border: "#4a4a4a",
  red: "#fa5252",
  text: "#ececec",
  dim: "#8b8b8b",
  cyan: "#10a37f",
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100%", background: C.bg, color: C.text, fontFamily: "monospace",
          padding: 24, textAlign: "center",
        }}>
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💥</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.red, marginBottom: 8 }}>
              Something went wrong
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>
              {String(this.state.error?.message || "Unknown error")}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                background: C.cyan, border: "none", borderRadius: 6,
                color: "#fff", fontFamily: "monospace", fontSize: 12,
                fontWeight: 700, padding: "8px 20px", cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}