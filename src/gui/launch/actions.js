import fs from "fs"
import path from "path"
import {spawn} from "child_process"
import glob from "glob"
import {remote} from "electron"

import {APPLICATION_TITLE} from "../../constants"
import {moveFileSync, showErrorMessage} from "../app"
import missionsStore from "../missions/store"
import launchStore from "./store"

import {
	isValidGamePath,
	RealismPreset,
	RealismOption,
	PATH_GAME_DATA,
	PATH_GAME_EXE
} from "."

// Game file names
const FILE_AUTOPLAY = "autoplay.cfg"
const FILE_MISSION_SETTINGS = "missionsettings.mode=singleplayer.txt"

// NOTE: This is a max time (in milliseconds) to wait before removing
// generated autoplay.cfg file after game executable is launched. This is
// required to make sure users are not left in a permanent "autoplay" state.
const MAX_AUTOPLAY_TIME = 10000 // 10 seconds

// File and directory paths
const PATH_APP_DATA = remote.app.getPath("userData")
const PATH_AUTOPLAY = path.join(PATH_GAME_DATA, FILE_AUTOPLAY)
const PATH_MISSIONS_LINK = path.join("Missions", APPLICATION_TITLE)
const PATH_USER_DATA = path.join(PATH_GAME_DATA, "swf", "il2", "userdata")

// Autoplay file restore timeout identifier
let autoplayRestoreTS

// Create autoplay.cfg file
function createAutoPlay(missionID, skipPlaneSettings) {

	const {gamePath, realismPreset} = launchStore

	if (!gamePath) {
		return
	}

	const autoplayPath = path.join(gamePath, PATH_AUTOPLAY)

	// Make a backup copy of the original autoplay.cfg file
	if (fs.existsSync(autoplayPath)) {
		moveFileSync(autoplayPath, path.join(PATH_APP_DATA, FILE_AUTOPLAY))
	}

	// Make autoplay.cfg
	fs.writeFileSync(
		autoplayPath,
		[
			"&il2mg=1", // Flag used to identify generated autoplay file
			"&enabled=1",
			"&autoIngame=" + (skipPlaneSettings ? 1 : 0),
			"&missionSettingsPreset=" + realismPreset,
			'&missionPath="' + path.join(PATH_MISSIONS_LINK, missionID) + '"'
		].join("\r\n")
	)
}

// Restore autoplay.cfg file
export function restoreAutoPlay() {

	const {gamePath} = launchStore

	if (!gamePath) {
		return
	}

	const autoplayPath = path.join(gamePath, PATH_AUTOPLAY)
	const backupAutoplayPath = path.join(PATH_APP_DATA, FILE_AUTOPLAY)

	try {

		// Restore backup copy of the original autoplay.cfg file
		if (fs.existsSync(backupAutoplayPath)) {
			moveFileSync(backupAutoplayPath, autoplayPath)
		}
		// Remove existing autoplay.cfg file
		else if (fs.existsSync(autoplayPath)) {

			const autoplayContent = fs.readFileSync(autoplayPath, "utf-8")

			// Remove only known/generated autoplay file
			if (autoplayContent.indexOf("&il2mg=1") >= 0) {
				fs.unlinkSync(autoplayPath)
			}
		}
	}
	catch (e) {}
}

// Link our missions directory with game missions directory
function linkMissionsDirectory() {

	const {gamePath} = launchStore

	const pathTo = missionsStore.path
	const pathFrom = path.join(gamePath, PATH_GAME_DATA, PATH_MISSIONS_LINK)

	// Check existing link
	if (fs.existsSync(pathFrom)) {

		const isSymLink = fs.lstatSync(pathFrom).isSymbolicLink()

		if (!isSymLink) {
			throw new Error(`"${PATH_MISSIONS_LINK}" directory already exists!`)
		}

		const linkTarget = fs.readlinkSync(pathFrom)

		// Skip if link is already established and valid
		if (path.resolve(linkTarget) === path.resolve(pathTo)) {
			return
		}

		// Re-establish link with new target path
		fs.unlinkSync(pathFrom)
	}

	// Try creating a proper directory symlink
	// NOTE: This will probably require elevated user permissions (however this
	// limitation has been removed in Windows 10 build 14972 if "Developer Mode"
	// is enabled)
	try {
		fs.symlinkSync(pathTo, pathFrom, "dir")
	}
	catch (e) {

		// Fallback to "junction" directory symlinks
		fs.symlinkSync(pathTo, pathFrom, "junction")
	}
}

// Clear active autoplay restore timeout
function cancelAutoPlayRestoreTimeout() {

	if (autoplayRestoreTS) {

		clearTimeout(autoplayRestoreTS)
		autoplayRestoreTS = undefined
	}
}

