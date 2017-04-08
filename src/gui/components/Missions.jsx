/** @copyright Simas Toleikis, 2016 */
"use strict";

const fs = global.require("fs");
const path = global.require("path");
const {spawn} = global.require("child_process");
const {remote} = global.require("electron");
const React = require("react");
const PropTypes = require("prop-types");
const Application = require("./Application");
const Screen = require("./Screen");
const MissionsList = require("./MissionsList");
const MissionDetails = require("./MissionDetails");

// Mission file extensions
const FILE_EXT_TEXT = "Mission";
const FILE_EXT_BINARY = "msnbin";
const FILE_EXT_META = "il2mg";

// Autoplay file name
const FILE_AUTOPLAY = "autoplay.cfg";

// Game file and directory paths (relative to base game directory)
const PATH_EXE = path.join("bin", "game", "Il-2.exe");
const PATH_DATA = "data";
const PATH_AUTOPLAY = path.join(PATH_DATA, FILE_AUTOPLAY);
const PATH_MISSIONS = path.join(PATH_DATA, "Missions");
const PATH_TRACKS = path.join(PATH_DATA, "Tracks");

// NOTE: This is a max time (in milliseconds) to wait before removing
// generated autoplay.cfg file after game executable is launched. This is
// required to make sure users are not left in a permanent "autoplay" state.
const MAX_AUTOPLAY_TIME = 10000; // 10 seconds

// Default difficulty mode
const DEFAULT_DIFFICULTY = 1;

// Difficulty settings/preset modes
const difficultyModes = new Map([
	[1, "Normal"],
	[2, "Expert"],
	[0, "Custom"]
]);

// Missions screen component
class Missions extends React.Component {

	constructor() {
		super(...arguments);

		const missions = this.loadMissions();
		const {config} = this.context;
		let difficulty = DEFAULT_DIFFICULTY;

		// Use difficulty from config
		if (difficultyModes.has(config.difficulty)) {
			difficulty = config.difficulty;
		}

		// Restore any existing autoplay.cfg file
		// NOTE: A workaround to fix leftover file in case of a program crash
		this.restoreAutoPlay();

		// Create context menu for launch button difficulty choice
		if (missions.list.length) {

			const {Menu, MenuItem} = remote;
			const launchMenu = this.launchMenu = new Menu();

			difficultyModes.forEach((difficultyLabel, difficultyID) => {

				launchMenu.append(new MenuItem({
					label: difficultyLabel,
					type: "radio",
					checked: (difficultyID === difficulty),
					click: () => {
						this.setDifficulty(difficultyID);
					}
				}));
			});
		}

		this.state = {missions, difficulty};
	}

	componentWillMount() {

		const {match, history} = this.props;

		// Handle index route request (when component has no active mission param)
		if (!match.params.mission) {

			const {missions} = this.state;

			// Show/select first mission
			if (missions.list.length) {
				history.replace("/missions/" + missions.list[0].id);
			}
			// Show create mission screen
			else {
				history.replace("/create?first=1");
			}
		}
	}

	componentDidMount() {

		this._onKeyDown = this.onKeyDown.bind(this);
		document.addEventListener("keydown", this._onKeyDown, true);
	}

	componentWillUnmount() {

		document.removeEventListener("keydown", this._onKeyDown, true);

		if (this.tracksWatcher) {
			this.tracksWatcher.close();
		}
	}

	// Render component
	render() {

		const {match} = this.props;
		const {missions, difficulty} = this.state;
		const missionID = match.params.mission;
		const actions = {
			left: new Map()
		};

		// Create a new mission
		actions.left.set("Create New", {
			to: "/create"
		});

		// Set active mission from query params
		let mission;

		if (missionID) {

			mission = missions.index[missionID];

			// Remove selected mission
			actions.left.set("Remove", {
				onClick: (event) => {
					this.removeMission(!event.ctrlKey);
				}
			});

			// Launch selected mission
			actions.right = new Map();
			actions.right.set("Launch", {
				className: "difficulty" + difficulty,
				onClick: (event) => {
					this.launchMission(event.ctrlKey);
				},
				onContextMenu: () => {
					this.launchMenu.popup(remote.getCurrentWindow());
				}
			});
		}

		const missionsListProps = {
			missions: missions.list,
			removeMission: this.removeMission.bind(this),
			saveMission: this.saveMission.bind(this)
		};

		return (
			<Screen id="missions" actions={actions}>
				<MissionsList {...missionsListProps}/>
				{mission ? <MissionDetails mission={mission} /> : ""}
			</Screen>
		);
	}

