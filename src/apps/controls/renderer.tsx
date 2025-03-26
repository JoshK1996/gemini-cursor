import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/apps/controls/components/App";
import "./index.css"; // Ensure CSS is imported

// Create a simple fallback element to display in case of error
const fallbackElement = document.createElement('div');
fallbackElement.innerHTML = '<div style="padding: 20px; text-align: center; color: white; font-family: sans-serif; background-color: #0f172a; height: 100vh;"><h1>Gemini Cursor</h1><p>Loading application...</p></div>';
document.body.appendChild(fallbackElement);

// Look for root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element 'root' not found in the document");
  fallbackElement.innerHTML = '<div style="padding: 20px; text-align: center; color: white; font-family: sans-serif; background-color: #0f172a; height: 100vh;"><h1>Error: Root element not found</h1><p>Could not find the root element to mount the application.</p></div>';
} else {
  try {
    // Remove fallback once we start rendering
    document.body.removeChild(fallbackElement);
    
    // Create root and render
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Rendering error:", error);
    fallbackElement.innerHTML = `<div style="padding: 20px; text-align: center; color: white; font-family: sans-serif; background-color: #0f172a; height: 100vh;"><h1>Application Error</h1><p>${error}</p></div>`;
    document.body.appendChild(fallbackElement);
  }
}