// Launch mission
export function launchMission(missionID, skipPlaneSettings) {

	const {gamePath} = launchStore

	if (!gamePath || !isValidGamePath(gamePath)) {
		return false
	}

	const gameExePath = path.join(gamePath, PATH_GAME_EXE)
	let maxAutoplayTime = MAX_AUTOPLAY_TIME

	try {

		cancelAutoPlayRestoreTimeout()

		// Create missions directory symlink
		linkMissionsDirectory()

		// Write custom realism options to mission settings file
		writeRealismOptions()

		// Create autoplay.cfg file
		createAutoPlay(missionID, skipPlaneSettings)

		// Run game executable
		const gameProcess = spawn(gameExePath, {
			cwd: path.dirname(gameExePath),
			stdio: "ignore",
			detached: true
		})

		// Don't wait for the spawned game process to exit
		gameProcess.unref()

		// Minimize the window
		remote.getCurrentWindow().minimize()

		return true
	}
	catch (error) {

		maxAutoplayTime = 0

		// Show an error suggesting to use elevated il2mg executable permissions
		showErrorMessage(
			"Could not launch IL-2 Sturmovik! The reported error was:\n\n" +
			error.message + "\n\n" +
			"Please close this application and then run il2mg.exe again by right " +
			'clicking and using the "Run as administrator" menu option.'
		)
	}
	finally {

		const onWindowUnload = () => {

			cancelAutoPlayRestoreTimeout()
			restoreAutoPlay()
		}

		// Register window unload event (as a backup for restoring autoplay.cfg
		// file on application quit before delayed timeout event is executed).
		window.addEventListener("unload", onWindowUnload)

		// Setup delayed autoplay.cfg file restore event - making sure game
		// executable has enough time to actually read the generated file.
		// TODO: Use fs.watchFile?
		autoplayRestoreTS = setTimeout(() => {

			restoreAutoPlay()
			window.removeEventListener("unload", onWindowUnload)

		}, maxAutoplayTime)
	}

	return false
}

// Select a valid game path
export function selectGamePath() {

	// Show game path selection dialog
	let gamePath = remote.dialog.showOpenDialog(
		remote.getCurrentWindow(),
		{
			title: "Select IL-2 Sturmovik folder...",
			properties: ["openDirectory"],
			defaultPath: launchStore.gamePath
		}
	)

	// Ignore on cancel button press
	if (!Array.isArray(gamePath)) {
		return
	}

	let isValidPath = false
	const folder = gamePath = gamePath[0]

	// Check for valid game path in the selected folder (and in any parents)
	while (gamePath) {

		isValidPath = isValidGamePath(gamePath)

		// Found valid path
		if (isValidPath) {
			break
		}

		const parentPath = path.dirname(gamePath)

		// No more parent directories to traverse
		if (parentPath === gamePath) {
			break
		}

		gamePath = parentPath
	}

	if (isValidPath) {
		launchStore.setGamePath(gamePath)
	}
	// Show error message and abort if game path is invalid
	else {

		showErrorMessage(
			"Selected folder is not a valid IL-2 Sturmovik directory:\n\n" +
			folder
		)
	}
}

// Read all single-player mission settings files from all game users
// NOTE: Files are sorted based on recent modification time
function readMissionSettingsFiles() {

	const {gamePath} = launchStore

	if (!gamePath) {
		return []
	}

	const userDataPath = path.join(gamePath, PATH_USER_DATA)

	if (!fs.existsSync(userDataPath)) {
		return []
	}

	const matches = glob.sync(
		path.join(userDataPath, "!(default)/" + FILE_MISSION_SETTINGS),
		{
			silent: true,
			nodir: true
		}
	)

	if (!matches) {
		return []
	}

	// Read modification time for each matched file name
	const timeByMatch = matches.reduce(
		(result, filePath) => result.set(filePath, fs.statSync(filePath).mtime.getTime()),
		new Map()
	)

	// Sort matched files based on recent modification time
	matches.sort((a, b) => timeByMatch.get(b) - timeByMatch.get(a))

	return matches
}

// Read custom realism options from last active game user
export function readRealismOptions() {

	// NOTE: Using most recently modified settings file to read realism options
	const [settingsFilePath] = readMissionSettingsFiles()

	if (!settingsFilePath) {
		return
	}

	const content = fs.readFileSync(settingsFilePath, "utf-8")
	const settingsState = new URLSearchParams(content).get("singleplayerSettingsState")

	if (!settingsState) {
		return
	}

	const customSettings = new URLSearchParams(settingsState).get("customSettings")

	if (!customSettings) {
		return
	}

	const options = new URLSearchParams(customSettings)
	const realismOptions = []

	// Map "customSettings" values to realism options
	for (const [param, value] of options) {

		if (Number(value) && !realismOptions.includes(param)) {
			realismOptions.push(param)
		}
	}

	return realismOptions
}

// Write custom realism options for all game users
function writeRealismOptions() {

	const {gamePath, realismPreset, realismOptions} = launchStore

	if (!gamePath || realismPreset !== RealismPreset.Custom || !realismOptions) {
		return
	}

	const settingsFiles = readMissionSettingsFiles()

	if (!settingsFiles.length) {
		return
	}

	const supportedRealismOptions = Object.values(RealismOption)

	// Update all mission settings files
	for (const settingsFilePath of settingsFiles) {

		const settings = new URLSearchParams(fs.readFileSync(settingsFilePath, "utf-8"))
		const settingsState = new URLSearchParams(settings.get("singleplayerSettingsState"))

		if (!settingsState) {
			continue
		}

		const customSettings = new URLSearchParams(settingsState.get("customSettings"))

		if (!customSettings) {
			continue
		}

		const prevCustomSettings = customSettings.toString()

		// Update all supported realism options
		for (const option of supportedRealismOptions) {
			customSettings.set(option, Number(realismOptions.includes(option)))
		}

		const newCustomSettings = customSettings.toString()

		// Skip file write when no settings are changed
		if (prevCustomSettings === newCustomSettings) {
			continue
		}

		settingsState.set("customSettings", newCustomSettings)
		settings.set("singleplayerSettingsState", settingsState.toString())

		fs.writeFileSync(settingsFilePath, settings.toString())
	}
}
