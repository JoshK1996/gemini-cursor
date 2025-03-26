import { BrowserWindow, app, ipcMain, protocol, screen } from "electron";
import path from "path";
import { setPermissionsEventListeners } from "./permissions";
import { CursorController } from "./apps/cursor/controller";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let cursorWindow: BrowserWindow | null = null;
let controlsWindow: BrowserWindow | null = null;
let cursorController: CursorController | null = null;

const createCursorWindow = () => {
  const cursorWidth = 64;
  const cursorHeight = 64;

  cursorWindow = new BrowserWindow({
    width: cursorWidth,
    height: cursorHeight,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  cursorWindow.setResizable(false);
  cursorWindow.setMinimizable(false);
  cursorWindow.setIgnoreMouseEvents(true);

  // macOS should allow position outside the bounds
  if (process.platform === "darwin") {
    cursorWindow.setMovable(false);
  }

  const appDirectory = MAIN_WINDOW_VITE_DEV_SERVER_URL 
    ? MAIN_WINDOW_VITE_DEV_SERVER_URL
    : `file://${path.join(app.getAppPath(), "dist")}`;

  console.log("App directory for cursor:", appDirectory);
  
  cursorWindow.loadURL(
    MAIN_WINDOW_VITE_DEV_SERVER_URL
      ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/apps/cursor/index.html`
      : `file://${path.join(app.getAppPath(), "dist", "apps/cursor/index.html")}`
  );

  cursorController = new CursorController(cursorWindow);

  cursorWindow.on("closed", () => {
    cursorWindow = null;
    cursorController = null;
  });
};

const createControlsWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const controlsWidth = Math.floor(width * 0.8);
  const controlsHeight = Math.floor(height * 0.8);

  controlsWindow = new BrowserWindow({
    width: controlsWidth,
    height: controlsHeight,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      // Enable dev tools
      devTools: true
    },
  });

  // Instead of loading a file, directly load some HTML content
  controlsWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Direct Test Page</title>
        <style>
          body {
            font-family: sans-serif;
            background-color: #0f172a;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 20px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Gemini Cursor Direct Test</h1>
          <p>If you can see this page, direct content loading works.</p>
          <div id="app-info"></div>
          <button id="loadApp">Try Loading Main App</button>
        </div>

        <script>
          document.getElementById('app-info').textContent = 
            'App Path: ' + ${JSON.stringify(app.getAppPath())} + 
            ', Is Dev: ' + ${JSON.stringify(!!MAIN_WINDOW_VITE_DEV_SERVER_URL)};
            
          document.getElementById('loadApp').addEventListener('click', () => {
            const appUrl = ${JSON.stringify(
              MAIN_WINDOW_VITE_DEV_SERVER_URL
                ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/apps/controls/index.html`
                : `file://${path.join(app.getAppPath(), "dist", "apps/controls/index.html")}`
            )};
            window.location.href = appUrl;
          });
        </script>
      </body>
    </html>
  `));

  // Open the DevTools in dev mode
  controlsWindow.webContents.openDevTools();

  controlsWindow.on("closed", () => {
    controlsWindow = null;
  });

  controlsWindow.on("ready-to-show", () => {
    controlsWindow?.show();
  });

  // Add error handler for loading failures
  controlsWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load URL:', validatedURL, errorCode, errorDescription);
    
    // If loading failed, try using direct content loading
    controlsWindow?.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Error Page</title>
          <style>
            body { background: #0f172a; color: white; font-family: sans-serif; padding: 2rem; }
            .error { color: #f87171; }
          </style>
        </head>
        <body>
          <h1 class="error">Loading Error</h1>
          <p>Failed to load: ${validatedURL}</p>
          <p>Error: ${errorCode} - ${errorDescription}</p>
          <p>App Path: ${app.getAppPath()}</p>
          <p>Is Dev: ${!!MAIN_WINDOW_VITE_DEV_SERVER_URL}</p>
        </body>
      </html>
    `));
  });
};

// Register protocol for loading local image files
const registerLocalImageProtocol = () => {
  protocol.registerFileProtocol("local-image", (request, callback) => {
    const filePath = request.url.replace("local-image://", "");
    try {
      callback(decodeURI(filePath));
    } catch (error) {
      console.error("Failed to register protocol", error);
    }
  });
};

app.on("ready", () => {
  registerLocalImageProtocol();
  createControlsWindow();
  createCursorWindow();
  setPermissionsEventListeners([controlsWindow, cursorWindow]);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (cursorWindow === null) {
    createCursorWindow();
  }
  if (controlsWindow === null) {
    createControlsWindow();
  }
});

ipcMain.on("move-cursor", (_, x: number, y: number) => {
  if (cursorController) {
    cursorController.moveTo(x, y);
  }
});

// Handler for getting environment variables
ipcMain.handle("get-env-var", (_, key: string) => {
  return process.env[key] || null;
});

app.on("will-quit", () => {
  if (cursorController) {
    cursorController.cleanup();
  }
});