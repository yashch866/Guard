import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn } from 'child_process';
import path, { join } from 'path';
import waitOn from 'wait-on';
import net from 'net';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
const execAsync = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;
let viteProcess;
let tvoipProcess;

const BASE_BACKEND_PORT = 5000;
const TVOIP_PORT = 3333;
const FRONTEND_PORT = 8080;

/**
 * Check if a TCP port is available
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find a free port starting from a base port
 */
async function getFreePort(startPort) {
  let port = startPort;
  while (!(await checkPort(port))) {
    port++;
  }
  return port;
}

/**
 * Start FastAPI backend
 * - Dev → run uvicorn inside virtualenv
 * - Prod → run compiled binary (`main`)
 */
async function startBackend() {
  try {
    console.log('Starting backend...');
    console.log('Is packaged:', app.isPackaged);
    console.log('Resource path:', process.resourcesPath);

    // Allow using an already running (external) backend for testing/debugging
    if (process.env.USE_EXTERNAL_BACKEND === '1') {
      console.log('USE_EXTERNAL_BACKEND=1 → Skipping bundled backend spawn.');
      console.log(`Assuming backend available on ${BASE_BACKEND_PORT}`);
      return BASE_BACKEND_PORT;
    }

    // Determine the backend executable path based on packaging state
    let backendPath;
    
    if (app.isPackaged) {
      // In production, try multiple locations including AppImage
      const potentialPaths = [
        join(process.resourcesPath, 'app', 'main'),
        join(process.resourcesPath, '..', 'app', 'main'),
        join(__dirname, '..', 'resources', 'app', 'main'),
        join(__dirname, '..', '..', 'resources', 'app', 'main'),
        join(__dirname, 'resources', 'app', 'main'),
        // AppImage path
        join(__dirname, '..', 'app', 'main')
      ];
      
      for (const path of potentialPaths) {
        if (existsSync(path)) {
          backendPath = path;
          break;
        }
      }
      
      if (!backendPath) {
        console.error('Could not find backend binary in any expected location');
        console.log('Checked paths:');
        potentialPaths.forEach(path => console.log(`  - ${path}`));
        throw new Error('Backend binary not found');
      }
    } else {
      // In development, use the relative path
      backendPath = './resources/app/main';
    }

    console.log(`Using backend path: ${backendPath}`);

    // Get available port for backend - try the exact BASE_BACKEND_PORT first
    let backendPort = BASE_BACKEND_PORT;
    const portAvailable = await checkPort(backendPort);
    if (!portAvailable) {
      console.log(`Port ${backendPort} is not available, finding next free port...`);
      backendPort = await getFreePort(BASE_BACKEND_PORT + 1);
    }
    console.log(`Starting backend on port ${backendPort}...`);

    if (app.isPackaged) {
      // Production: run the compiled binary
      backendProcess = spawn(backendPath, ['--port', backendPort.toString(), '--host', '0.0.0.0'], {
        stdio: ['ignore', 'pipe', 'pipe'], // Hide console output
        shell: false
      });
    } else {
      // Development: run via uvicorn
      backendProcess = spawn('python', ['-m', 'uvicorn', 'src.backend.main:app', '--port', backendPort.toString(), '--host', '0.0.0.0'], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'], // Hide console output
        shell: false
      });
    }

    // Pipe backend logs for debugging
    if (backendProcess.stdout) {
      backendProcess.stdout.on('data', (data) => {
        try { console.log(`[backend stdout] ${data.toString().trim()}`); } catch {}
      });
    }
    if (backendProcess.stderr) {
      backendProcess.stderr.on('data', (data) => {
        try { console.error(`[backend stderr] ${data.toString().trim()}`); } catch {}
      });
    }

    backendProcess.on('exit', (code, signal) => {
      console.log(`Backend exited with code ${code}, signal ${signal}`);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
    });

    // Wait for backend port to be available before returning
    try {
      await waitOn({ resources: [`tcp:127.0.0.1:${backendPort}`], timeout: 10000 });
      console.log(`Backend is reachable on 127.0.0.1:${backendPort}`);
    } catch (e) {
      console.error('Backend did not become reachable in time:', e);
    }

    return backendPort;
  } catch (error) {
    console.error('Error starting backend:', error);
    throw error;
  }
}

