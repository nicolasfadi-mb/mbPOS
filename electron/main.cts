/// <reference lib="dom" />

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import os from 'os';

// Startup environment info
console.log('[Electron startup] Node version:', process.versions.node);
console.log('[Electron startup] Chrome version:', process.versions.chrome);
console.log('[Electron startup] Electron version:', process.versions.electron);

// --- LIVE API domain ---
const API_BASE_URL = 'https://moodboardcoffeeshop.gt.tc';

// Vite dev server URL
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged) {
    win.loadURL(VITE_DEV_SERVER_URL).catch(e => {
      console.error('Error loading Vite URL, please check that the dev server is running:', e);
    });
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }
};

app.whenReady().then(() => {
  pingApi('/api/all-data.php');
  createWindow();
});

app.on('window-all-closed', () => {
  if (os.platform() !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- API ping for startup diagnostics ---
async function pingApi(endpoint: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json, text/plain, */*' },
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    let preview = '';

    try {
      preview = isJson
        ? JSON.stringify(await res.json()).slice(0, 200)
        : (await res.text()).slice(0, 200);
    } catch {
      // ignore preview errors
    }

    console.log(
      `[API ping] ${res.status} ${res.statusText} from ${url} | type: ${contentType}${preview ? ` | preview: ${preview}` : ''}`
    );

    if (!isJson) {
      console.warn(`[API ping] ⚠ Expected JSON but got ${contentType}. Check endpoint or server config.`);
    }
  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? `Timeout after ${timeoutMs} ms` : err?.message || String(err);
    console.warn(`[API ping] Failed to reach ${url}: ${msg}`);
  } finally {
    clearTimeout(t);
  }
}

// --- API Handlers for IPC ---
async function handleApiRequest(endpoint: string, options: RequestInit & { timeoutMs?: number }) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`API Error (${response.status}) on ${endpoint}:`, errorText);
      return { error: `API Error (${response.status}): ${errorText || response.statusText}` };
    }

    if (!isJson) {
      const htmlPreview = (await response.text()).slice(0, 200);
      console.warn(`[API handler] ⚠ Expected JSON but got ${contentType}. Preview: ${htmlPreview}`);
      return { error: `Unexpected response type: ${contentType}` };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return { error: `Request timed out after ${timeoutMs} ms` };
    }
    console.error('IPC API handler error:', error);
    return { error: error?.message || 'An unexpected error occurred' };
  } finally {
    clearTimeout(timeout);
  }
}

ipcMain.handle('api-get', (_event, endpoint: string) => {
  return handleApiRequest(endpoint, { method: 'GET' });
});

ipcMain.handle('api-post', (_event, endpoint: string, body: any) => {
  return handleApiRequest(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
});