	// Handle local keyboard shortcuts
	onKeyDown(event) {

		if (event.code === "Delete") {
			this.removeMission(!event.ctrlKey);
		}
		else {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
	}

	// Load missions from missions directory
	loadMissions() {

		const {missionsPath} = this.context.config;
		const files = Object.create(null);
		const missions = {
			list: [], // Sorted list of mission objects
			index: Object.create(null) // Mission objects indexed by ID
		};

		// Scan each file in the target path/directory
		fs.readdirSync(missionsPath).forEach((fileName) => {

			const missionID = path.basename(fileName, path.extname(fileName));

			// Collect all files grouped by mission ID
			if (!files[missionID]) {
				files[missionID] = [];
			}

			files[missionID].push(fileName);

			// Process only mission metadata files
			if (path.extname(fileName) !== ("." + FILE_EXT_META)) {
				return;
			}

			let mission;

			try {

				// Read mission metadata file
				mission = JSON.parse(
					fs.readFileSync(missionsPath + path.sep + fileName, "utf-8")
				);
			}
			catch (e) {
				return;
			}

			mission.id = missionID;
			mission.files = files[missionID];

			missions.list.push(mission);
			missions.index[missionID] = mission;
		});

		// Sort missions list based on id (new missions first)
		missions.list.sort((a, b) => {
			return b.id.localeCompare(a.id);
		});

		return missions;
	}

	// Remove mission
	removeMission(confirm, missionID = this.props.match.params.mission) {

		if (!missionID) {
			return;
		}

		let result = 0;

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
			);
		}