/**
 * Start tvoip service for voice communication
 */
async function startTvoip() {
  try {
    console.log('Starting tvoip service...');
    
    // Check if port is available
    const tvoipPortAvailable = await checkPort(TVOIP_PORT);
    if (!tvoipPortAvailable) {
      console.log(`Port ${TVOIP_PORT} is already in use, attempting to kill existing process...`);
      // Try to kill existing tvoip process
      spawn('pkill', ['-f', 'node index.js --listen 3333'], { stdio: 'ignore' });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }

    // Path to tvoip directory
    const tvoipPath = join(process.env.HOME || '/home/jetson', 'tvoip');
    
    if (!existsSync(tvoipPath)) {
      console.error('tvoip directory not found at:', tvoipPath);
      return false;
    }

    console.log(`Starting tvoip from: ${tvoipPath}`);
    console.log(`tvoip command: node index.js --listen ${TVOIP_PORT} --input hw:2,0 --output hw:2,0`);

    // Start tvoip process
    tvoipProcess = spawn('node', ['index.js', '--listen', TVOIP_PORT.toString(), '--input', 'hw:2,0', '--output', 'hw:2,0'], {
      cwd: tvoipPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    // Pipe tvoip logs
    if (tvoipProcess.stdout) {
      tvoipProcess.stdout.on('data', (data) => {
        try { console.log(`[tvoip stdout] ${data.toString().trim()}`); } catch {}
      });
    }
    if (tvoipProcess.stderr) {
      tvoipProcess.stderr.on('data', (data) => {
        try { console.error(`[tvoip stderr] ${data.toString().trim()}`); } catch {}
      });
    }

    tvoipProcess.on('exit', (code, signal) => {
      console.log(`tvoip exited with code ${code}, signal ${signal}`);
    });

    tvoipProcess.on('error', (err) => {
      console.error('Failed to start tvoip:', err);
    });

    // Wait for tvoip service to be ready
    try {
      await waitOn({ resources: [`tcp:127.0.0.1:${TVOIP_PORT}`], timeout: 10000 });
      console.log(`✅ tvoip service is ready on port ${TVOIP_PORT}`);
      return true;
    } catch (e) {
      console.error('❌ tvoip service did not start in time:', e);
      return false;
    }

  } catch (error) {
    console.error('Error starting tvoip service:', error);
    return false;
  }
}

/**
 * Start Vite dev server (development mode)
 */
async function startVite() {
  console.log(`Starting Vite dev server on port ${FRONTEND_PORT}...`);

  viteProcess = spawn('npm', ['run', 'dev:vite-only'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  viteProcess.on('exit', (code, signal) => {
    console.log(`Vite exited with code ${code}, signal ${signal}`);
  });

  viteProcess.on('error', (err) => {
    console.error('Failed to start Vite dev server:', err);
  });

  return `http://127.0.0.1:${FRONTEND_PORT}`;
}

/**
 * Create main Electron window
 */
async function createWindow() {
  console.log('Creating window...');
  
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload path:', preloadPath);
  console.log('Preload exists:', existsSync(preloadPath));
  
  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false, // Remove window frame (title bar, minimize, maximize, close buttons)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      devTools: true, // Temporarily enable for debugging
      webSecurity: true
    },
    show: false, // Don't show until ready
  });

  try {
    let frontendURL;
    if (process.env.NODE_ENV === 'development') {
      frontendURL = await startVite();
      console.log('Loading development frontend URL:', frontendURL);
      await mainWindow.loadURL(frontendURL);
    } else {
      // In production, load the built frontend files
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      console.log('Loading production index path:', indexPath);
      await mainWindow.loadFile(indexPath);
    }
    
    mainWindow.show();
  } catch (error) {
    console.error('Failed to load frontend:', error);
    app.quit();
  }
}

/**
 * Cleanup all child processes
 */
function cleanup() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  if (viteProcess) {
    viteProcess.kill();
    viteProcess = null;
  }
  if (tvoipProcess) {
    tvoipProcess.kill();
    tvoipProcess = null;
  }
}

