/** @copyright Simas Toleikis, 2016 */
"use strict";

const electron = require("electron");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow = null;

// Make sure only a single app instance is allowed to run
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
	
	app.quit();
	return;
}

// Quit when all windows are closed
app.on("window-all-closed", () => {
	app.quit();
});

// Create main application window
app.on("ready", () => {
	
	mainWindow = new BrowserWindow({
		title: app.getName(),
		useContentSize: true,
		width: 800,
		minWidth: 800,
		maxWidth: 800,
		height: 600,
		minHeight: 500,
		maximizable: false,
		acceptFirstMouse: true,
		fullscreenable: false,
		webPreferences: {
			webgl: false,
			webaudio: false,
			plugins: false,
			defaultEncoding: "UTF-8"
		}
	});
	
	mainWindow.setMenu(null);
	mainWindow.loadURL("file://" + __dirname + "/index.html");

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
});