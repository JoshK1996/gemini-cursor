import React, { useRef, useState, useEffect } from "react";
import "@/apps/controls/index.css";
import { LiveAPIProvider } from "@/apps/controls/contexts/LiveAPIContext";
import cn from "classnames";
import ControlTray from "@/apps/controls/components/control-tray/ControlTray";
import SidePanel from "@/apps/controls/components/side-panel/SidePanel";
import CursorControl from "@/apps/controls/components/CursorControl";
import geminiLogo from "../../../../resources/gemini-logo.svg";

// Add TypeScript declaration for the window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      moveCursor: (x: number, y: number) => void;
      getEnvVar: (key: string) => Promise<string | null>;
    };
  }
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;
const apiKeyStorageKey = "geminiApiKey";

const App = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [appError, setAppError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [lastCapturedFrame, setLastCapturedFrame] = useState<string | null>(null);

  useEffect(() => {
    // Load API key with visual feedback
    const loadApiKey = async () => {
      setIsLoading(true);
      try {
        // First try to get API key from environment variable
        if (window.electronAPI && window.electronAPI.getEnvVar) {
          console.log("Trying to get API key from environment variable...");
          const envApiKey = await window.electronAPI.getEnvVar("GEMINI_API_KEY");
          if (envApiKey) {
            console.log("Successfully got API key from environment variable");
            setApiKey(envApiKey);
            setIsLoading(false);
            return;
          } else {
            console.log("No API key found in environment variables");
          }
        } else {
          console.warn("electronAPI.getEnvVar is not available");
        }
        
        // Fall back to localStorage if env variable is not set
        const savedApiKey = localStorage.getItem(apiKeyStorageKey);
        if (savedApiKey) {
          console.log("Using API key from localStorage");
          setApiKey(savedApiKey);
        } else {
          console.warn("No API key found in localStorage");
        }
      } catch (error) {
        console.error("Error loading API key:", error);
        setAppError(`Error loading API key: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadApiKey();
  }, []);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem(apiKeyStorageKey, apiKey);
      console.log("API key saved to localStorage");
    }
  };

  // If there's an error, show it
  if (appError) {
    return (
      <div className="App error-container">
        <h1>Application Error</h1>
        <p>{appError}</p>
        <button onClick={() => window.location.reload()}>Reload App</button>
      </div>
    );
  }

  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="App loading-container">
        <h2>Loading Application...</h2>
        <p>Please wait while we initialize Gemini Cursor</p>
      </div>
    );
  }

  return (
    <div className="App">
      <LiveAPIProvider url={uri} apiKey={apiKey}>
        <div className="streaming-console">
          <SidePanel />
          <main>
            <div className="api-key-form-container">
              <div className="header-container">
                <div className="app-title-container">
                  <img
                    src={geminiLogo}
                    alt="Gemini Logo"
                    className="gemini-logo"
                  />

                  <h1 className="app-title">Gemini Cursor</h1>
                </div>

                <p>
                  Made with ✨️ by{" "}
                  <a
                    href="https://x.com/27upon2"
                    target="_system"
                    rel="noopener noreferrer"
                  >
                    @13point5
                  </a>
                </p>
              </div>

              <div className="api-key-form">
                <form onSubmit={handleApiKeySubmit}>
                  <label htmlFor="api-key">Gemini API Key</label>
                  <div>
                    <input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key or set GEMINI_API_KEY env variable"
                    />
                    <button type="submit">Update</button>
                  </div>
                </form>
              </div>
            </div>

            <div className="main-app-area">
              <CursorControl lastCapturedFrame={lastCapturedFrame} />

              <video
                className={cn("stream", {
                  hidden: !videoRef.current || !videoStream,
                })}
                ref={videoRef}
                autoPlay
                playsInline
              />
            </div>

            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
              onFrameCapture={setLastCapturedFrame}
              hasApiKey={!!apiKey.trim()}
            />
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
};

export default App;