/**
 * Get the display name for xrandr
 */
async function getDisplayName() {
  return new Promise((resolve) => {
    const xrandr = spawn('xrandr', ['--current']);
    let output = '';
    
    xrandr.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    xrandr.on('close', () => {
      const match = output.match(/^(\S+) connected/m);
      resolve(match ? match[1] : 'eDP-1'); // Default to eDP-1 if no match
    });
  });
}

/**
 * App event handlers
 */
app.whenReady().then(async () => {
  console.log('App is ready, starting backend...');
  
  try {
    const backendURL = await startBackend();
    console.log('Backend started successfully at:', backendURL);
  } catch (error) {
    console.error('Failed to start backend:', error);
    app.quit();
    return;
  }
  
  // Start tvoip service for voice communication
  console.log('Starting tvoip service...');
  const tvoipStarted = await startTvoip();
  if (tvoipStarted) {
    console.log('✅ tvoip service started successfully');
  } else {
    console.warn('⚠️ tvoip service failed to start - voice features may not work');
  }
  
  await createWindow();
  
  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
  
  // Handle ESC key to close app (since there's no close button)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      app.quit();
    }
  });
  
  console.log('App setup complete');
});

// Add these handlers before createWindow()
ipcMain.handle('get-brightness', async () => {
  try {
    const maxBrightness = parseInt(await fs.readFile('/sys/class/backlight/nvidia_wmi_ec_backlight/max_brightness', 'utf8'));
    const currentBrightness = parseInt(await fs.readFile('/sys/class/backlight/nvidia_wmi_ec_backlight/brightness', 'utf8'));
    return Math.round((currentBrightness / maxBrightness) * 100);
  } catch (error) {
    console.error('Error getting brightness:', error);
    return 80; // default brightness
  }
});

ipcMain.handle('set-brightness', async (event, level) => {
  try {
    const maxBrightness = parseInt(await fs.readFile('/sys/class/backlight/nvidia_wmi_ec_backlight/max_brightness', 'utf8'));
    const newBrightness = Math.round((level / 100) * maxBrightness);
    
    // Try to write directly first
    try {
      await fs.writeFile('/sys/class/backlight/nvidia_wmi_ec_backlight/brightness', newBrightness.toString());
      return true;
    } catch (writeError) {
      // If permission denied, try using sudo
      if (writeError.code === 'EACCES') {
        await new Promise((resolve, reject) => {
          exec(`echo ${newBrightness} | sudo tee /sys/class/backlight/nvidia_wmi_ec_backlight/brightness`, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        return true;
      }
      throw writeError;
    }
  } catch (error) {
    console.error('Error setting brightness:', error);
    return false;
  }
});

// Add brightness control handlers
ipcMain.handle('brightness:get', async () => {
  try {
    const { stdout: currentOut } = await execAsync('sudo brightnessctl get');
    const { stdout: maxOut } = await execAsync('sudo brightnessctl max');
    const current = parseInt(currentOut.trim());
    const max = parseInt(maxOut.trim());
    return Math.round((current / max) * 100);
  } catch (error) {
    console.error('Error getting brightness:', error);
    return 50;
  }
});

ipcMain.handle('brightness:set', async (event, value) => {
  try {
    await execAsync(`sudo brightnessctl set ${value}%`);
    return true;
  } catch (error) {
    console.error('Error setting brightness:', error);
    return false;
  }
});

// Quit everything when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    cleanup();
    app.quit();
  }
});

// Handle exit signals
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(); });
process.on('SIGTERM', () => { cleanup(); process.exit(); });
