// Desktop widget: lives in the macOS menu bar / Windows notification area.
// Clicking the icon opens the same UI as the extension in a small popover window.
const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require("electron");
const path = require("path");

const W = 340;
const H = 480;
const isMac = process.platform === "darwin";

let win, tray;
let pinned = false; // pinned = stays open when clicking elsewhere
let hiddenAt = 0;

function createWindow() {
  win = new BrowserWindow({
    width: W,
    height: H,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, "..", "app", "index.html"));
  win.on("blur", () => {
    if (pinned) return;
    win.hide();
    hiddenAt = Date.now();
  });
}

// Place the popover right under the menu bar (macOS) or above the taskbar (Windows).
function positionNearTray() {
  const b = tray.getBounds();
  const { workArea } = screen.getDisplayMatching(b);
  const atTop = b.y < workArea.y + workArea.height / 2;
  const x = Math.round(b.x + b.width / 2 - W / 2);
  win.setPosition(
    Math.max(workArea.x + 6, Math.min(x, workArea.x + workArea.width - W - 6)),
    atTop ? workArea.y + 6 : workArea.y + workArea.height - H - 6,
  );
}

function toggle() {
  if (win.isVisible()) return win.hide();
  // Clicking the tray icon blurs (and hides) the popover first: don't reopen it right away.
  if (Date.now() - hiddenAt < 250) return;
  positionNearTray();
  win.show();
  win.focus();
}

function createTray() {
  tray = new Tray(path.join(__dirname, "tray", isMac ? "trayTemplate.png" : "tray-win.png"));
  tray.setToolTip("Cases everywhere");
  const menu = Menu.buildFromTemplate([
    { label: "Ouvrir Cases everywhere", click: toggle },
    { type: "separator" },
    {
      label: "Lancer au démarrage",
      type: "checkbox",
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
    },
    { label: "Quitter", role: "quit" },
  ]);
  tray.on("click", toggle);
  tray.on("right-click", () => tray.popUpContextMenu(menu));
}

ipcMain.handle("widget:close", () => win.hide());
ipcMain.handle("widget:isPinned", () => pinned);
ipcMain.handle("widget:togglePin", () => (pinned = !pinned));

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", toggle);
  app.whenReady().then(() => {
    if (isMac) app.dock?.hide();
    createWindow();
    createTray();
    // Show the popover once at launch so it's obvious where the app lives.
    win.once("ready-to-show", toggle);
  });
  // Keep running in the tray when the popover is hidden.
  app.on("window-all-closed", (e) => e.preventDefault());
}
