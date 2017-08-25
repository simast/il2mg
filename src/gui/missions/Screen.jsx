/** @copyright Simas Toleikis, 2016 */

import fs from "fs"
import path from "path"
import {spawn} from "child_process"
import {remote} from "electron"
import React from "react"
import {observer} from "mobx-react"
import app from "../app/store"
import missions from "./store"
import {Difficulty} from "../app/"
import {FileExtension} from "./"
import {showErrorMessage, moveFileSync} from "../app/utils"
import Screen from "../app/Screen"
import MissionsList from "./List"
import MissionDetails from "./Details"

// Autoplay file name
const FILE_AUTOPLAY = "autoplay.cfg"

// File and directory paths
const PATH_USER_DATA = remote.app.getPath("userData")
const PATH_EXE = path.join("bin", "game", "Il-2.exe")
const PATH_DATA = "data"
const PATH_AUTOPLAY = path.join(PATH_DATA, FILE_AUTOPLAY)
const PATH_MISSIONS = path.join(PATH_DATA, "Missions")
const PATH_TRACKS = path.join(PATH_DATA, "Tracks")

// NOTE: This is a max time (in milliseconds) to wait before removing
// generated autoplay.cfg file after game executable is launched. This is
// required to make sure users are not left in a permanent "autoplay" state.
const MAX_AUTOPLAY_TIME = 10000 // 10 seconds

// Difficulty settings/preset modes
const difficultyModes = new Map([
	[Difficulty.Normal, "Normal"],
	[Difficulty.Expert, "Expert"],
	[Difficulty.Custom, "Custom"]
])

// Missions screen component
@observer export default class MissionsScreen extends React.Component {

	constructor() {
		super(...arguments)

		// Restore any existing autoplay.cfg file
		// NOTE: A workaround to fix leftover file in case of a program crash
		this.restoreAutoPlay()

		// Load missions from missions directory
		missions.load()

		// Create context menu for launch button difficulty choice
		if (missions.list.length) {

			const {Menu, MenuItem} = remote
			const launchMenu = this.launchMenu = new Menu()

			difficultyModes.forEach((difficultyLabel, difficultyID) => {

				launchMenu.append(new MenuItem({
					label: difficultyLabel,
					type: "radio",
					checked: (difficultyID === app.difficulty),
					click: () => {
						app.setDifficulty(difficultyID)
					}
				}))
			})
		}
	}

	componentWillMount() {

		const {match, history} = this.props

		// Handle index route request (when component has no active mission param)
		if (!match.params.mission) {

			// Show/select first mission
			if (missions.list.length) {
				history.replace("/missions/" + missions.list[0].id)
			}
			// Show create mission screen
			else {
				history.replace("/create?first=1")
			}
		}
	}

	componentDidMount() {

		this._onKeyDown = this.onKeyDown.bind(this)
		document.addEventListener("keydown", this._onKeyDown, true)
	}

	componentWillUnmount() {

		document.removeEventListener("keydown", this._onKeyDown, true)

		if (this.tracksWatcher) {
			this.tracksWatcher.close()
		}
	}

	// Render component
	render() {

		const {match} = this.props
		const missionID = match.params.mission
		const actions = {
			left: new Map()
		}

		// Create a new mission
		actions.left.set("Create New", {
			to: "/create"
		})

		// Set active mission from query params
		let mission

		if (missionID) {

			mission = missions.index[missionID]

			// Remove selected mission
			actions.left.set("Remove", {
				onClick: event => {
					this.removeMission(!event.ctrlKey)
				}
			})

			// Launch selected mission
			actions.right = new Map()
			actions.right.set("Launch", {
				className: "difficulty" + app.difficulty,
				onClick: event => {
					this.launchMission(event.ctrlKey)
				},
				onContextMenu: () => {
					this.launchMenu.popup(remote.getCurrentWindow())
				}
			})
		}

		const missionsListProps = {
			missions: missions.list,
			removeMission: this.removeMission.bind(this),
			saveMission: this.saveMission.bind(this)
		}

		return (
			<Screen id="missions" actions={actions}>
				<MissionsList {...missionsListProps} />
				{mission ? <MissionDetails mission={mission} /> : ""}
			</Screen>
		)
	}

