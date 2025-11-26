const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  loadState: () => ipcRenderer.invoke("storage:load"),
  saveTask: (task) => ipcRenderer.invoke("storage:save-task", task),
  updateTask: (payload) => ipcRenderer.invoke("storage:update-task", payload),
  logSession: (payload) => ipcRenderer.invoke("storage:log-session", payload),
  resetTaskSeconds: (taskId) => ipcRenderer.invoke("storage:reset-task", taskId),
  deleteTask: (taskId) => ipcRenderer.invoke("storage:delete-task", taskId),
});

contextBridge.exposeInMainWorld("controls", {
  onTrayToggle: (callback) => {
    ipcRenderer.on("tray:toggle-timer", callback);
    return () => ipcRenderer.removeListener("tray:toggle-timer", callback);
  },
  sendTimerState: (state) => ipcRenderer.send("timer:state", state),
});
