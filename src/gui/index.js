/** @copyright Simas Toleikis, 2016 */
"use strict";

const {app, BrowserWindow, hideInternalModules} = require("electron");

// Disable legacy built-in module require style
hideInternalModules();

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

// Default window size and constraints
const WINDOW_WIDTH = 800;
const WINDOW_HEIGHT = 600;
const WINDOW_HEIGHT_MIN = 450;

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
	
	const windowConfig = {
		title: "il2mg - Mission Generator",
		useContentSize: true,
		minWidth: WINDOW_WIDTH,
		maxWidth: WINDOW_WIDTH,
		minHeight: WINDOW_HEIGHT_MIN,
		maximizable: false,
		acceptFirstMouse: true,
		fullscreenable: false,
		webPreferences: {
			webgl: false,
			webaudio: false,
			plugins: false,
			defaultEncoding: "UTF-8"
		}
	};
	
	// Use existing (saved) window size and position
	if (config.window) {
		
		windowConfig.center = false;
		windowConfig.x = config.window.x;
		windowConfig.y = config.window.y;
		windowConfig.width = config.window.width;
		windowConfig.height = config.window.height;
	}
	// Use default window size and position
	else {
		
		windowConfig.width = WINDOW_WIDTH;
		windowConfig.height = WINDOW_HEIGHT;
	}
	
	mainWindow = new BrowserWindow(windowConfig);
	
	mainWindow.setMenu(null);
	mainWindow.loadURL("file://" + __dirname + "/index.html");

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
});

// Write application configuration data
app.on("before-quit", () => {
	
	if (!configPath || !mainWindow) {
		return;
	}
	
	const bounds = mainWindow.getBounds();
	const contentSize = mainWindow.getContentSize();
	
	// Save main window position and content size
	config.window = {
		x: bounds.x,
		y: bounds.y,
		width: contentSize[0],
		height: contentSize[1]
	};
	
	fs.writeFileSync(configPath, JSON.stringify(config, null, "\t"));
});