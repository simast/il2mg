/** @copyright Simas Toleikis, 2016 */
"use strict";

const electron = require("electron");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow = null;

// Quit when all windows are closed
app.on("window-all-closed", () => {
	app.quit();
});

app.on("ready", () => {
	
	// Create main window
	mainWindow = new BrowserWindow({
		title: app.getName(),
		useContentSize: true,
		width: 800,
		height: 600,
		minWidth: 800,
		maxWidth: 800,
		minHeight: 500,
		maximizable: false,
		acceptFirstMous: true,
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