const { app, BrowserWindow, ipcMain, protocol, net, session, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Generate retro "N" app icon if it does not exist
function ensureIconFile() {
  const iconPath = path.join(__dirname, 'icon.png');
  if (!fs.existsSync(iconPath)) {
    try {
      const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
        <rect width="128" height="128" rx="20" fill="#005a5b" />
        <circle cx="28" cy="28" r="1.5" fill="#ffffff" />
        <circle cx="102" cy="38" r="1.5" fill="#ffffff" />
        <circle cx="38" cy="70" r="1.5" fill="#ffffff" />
        <path d="M12 116 A52 52 0 0 1 116 116 Z" fill="#000000" />
        <text x="64" y="104" font-family="Times New Roman, Times, Georgia, serif" font-size="94" font-weight="bold" fill="#ffffff" text-anchor="middle">N</text>
      </svg>
      `;
      const buffer = Buffer.from(svgContent.trim());
      const iconImage = nativeImage.createFromBuffer(buffer, { width: 128, height: 128 });
      const pngBuffer = iconImage.toPNG();
      fs.writeFileSync(iconPath, pngBuffer);
    } catch (err) {
      console.error("Failed to generate application icon:", err);
    }
  }
}
ensureIconFile();

// Define default configuration
const PREFERENCES_FILE = path.join(app.getPath('userData'), 'preferences.json');

const DEFAULT_PREFERENCES = {
  appearance: {
    toolbar_mode: "pictures_and_text",
    underline_links: true
  },
  navigator: {
    start_mode: "homepage",
    homepage_url: "notscape://portal",
    history_expiration_days: 9,
    enable_adblock: true
  },
  bookmarks: [
    {
      title: "Welcome to NotScape",
      url: "notscape://portal"
    },
    {
      title: "Internet Archive",
      url: "https://archive.org"
    },
    {
      title: "Google Search",
      url: "https://www.google.com"
    }
  ]
};

// Register the custom "notscape" scheme as privileged
protocol.registerSchemesAsPrivileged([
  { 
    scheme: 'notscape', 
    privileges: { 
      standard: true, 
      secure: true, 
      supportFetchAPI: true,
      bypassCSP: true
    } 
  }
]);

let mainWindow;
let splashWindow;

// Curated list of common advertising, tracking, and telemetry domains
const BLOCKED_DOMAINS = new Set([
  'doubleclick.net',
  'google-analytics.com',
  'googlesyndication.com',
  'googletagservices.com',
  'googletagmanager.com',
  'analytics.google.com',
  'adservice.google.com',
  'adnxs.com',
  'rubiconproject.com',
  'pubmatic.com',
  'amazon-adsystem.com',
  'scorecardresearch.com',
  'taboola.com',
  'outbrain.com',
  'openx.net',
  'criteo.com',
  'gumgum.com',
  'loopme.me',
  'js-sec.indexww.com',
  'indexww.com',
  'adsystem.com',
  'adroll.com',
  'adcolony.com',
  'applovin.com',
  'chartbeat.com',
  'hotjar.com',
  'optimizely.com',
  'quantserve.com',
  'quantcast.com',
  'facebook.net',
  'connect.facebook.net',
  'ads.youtube.com',
  'ads.twitter.com',
  'ads.linkedin.com',
  'adserver',
  'adskeeper',
  'clicksure',
  'popads',
  'propellerads',
  'adform.net',
  'adtech.de',
  'adup-technology.de',
  'advertising.com',
  'yieldlab.net'
]);

function loadPreferences() {
  try {
    if (fs.existsSync(PREFERENCES_FILE)) {
      const data = fs.readFileSync(PREFERENCES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading preferences file, falling back to defaults:", err);
  }
  return DEFAULT_PREFERENCES;
}

function savePreferences(prefs) {
  try {
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(prefs, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing preferences file:", err);
    return false;
  }
}

function createWindow(showImmediately = true) {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "Notscape Nostalgia Gold(ish)",
    show: showImmediately,
    icon: path.join(__dirname, 'icon.png'),
    frame: false, // Make frameless for custom Win95 title bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Crucial for enabling the guest <webview> component
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (!mainWindow) {
    mainWindow = win;
  }

  // Remove native default OS menu bar as we render a custom HTML menu bar inside the page
  win.setMenuBarVisibility(false);
  win.setAutoHideMenuBar(true);

  win.loadFile(path.join(__dirname, 'index.html'));

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });
}

function createSplashWindow() {
  if (splashWindow) {
    splashWindow.focus();
    return;
  }

  splashWindow = new BrowserWindow({
    width: 300,
    height: 450,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  const splashTimer = setTimeout(() => {
    dismissSplash();
  }, 5000);

  const dismissHandler = () => {
    dismissSplash();
  };

  ipcMain.once('dismiss-splash', dismissHandler);

  function dismissSplash() {
    clearTimeout(splashTimer);
    ipcMain.removeListener('dismiss-splash', dismissHandler);
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  }

  splashWindow.on('closed', () => {
    clearTimeout(splashTimer);
    ipcMain.removeListener('dismiss-splash', dismissHandler);
    splashWindow = null;
  });
}

// Register protocol handler before app is ready
app.whenReady().then(() => {
  const handleProtocol = (request) => {
    // Strip the "notscape://" prefix
    let relativePath = request.url.replace(/^notscape:\/\//, '');
    
    // Remove trailing slash if present
    if (relativePath.endsWith('/')) {
      relativePath = relativePath.slice(0, -1);
    }
    
    // Resolve portal mapping
    if (relativePath === 'portal') {
      relativePath = 'retro_portal.html';
    }
    
    const filePath = path.join(__dirname, relativePath);
    try {
      const mimeType = relativePath.endsWith('.html') ? 'text/html' : 'text/plain';
      const data = fs.readFileSync(filePath);
      return new Response(data, {
        headers: { 'content-type': mimeType }
      });
    } catch (err) {
      console.error(`Could not read file notscape://${relativePath}`, err);
      return new Response("Not Found", { status: 404 });
    }
  };

  const ses = session.fromPartition('persist:notscape_session');
  
  // Register handlers on both standard and partitioned webview sessions
  session.defaultSession.protocol.handle('notscape', handleProtocol);
  ses.protocol.handle('notscape', handleProtocol);

  const sessionsToHook = [session.defaultSession, ses];
  sessionsToHook.forEach(s => {
    s.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Linux; x86_64; Notscape Nostalgia Gold(ish)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    s.webRequest.onBeforeRequest((details, callback) => {
      const prefs = loadPreferences();
      if (prefs.navigator.enable_adblock) {
        try {
          const urlObj = new URL(details.url);
          const hostname = urlObj.hostname.toLowerCase();
          const isBlocked = Array.from(BLOCKED_DOMAINS).some(blocked => {
            return hostname === blocked || hostname.endsWith('.' + blocked) || hostname.includes(blocked);
          });
          if (isBlocked) {
            console.log(`[AdBlocker] Blocked: ${details.url}`);
            callback({ cancel: true });
            return;
          }
        } catch (e) {
          // ignore parsing errors
        }
      }
      callback({ cancel: false });
    });
  });

  createWindow(false);
  createSplashWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(true);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC communication endpoints for preferences and windows
ipcMain.handle('get-preferences', () => {
  return loadPreferences();
});

ipcMain.handle('save-preferences', (event, prefs) => {
  return savePreferences(prefs);
});

ipcMain.on('minimize-app', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('maximize-app', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('close-app', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.on('show-splash', () => {
  createSplashWindow();
});

ipcMain.on('new-window', () => {
  createWindow(true);
});
