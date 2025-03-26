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

  // For testing: try loading the minimal test page first to diagnose issues
  const testUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL
    ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/apps/controls/minimal.html`
    : `file://${path.join(app.getAppPath(), "dist", "apps/controls/minimal.html")}`;

  controlsWindow.loadURL(testUrl);

  // Open the DevTools in dev mode
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    controlsWindow.webContents.openDevTools();
  }

  controlsWindow.on("closed", () => {
    controlsWindow = null;
  });

  controlsWindow.on("ready-to-show", () => {
    controlsWindow?.show();
  });

  // Add error handler for loading failures
  controlsWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load URL:', errorCode, errorDescription);
    
    // If the minimal test page fails, try the regular page
    if (testUrl.includes('minimal.html')) {
      const regularUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL
        ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/apps/controls/index.html`
        : `file://${path.join(app.getAppPath(), "dist", "apps/controls/index.html")}`;
      
      console.log('Falling back to regular page:', regularUrl);
      controlsWindow?.loadURL(regularUrl);
    }
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