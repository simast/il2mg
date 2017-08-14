/** @copyright Simas Toleikis, 2016 */
"use strict"

// Electron built-in modules
const electron = require("electron")
const {app, BrowserWindow, ipcMain} = electron

let mainWindow = null

// Make sure only a single app instance is allowed to run at the same time
const isOtherInstance = app.makeSingleInstance(() => {

	if (mainWindow) {

		// Restore minimized main window
		if (mainWindow.isMinimized()) {
			mainWindow.restore()
		}

		// Focus main window
		mainWindow.focus()
	}
})

if (isOtherInstance) {
	app.exit(0) // Success
}

const fs = require("fs")
const path = require("path")

// Min and max window size
const MIN_WINDOW_WIDTH = 800
const MAX_WINDOW_WIDTH = 1000
const MIN_WINDOW_HEIGHT = 600
const MAX_WINDOW_HEIGHT = 750

// Config file name
const CONFIG_FILE = "Config.json"

// Default missions storage directory name
const MISSIONS_DIR = "Missions"

// Global JSON configuration data object
const config = global.config = {}
let configPath

// Handle set config data requests from renderer process
ipcMain.on("setConfig", (event, configData) => {

	Object.assign(config, configData)
	event.returnValue = true
})

// Handle create mission requests from renderer process
ipcMain.on("createMission", async (event, params) => {

	const Mission = require("../mission")

	// Create a new mission
	const mission = new Mission(params)

	// Save mission files
	await mission.save(config.missionsPath)

	event.sender.send("createMission")
})

// Quit when all windows are closed
app.on("window-all-closed", () => {
	app.quit()
})

// Create main application window
app.on("ready", () => {

	const userDataPath = app.getPath("userData")

	// Load JSON configuration data
	configPath = path.join(userDataPath, CONFIG_FILE)

	try {
		Object.assign(config, JSON.parse(fs.readFileSync(configPath, "utf-8")))
	}
	catch (e) {}

	// Initialize default missions storage path
	if (!config.missionsPath) {
		config.missionsPath = path.join(userDataPath, MISSIONS_DIR)
	}

	// Make sure missions storage directory exists
	if (!fs.existsSync(config.missionsPath)) {
		fs.mkdirSync(config.missionsPath)
	}

	const windowConfig = {
		title: "il2mg - Mission Generator",
		show: false,
		useContentSize: true,
		width: MIN_WINDOW_WIDTH,
		height: MIN_WINDOW_HEIGHT,
		minWidth: MIN_WINDOW_WIDTH,
		minHeight: MIN_WINDOW_HEIGHT,
		maxWidth: MAX_WINDOW_WIDTH,
		maxHeight: MAX_WINDOW_HEIGHT,
		resizable: true,
		maximizable: false,
		acceptFirstMouse: true,
		fullscreenable: false,
		autoHideMenuBar: true,
		backgroundColor: "#FAEABD",
		webPreferences: {
			webgl: false,
			webaudio: false,
			plugins: false,
			defaultEncoding: "utf-8"
		}
	}

	// Use existing (saved) window position
	if (config.window) {

		let {x, y, width, height} = config.window

		width = Math.max(Math.min(width, MAX_WINDOW_WIDTH), MIN_WINDOW_WIDTH)
		height = Math.max(Math.min(height, MAX_WINDOW_HEIGHT), MIN_WINDOW_HEIGHT)

		const {workArea} = electron.screen.getDisplayMatching({x, y, width, height})

		// Make sure window is not outside display work area
		x = Math.min(Math.max(x, workArea.x), workArea.x + workArea.width - width)
		y = Math.min(Math.max(y, workArea.y), workArea.y + workArea.height - height)

		Object.assign(windowConfig, {center: false, x, y, width, height})
	}

	mainWindow = new BrowserWindow(windowConfig)

	mainWindow.setMenu(null)
	mainWindow.loadURL("file://" + __dirname + "/index.html")

	// Prevent document from changing window title
	mainWindow.on("page-title-updated", event => {
		event.preventDefault()
	})

	// Show main window (without a visual flash)
	mainWindow.once("ready-to-show", () => {
		mainWindow.show()
	})

	// Disable opening new windows (also fixes shift+click on link issue)
	mainWindow.webContents.on("new-window", event => {
		event.preventDefault()
	})

	// Save main window position and size
	mainWindow.on("close", () => {

		const {x, y} = mainWindow.getBounds()
		const [width, height] = mainWindow.getContentSize()

		// NOTE: Minimized window will have zero width and height!
		if (width && height) {
			config.window = {x, y, width, height}
		}
	})

	// Invalidate main window reference
	mainWindow.on("closed", () => {
		mainWindow = null
	})
})

// Write application configuration data
app.on("before-quit", () => {

	if (configPath) {
		fs.writeFileSync(configPath, JSON.stringify(config, null, "\t"))
	}
})