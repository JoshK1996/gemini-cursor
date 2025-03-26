import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/apps/controls/components/App";

// Create a root element
const rootElement = document.getElementById("root");

// Add error display for debugging
if (!rootElement) {
  document.body.innerHTML = "<h1>Error: Root element not found</h1>";
  console.error("Root element 'root' not found in the document");
} else {
  try {
    // Create root and render with error boundary
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Rendering error:", error);
    document.body.innerHTML = `<h1>Application Error</h1><pre>${error}</pre>`;
  }
}

// Simple error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React error boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
          <h1>Something went wrong</h1>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}