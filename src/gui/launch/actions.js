/** @copyright Simas Toleikis, 2017 */

import fs from "fs"
import path from "path"
import {spawn} from "child_process"
import glob from "glob"
import {remote} from "electron"
import {moveFileSync, showErrorMessage} from "../app"
import {FileExtension} from "../missions"
import missionsStore from "../missions/store"
import launchStore from "./store"

import {
	isValidGamePath,
	RealismPreset,
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
const PATH_TRACKS = path.join(PATH_GAME_DATA, "Tracks")
const PATH_USER_DATA = path.join(PATH_GAME_DATA, "swf", "il2", "userdata")

// Autoplay file restore timeout identifier
let autoplayRestoreTS

// Tracks directory watcher reference
let tracksWatcher

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
			'&missionPath="' + path.join(missionsStore.path, missionID) + '"'
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

// HACK: There is a bug in IL-2 Sturmovik where flight records for a mission
// launched with autoplay.cfg are activated, but the mission file is not
// copied together with the track recording files. This seems to be a problem
// related to the fact our mission files are external and are not part of the
// "data/Missions" directory. As a workaround - watch the track recordings
// directory for changes and copy the mission files.
function fixFlightRecords(missionID) {

	const {gamePath} = launchStore
	const tracksPath = path.join(gamePath, PATH_TRACKS)

	// Re-initialize directory watcher
	if (tracksWatcher) {
		tracksWatcher.close()
	}

	// Watch for changes in the tracks directory
	tracksWatcher = fs.watch(tracksPath, {
		persistent: false,
		recursive: false
	}, (eventType, fileName) => {

		if (!fileName || eventType !== "rename") {
			return
		}

		const trackDir = path.join(tracksPath, fileName)

		// Track records will have a separate directory for mission files
		if (!fs.statSync(trackDir).isDirectory()) {
			return
		}

		const trackMissionID = path.basename(trackDir, path.extname(trackDir))

		// Apply fix only for our mission launched via autoplay.cfg
		if (trackMissionID !== missionID) {
			return
		}

		const mission = missionsStore.index[missionID]

		// Copy all mission files (except metadata file)
		for (const missionFile of mission.files) {

			const extension = path.extname(missionFile)

			if (extension === ("." + FileExtension.Meta)) {
				continue
			}

			fs.writeFileSync(
				path.join(trackDir, missionFile),
				fs.readFileSync(path.join(missionsStore.path, missionFile))
			)
		}
	})
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
		return
	}

	const gameExePath = path.join(gamePath, PATH_GAME_EXE)
	let maxAutoplayTime = MAX_AUTOPLAY_TIME

	try {

		cancelAutoPlayRestoreTimeout()

		// Create autoplay.cfg file
		createAutoPlay(missionID, skipPlaneSettings)

		// Write custom realism options to mission settings file
		writeRealismOptions()

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

		// Activate the fix for flight recording
		fixFlightRecords(missionID)
	}
	catch (e) {

		maxAutoplayTime = 0

		// Show an error suggesting to use elevated il2mg executable permissions
		showErrorMessage(
			"Could not launch IL-2 Sturmovik!\n\n" +
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
	const realismOptions = new Set()

	// Map "customSettings" values to realism options
	for (const [param, value] of options) {

		if (Number(value)) {
			realismOptions.add(param)
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
}