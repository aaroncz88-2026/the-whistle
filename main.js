const { app, BrowserWindow } = require("electron");
const path = require("path");

app.setAppUserModelId("com.demo.thewhistle");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "THE WHISTLE",
    icon: path.join(__dirname, "build", "icon.ico"),
    backgroundColor: "#070A12",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "index.html"));
  win.once("ready-to-show", () => win.show());
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});