	// Handle local keyboard shortcuts
	onKeyDown(event) {

		if (event.code === "Delete") {
			this.removeMission(!event.ctrlKey)
		}
		else {
			return
		}

		event.preventDefault()
		event.stopPropagation()
	}

	// Remove mission
	removeMission(confirm, missionID = this.props.match.params.mission) {

		if (!missionID) {
			return
		}

		let result = 0

		if (confirm) {

			// Confirm mission remove action
			result = remote.dialog.showMessageBox(
				remote.getCurrentWindow(),
				{
					type: "warning",
					title: "Remove Mission",
					message: "Are you sure you want to remove this mission?",
					buttons: ["Remove", "Cancel"],
					defaultId: 0,
					noLink: true
				}
			)
		}

		// Remove mission files
		if (result === 0) {

			const {match, history} = this.props
			const mission = missions.index[missionID]
			const {files} = mission
			const removedIndex = missions.list.indexOf(mission)

			for (const fileName of files) {
				fs.unlinkSync(path.join(missions.path, fileName))
			}

			// Reload missions
			missions.load()

			// Show create mission screen
			if (!missions.list.length) {
				return history.replace("/create?first=1")
			}

			// Select next mission on the list when removing active mission
			if (missionID === match.params.mission) {

				let nextMission

				if (removedIndex < missions.list.length) {
					nextMission = missions.list[removedIndex]
				}
				else {
					nextMission = missions.list[missions.list.length - 1]
				}

				history.replace("/missions/" + nextMission.id)
			}
		}
	}

	// Save mission
	saveMission(missionID) {

		if (!missionID) {
			return
		}

		const {gamePath} = app
		const mission = missions.index[missionID]
		let savePath

		// Use missions folder as default save path destination
		if (gamePath) {
			savePath = path.join(gamePath, PATH_MISSIONS)
		}
		// Use desktop as default save path destination
		else {
			savePath = remote.app.getPath("desktop")
		}

		// Suggest default mission file name
		savePath = path.join(savePath, missionID)

		// Find main mission file extension (either binary or text)
		let mainExtension = FileExtension.Text

		for (const missionFile of mission.files) {

			if (path.extname(missionFile) === ("." + FileExtension.Binary)) {

				mainExtension = FileExtension.Binary
				break
			}
		}

		// Show save mission dialog
		savePath = remote.dialog.showSaveDialog(
			remote.getCurrentWindow(),
			{
				defaultPath: savePath,
				filters: [
					{
						name: "Mission files (*." + mainExtension + ")",
						extensions: [mainExtension]
					}
				]
			}
		)

		// Save mission
		if (savePath) {

			const saveDir = path.dirname(savePath)
			const saveFile = path.basename(savePath, path.extname(savePath))

			// Save (copy) all mission files (except metadata file)
			for (const missionFile of mission.files) {

				const extension = path.extname(missionFile)

				if (extension === ("." + FileExtension.Meta)) {
					continue
				}

				fs.writeFileSync(
					path.join(saveDir, saveFile + extension),
					fs.readFileSync(path.join(missions.path, missionFile))
				)
			}
		}
	}

