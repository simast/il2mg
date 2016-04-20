/** @copyright Simas Toleikis, 2016 */
"use strict";

const electron = require("electron");

// Electron built-in modules
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

// Disable legacy built-in module require style
electron.hideInternalModules();

let mainWindow = null;

// Make sure only a single app instance is allowed to run at the same time
const isOtherInstance = app.makeSingleInstance(() => {
	
	if (mainWindow) {
		
		// Restore minimized main window
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}
		
		// Focus main window
		mainWindow.focus();
	}
});

if (isOtherInstance) {
	app.exit(0); // Success
}

const fs = require("fs");
const path = require("path");

// Window size
const WINDOW_WIDTH = 800;
const WINDOW_HEIGHT = 600;

// Show Developer Tools
ipcMain.on("showDevTools", () => {
	mainWindow.webContents.openDevTools({detach: true});
});

// Force reload
ipcMain.on("forceReload", () => {
	mainWindow.webContents.reloadIgnoringCache();
});

// Global JSON configuration data object
const config = global.config = {};
let configPath;

// Quit when all windows are closed
app.on("window-all-closed", () => {
	app.quit();
});

// Create main application window
app.on("ready", () => {
	
	// Load JSON configuration data
	configPath = path.join(app.getPath("userData"), "config.json");
	
	try {
		Object.assign(config, JSON.parse(fs.readFileSync(configPath, "utf-8")));
	}
	catch (e) {}
	
	// Initialize default missions storage path
	if (!config.missionsPath) {
		config.missionsPath = path.join(app.getPath("documents"), app.getName());
	}
	
	// Make sure missions storage directory exists
	if (!fs.existsSync(config.missionsPath)) {
		fs.mkdirSync(config.missionsPath);
	}
	
	const windowConfig = {
		title: "il2mg - Mission Generator",
		useContentSize: true,
		width: WINDOW_WIDTH,
		height: WINDOW_HEIGHT,
		resizable: false,
		maximizable: false,
		acceptFirstMouse: true,
		fullscreenable: false,
		autoHideMenuBar: true,
		backgroundColor: "#fbe9bc", // TODO
		webPreferences: {
			webgl: false,
			webaudio: false,
			plugins: false,
			defaultEncoding: "UTF-8"
		}
	};
	
	// Use existing (saved) window position
	if (config.window) {
		
		const {workArea} = electron.screen.getDisplayMatching(config.window);
		let {x, y, width, height} = config.window;
		
		// Make sure window is not outside display work area
		x = Math.min(Math.max(x, workArea.x), workArea.x + workArea.width - width);
		y = Math.min(Math.max(y, workArea.y), workArea.y + workArea.height - height);
		
		Object.assign(windowConfig, {center: false, x, y});
	}
	
	mainWindow = new BrowserWindow(windowConfig);
	
	mainWindow.setMenu(null);
	mainWindow.loadURL("file://" + __dirname + "/main.html");
	
	// Prevent document from changing window title
	mainWindow.on("page-title-updated", (event) => {
		event.preventDefault();
	});
	
	// Save main window position and size
	mainWindow.on("close", () => {
		config.window = mainWindow.getBounds();
	});
	
	// Invalidate main window reference
	mainWindow.on("closed", () => {
		mainWindow = null;
	});
});

// Write application configuration data
app.on("before-quit", () => {
	
	if (configPath) {
		fs.writeFileSync(configPath, JSON.stringify(config, null, "\t"));
	}
});