/**
 * Surge Listings — Windows Desktop Application (Electron)
 * 
 * Standalone, enterprise desktop wrapper for the live Surge Listings platform.
 * Strictly isolated in desktop-app/ with no interference to the hosted website.
 */

const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');
const path = require('path');
const { URL } = require('url');

// 1. Target Live Production URL
// Leading to the login page first as requested
const PRODUCTION_URL = process.env.SURGE_APP_URL || 'https://surge-listings.vercel.app/login';
const OFFLINE_HTML = path.join(__dirname, 'offline.html');

// Allowed Origins for secure in-app navigation
const ALLOWED_ORIGINS = [
  'https://surge-listings.vercel.app',
  'https://surge-solutions-api.sedegahkimathi.workers.dev'
];

let mainWindow = null;

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.info('[Surge Desktop] Another instance is already running. Exiting.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function isAllowedUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol === 'file:') return true;
    return ALLOWED_ORIGINS.some(origin => {
      const allowed = new URL(origin);
      return parsed.origin === allowed.origin;
    });
  } catch (e) {
    return false;
  }
}

function createWindow() {
  // Remove default browser menu bar for a clean native desktop experience
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    title: 'Surge Listings',
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#FFFFFF',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: true
    }
  });

  // Display window cleanly once initial content is rendered (avoids white flicker)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the live production website
  console.info(`[Surge Desktop] Loading production URL: ${PRODUCTION_URL}`);
  mainWindow.loadURL(PRODUCTION_URL);

  // Connection / Loading Failure Handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    // -3 is ERR_ABORTED (user or script redirected, not an actual network error)
    if (errorCode === -3) return;

    console.warn(`[Surge Desktop] Network load failure (${errorCode}): ${errorDescription} on ${validatedURL}`);
    if (isMainFrame || validatedURL === PRODUCTION_URL) {
      mainWindow.loadFile(OFFLINE_HTML);
    }
  });

  // Security: Restrict in-app navigation to official Surge endpoints
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (!isAllowedUrl(navigationUrl)) {
      console.warn(`[Surge Desktop] Blocking external in-app navigation: ${navigationUrl}`);
      event.preventDefault();
      shell.openExternal(navigationUrl).catch(err => {
        console.error('[Surge Desktop] Failed to open external browser:', err);
      });
    }
  });

  // Security: Block unexpected new windows/popups & route external links to system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedUrl(url)) {
      // Allow internal dialogs/routes within the app window
      mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    // External link: open in user's default browser
    shell.openExternal(url).catch(err => {
      console.error('[Surge Desktop] Failed to open external link:', err);
    });
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('surge:retry-connection', async () => {
  if (mainWindow) {
    console.info('[Surge Desktop] Retry requested. Re-attempting connection to production URL...');
    try {
      await mainWindow.loadURL(PRODUCTION_URL);
      return { success: true };
    } catch (err) {
      console.warn('[Surge Desktop] Retry failed:', err.message);
      return { success: false, error: err.message };
    }
  }
  return { success: false };
});

// Open marketplace in a separate child window so the portal nav stays intact
ipcMain.handle('surge:open-marketplace', async () => {
  const marketplaceUrl = 'https://surge-listings.vercel.app/marketplace';

  // Reuse existing marketplace window if already open
  const existing = BrowserWindow.getAllWindows().find(w => w._isSurgeMarketplace);
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return { success: true };
  }

  const marketWin = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Surge Listings — Marketplace',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundColor: '#0B3C75',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  marketWin._isSurgeMarketplace = true;
  Menu.setApplicationMenu(null);

  marketWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  marketWin.once('ready-to-show', () => marketWin.show());

  try {
    await marketWin.loadURL(marketplaceUrl);
    return { success: true };
  } catch (err) {
    console.warn('[Surge Desktop] Failed to load marketplace:', err.message);
    marketWin.close();
    return { success: false, error: err.message };
  }
});

ipcMain.handle('surge:get-app-info', () => {
  return {
    name: app.getName(),
    version: app.getVersion()
  };
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