	// Launch mission
	launchMission(selectFolder) {

		const missionID = this.props.match.params.mission

		if (!missionID) {
			return
		}

		// Force selecting game path on first run or when existing path is invalid
		if (!app.gamePath || !this.isValidGamePath(app.gamePath)) {
			selectFolder = true
		}

		if (selectFolder) {

			// Show game path selection dialog
			let gamePath = remote.dialog.showOpenDialog(
				remote.getCurrentWindow(),
				{
					title: "Select IL-2 Sturmovik folder...",
					properties: ["openDirectory"],
					defaultPath: app.gamePath
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

				isValidPath = this.isValidGamePath(gamePath)

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
				app.setGamePath(gamePath)
			}
			// Show error message and abort if game path is invalid
			else {

				showErrorMessage(
					"Selected folder is not a valid IL-2 Sturmovik directory:\n\n" +
					folder
				)

				return
			}
		}

		const gameExePath = path.join(app.gamePath, PATH_EXE)
		let maxAutoplayTime = MAX_AUTOPLAY_TIME

		try {

			this.createAutoPlay(missionID)

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
			this.fixFlightRecords(missionID)
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
				this.restoreAutoPlay()
			}

			// Register window unload event (as a backup for restoring autoplay.cfg
			// file on application quit before delayed timeout event is executed).
			window.addEventListener("unload", onWindowUnload)

			// Setup delayed autoplay.cfg file restore event - making sure game
			// executable has enough time to actually read the generated file.
			// TODO: Use fs.watchFile?
			this.autoplayRemoveTS = setTimeout(() => {

				this.restoreAutoPlay()
				window.removeEventListener("unload", onWindowUnload)

			}, maxAutoplayTime)
		}
	}

	// Create autoplay.cfg file
	createAutoPlay(missionID) {

		if (this.autoplayRestoreTS) {

			clearTimeout(this.autoplayRestoreTS)
			delete this.autoplayRestoreTS
		}

		const {gamePath, difficulty} = app

		if (!gamePath || !missionID) {
			return
		}

		const autoplayPath = path.join(gamePath, PATH_AUTOPLAY)

		// Make a backup copy of the original autoplay.cfg file
		if (fs.existsSync(autoplayPath)) {
			moveFileSync(autoplayPath, path.join(PATH_USER_DATA, FILE_AUTOPLAY))
		}

		// Make autoplay.cfg
		fs.writeFileSync(
			autoplayPath,
			[
				"&il2mg=1", // Flag used to identify generated autoplay file
				"&enabled=1",
				"&missionSettingsPreset=" + difficulty,
				'&missionPath="' + path.join(missions.path, missionID) + '"'
			].join("\r\n")
		)
	}

	// Restore autoplay.cfg file
	restoreAutoPlay() {

		if (this.autoplayRestoreTS) {

			clearTimeout(this.autoplayRestoreTS)
			delete this.autoplayRestoreTS
		}

		const {gamePath} = app

		if (!gamePath) {
			return
		}

		const autoplayPath = path.join(gamePath, PATH_AUTOPLAY)
		const backupAutoplayPath = path.join(PATH_USER_DATA, FILE_AUTOPLAY)

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

	// Check if specified game path is valid
	isValidGamePath(gamePath) {

		if (!gamePath) {
			return false
		}

		// Check for "data" directory
		try {

			const dataPath = path.join(gamePath, PATH_DATA)
			const hasDataDirectory = fs.statSync(dataPath).isDirectory()

			if (!hasDataDirectory) {
				return false
			}
		}
		catch (e) {
			return false
		}

		// Check for game executable
		return fs.existsSync(path.join(gamePath, PATH_EXE))
	}

	// HACK: There is a bug in IL-2 Sturmovik where flight records for a mission
	// launched with autoplay.cfg are activated, but the mission file is not
	// copied together with the track recording files. This seems to be a problem
	// related to the fact our mission files are external and are not part of the
	// "data/Missions" directory. As a workaround - watch the track recordings
	// directory for changes and copy the mission files.
	fixFlightRecords(missionID) {

		const {gamePath} = app
		const tracksPath = path.join(gamePath, PATH_TRACKS)

		// Re-initialize directory watcher
		if (this.tracksWatcher) {
			this.tracksWatcher.close()
		}

		// Watch for changes in the tracks directory
		this.tracksWatcher = fs.watch(tracksPath, {
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

			const mission = missions.index[missionID]

			// Copy all mission files (except metadata file)
			for (const missionFile of mission.files) {

				const extension = path.extname(missionFile)

				if (extension === ("." + FileExtension.Meta)) {
					continue
				}

				fs.writeFileSync(
					path.join(trackDir, missionFile),
					fs.readFileSync(path.join(missions.path, missionFile))
				)
			}
		})
	}
}