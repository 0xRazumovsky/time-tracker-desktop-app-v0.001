import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
} from "electron/main";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  initDatabase,
  loadState,
  logSession,
  resetTaskSeconds,
  saveTask,
  updateTask,
  deleteTask,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isPackaged = app.isPackaged;
const dbPromise = initDatabase();
let tray;
let isTimerRunning = false;
let lastStart = null;
let activeTaskId = null;
let mainWindow = null;

function assetPath(filename) {
  const candidates = [
    path.join(process.resourcesPath, filename),
    path.join(app.getAppPath(), filename),
    path.join(__dirname, "..", "..", filename),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  return found || candidates[candidates.length - 1];
}

function updateTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show", click: () => (mainWindow || BrowserWindow.getAllWindows()[0])?.show() },
      {
        label: isTimerRunning ? "Pause task" : "Start task",
        click: () => {
          const win = mainWindow || BrowserWindow.getAllWindows()[0];
          win?.show();
          win?.webContents.send("tray:toggle-timer");
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          tray?.destroy();
          app.quit();
        },
      },
    ])
  );
}

function createTray() {
  const iconPath = assetPath("32x32.png");
  const image = nativeImage.createFromPath(iconPath);
  tray = new Tray(image);
  tray.setToolTip("Flowtime");
  updateTrayMenu();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    icon: assetPath("512x512.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
  });

  win.loadFile(path.join(__dirname, "../index.html"));
  mainWindow = win;
}

app.whenReady().then(() => {
  if (process.platform === "darwin" && app.dock) {
    app.dock.hide();
  }

  createTray();
  createWindow();

  dbPromise.catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Failed to init database", error);
  });

  ipcMain.handle("storage:load", async () => {
    const db = await dbPromise;
    return loadState(db);
  });

  ipcMain.handle("storage:save-task", async (_event, task) => {
    const db = await dbPromise;
    return saveTask(db, task);
  });

  ipcMain.handle("storage:update-task", async (_event, { id, updates }) => {
    const db = await dbPromise;
    return updateTask(db, id, updates);
  });

  ipcMain.handle(
    "storage:log-session",
    async (_event, { taskId, seconds, timestamp }) => {
      const db = await dbPromise;
      return logSession(db, taskId, seconds, timestamp);
    }
  );

  ipcMain.handle("storage:reset-task", async (_event, taskId) => {
    const db = await dbPromise;
    return resetTaskSeconds(db, taskId);
  });

  ipcMain.handle("storage:delete-task", async (_event, taskId) => {
    const db = await dbPromise;
    return deleteTask(db, taskId);
  });

  ipcMain.on("timer:state", (_event, { running, taskId, lastTick }) => {
    isTimerRunning = running;
    activeTaskId = taskId;
    lastStart = lastTick;
    updateTrayMenu();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  tray?.destroy();
});

app.on("window-all-closed", () => {
  if (!app.isQuiting) {
    // keep app alive for tray
    return;
  }
  app.quit();
});