		// Remove mission files
		if (result === 0) {

			const {match, history} = this.props;
			const {missionsPath} = this.context.config;
			let missions = this.state.missions;
			const mission = missions.index[missionID];
			const files = mission.files;

			for (const fileName of files) {
				fs.unlinkSync(path.join(missionsPath, fileName));
			}

			const removedIndex = missions.list.indexOf(mission);

			// Reload missions
			missions = this.loadMissions();

			// Show create mission screen
			if (!missions.list.length) {
				return history.replace("/create?first=1");
			}

			// Select next mission on the list when removing active mission
			if (missionID === match.params.mission) {

				let nextMission = missions.list[removedIndex];

				if (!nextMission) {
					nextMission = missions.list[missions.list.length - 1];
				}

				history.replace("/missions/" + nextMission.id);
			}

			this.setState({missions});
		}
	}

	// Save mission
	saveMission(missionID) {

		if (!missionID) {
			return;
		}

		const {gamePath, missionsPath} = this.context.config;
		const mission = this.state.missions.index[missionID];
		let savePath;

		// Use missions folder as default save path destination
		if (gamePath) {
			savePath = path.join(gamePath, PATH_MISSIONS);
		}
		// Use desktop as default save path destination
		else {
			savePath = remote.app.getPath("desktop");
		}

		// Suggest default mission file name
		savePath = path.join(savePath, missionID);

		// Find main mission file extension (either binary or text)
		let mainExtension = FILE_EXT_TEXT;

		for (const missionFile of mission.files) {

			if (path.extname(missionFile) === ("." + FILE_EXT_BINARY)) {

				mainExtension = FILE_EXT_BINARY;
				break;
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
		);

		// Save mission
		if (savePath) {

			const saveDir = path.dirname(savePath);
			const saveFile = path.basename(savePath, path.extname(savePath));

			// Save (copy) all mission files (except metadata file)
			for (const missionFile of mission.files) {

				const extension = path.extname(missionFile);

				if (extension === ("." + FILE_EXT_META)) {
					continue;
				}

				fs.writeFileSync(
					path.join(saveDir, saveFile + extension),
					fs.readFileSync(path.join(missionsPath, missionFile))
				);
			}
		}
	}

	// Launch mission
	launchMission(selectFolder) {

		const {config} = this.context;
		const missionID = this.props.match.params.mission;

		if (!missionID) {
			return;
		}

		// Force selecting game path on first run or when existing path is invalid
		if (!config.gamePath || !this.isValidGamePath(config.gamePath)) {
			selectFolder = true;
		}

		if (selectFolder) {

			// Show game path selection dialog
			let gamePath = remote.dialog.showOpenDialog(
				remote.getCurrentWindow(),
				{
					title: "Select IL-2 Sturmovik folder...",
					properties: ["openDirectory"],
					defaultPath: config.gamePath
				}
			);

			// Ignore on cancel button press
			if (!Array.isArray(gamePath)) {
				return;
			}

			let isValidPath = false;
			const folder = gamePath = gamePath[0];

			// Check for valid game path in the selected folder (and in any parents)
			while (gamePath) {

				isValidPath = this.isValidGamePath(gamePath);

				// Found valid path
				if (isValidPath) {
					break;
				}

				const parentPath = path.dirname(gamePath);

				// No more parent directories to traverse
				if (parentPath === gamePath) {
					break;
				}

				gamePath = parentPath;
			}

			if (isValidPath) {
				config.gamePath = gamePath;
			}
			// Show error message and abort if game path is invalid
			else {

				Application.showErrorMessage(
					"Selected folder is not a valid IL-2 Sturmovik directory:\n\n" + folder
				);

				return;
			}
		}

		const gameExePath = path.join(config.gamePath, PATH_EXE);
		let maxAutoplayTime = MAX_AUTOPLAY_TIME;

		try {

			this.createAutoPlay(missionID);

			// Run game executable
			const gameProcess = spawn(gameExePath, {
				cwd: path.dirname(gameExePath),
				stdio: "ignore",
				detached: true
			});

			// Don't wait for the spawned game process to exit
			gameProcess.unref();

			// Minimize the window
			remote.getCurrentWindow().minimize();

			// Activate the fix for flight recording
			this.fixFlightRecords(missionID);
		}
		catch (e) {

			maxAutoplayTime = 0;

			// Show an error suggesting to use elevated il2mg executable permissions
			Application.showErrorMessage(
				"Could not launch IL-2 Sturmovik!\n\n" +
				"Please close this application and then run il2mg.exe again by right " +
				'clicking and using the "Run as administrator" menu option.'
			);
		}
		finally {

			const onWindowUnload = () => {
				this.restoreAutoPlay();
			};

			// Register window unload event (as a backup for restoring autoplay.cfg
			// file on application quit before delayed timeout event is executed).
			window.addEventListener("unload", onWindowUnload);

			// Setup delayed autoplay.cfg file restore event - making sure game
			// executable has enough time to actually read the generated file.
			// TODO: Use fs.watchFile?
			this.autoplayRemoveTS = setTimeout(() => {

				this.restoreAutoPlay();
				window.removeEventListener("unload", onWindowUnload);

			}, maxAutoplayTime);
		}
	}

	// Set launch difficulty mode
	setDifficulty(difficulty) {

		const {config} = this.context;

		config.difficulty = difficulty;
		this.setState({difficulty});
	}

	// Create autoplay.cfg file
	createAutoPlay(missionID) {

		if (this.autoplayRestoreTS) {

			clearTimeout(this.autoplayRestoreTS);
			delete this.autoplayRestoreTS;
		}

		const {userDataPath, config} = this.context;
		const {gamePath, missionsPath} = config;

		if (!gamePath || !missionID) {
			return;
		}

		const autoplayPath = path.join(gamePath, PATH_AUTOPLAY);

		// Make a backup copy of the original autoplay.cfg file
		if (fs.existsSync(autoplayPath)) {
			Application.moveFileSync(autoplayPath, path.join(userDataPath, FILE_AUTOPLAY));
		}

		// Make autoplay.cfg
		fs.writeFileSync(
			autoplayPath,
			[
				"&il2mg=1", // Flag used to identify generated autoplay file
				"&enabled=1",
				"&missionSettingsPreset=" + this.state.difficulty,
				'&missionPath="' + path.join(missionsPath, missionID) + '"'
			].join("\r\n")
		);
	}

	// Restore autoplay.cfg file
	restoreAutoPlay() {

		if (this.autoplayRestoreTS) {

			clearTimeout(this.autoplayRestoreTS);
			delete this.autoplayRestoreTS;
		}

		const {userDataPath, config} = this.context;
		const {gamePath} = config;

		if (!gamePath) {
			return;
		}

		const autoplayPath = path.join(gamePath, PATH_AUTOPLAY);
		const backupAutoplayPath = path.join(userDataPath, FILE_AUTOPLAY);

		try {

			// Restore backup copy of the original autoplay.cfg file
			if (fs.existsSync(backupAutoplayPath)) {
				Application.moveFileSync(backupAutoplayPath, autoplayPath);
			}
			// Remove existing autoplay.cfg file
			else if (fs.existsSync(autoplayPath)) {

				const autoplayContent = fs.readFileSync(autoplayPath, "utf-8");

				// Remove only known/generated autoplay file
				if (autoplayContent.indexOf("&il2mg=1") >= 0) {
					fs.unlinkSync(autoplayPath);
				}
			}
		}
		catch (e) {}
	}

	// Check if specified game path is valid
	isValidGamePath(gamePath) {

		if (!gamePath) {
			return false;
		}

		// Check for "data" directory
		try {

			const dataPath = path.join(gamePath, PATH_DATA);
			const hasDataDirectory = fs.statSync(dataPath).isDirectory();

			if (!hasDataDirectory) {
				return false;
			}
		}
		catch (e) {
			return false;
		}

		// Check for game executable
		return fs.existsSync(path.join(gamePath, PATH_EXE));
	}

	// HACK: There is a bug in IL-2 Sturmovik where flight records for a mission
	// launched with autoplay.cfg are activated, but the mission file is not
	// copied together with the track recording files. This seems to be a problem
	// related to the fact our mission files are external and are not part of the
	// "data/Missions" directory. As a workaround - watch the track recordings
	// directory for changes and copy the mission files.
	fixFlightRecords(missionID) {

		const {gamePath, missionsPath} = this.context.config;
		const {missions} = this.state;
		const tracksPath = path.join(gamePath, PATH_TRACKS);

		// Re-initialize directory watcher
		if (this.tracksWatcher) {
			this.tracksWatcher.close();
		}

		// Watch for changes in the tracks directory
		this.tracksWatcher = fs.watch(tracksPath, {
			persistent: false,
			recursive: false
		}, (eventType, fileName) => {

			if (!fileName || eventType !== "rename") {
				return;
			}

			const trackDir = path.join(tracksPath, fileName);

			// Track records will have a separate directory for mission files
			if (!fs.statSync(trackDir).isDirectory()) {
				return;
			}

			const trackMissionID = path.basename(trackDir, path.extname(trackDir));

			// Apply fix only for our mission launched via autoplay.cfg
			if (trackMissionID !== missionID) {
				return;
			}

			const mission = missions.index[missionID];

			// Copy all mission files (except metadata file)
			for (const missionFile of mission.files) {

				const extension = path.extname(missionFile);

				if (extension === ("." + FILE_EXT_META)) {
					continue;
				}

				fs.writeFileSync(
					path.join(trackDir, missionFile),
					fs.readFileSync(path.join(missionsPath, missionFile))
				);
			}
		});
	}
}

Missions.contextTypes = {
	config: PropTypes.object.isRequired,
	userDataPath: PropTypes.string.isRequired
};

module.exports = Missions;