import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from "electron/main";
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
const dbPromise = initDatabase();
let tray;
let isTimerRunning = false;
let lastStart = null;
let activeTaskId = null;

function updateTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show", click: () => BrowserWindow.getAllWindows()[0]?.show() },
      {
        label: isTimerRunning ? "Pause task" : "Start task",
        click: () => {
          const win = BrowserWindow.getAllWindows()[0];
          if (win) {
            win.webContents.send("tray:toggle-timer");
          }
        },
      },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ]),
  );
}

function createTray() {
  const iconPath = path.join(__dirname, "../../32x32.png");
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
    icon: path.join(__dirname, "../../512x512.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "../index.html"));
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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
