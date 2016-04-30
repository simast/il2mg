/** @copyright Simas Toleikis, 2016 */
"use strict";

const fs = global.require("fs");
const path = global.require("path");
const spawn = global.require("child_process").spawn;
const remote = require("electron").remote;
const React = require("react");
const Application = require("./Application");
const Screen = require("./Screen");
const MissionsList = require("./MissionsList");
const MissionDetails = require("./MissionDetails");

// Mission metadata file extension
const FILE_EXT_META = ".il2mg";

// Game file and directory paths (relative to base game directory)
const PATH_EXE = "bin\\game\\Il-2.exe";
const PATH_DATA = "data";
const PATH_AUTOPLAY = PATH_DATA + "\\autoplay.cfg";
const PATH_TRACKS = PATH_DATA + "\\Tracks";

// NOTE: This is a max time (in milliseconds) to wait before removing
// generated autoplay.cfg file after game executable is launched. This is
// required to make sure users are not left in a permanent "autoplay" state.
const MAX_AUTOPLAY_TIME = 6000; // 6 seconds

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
		
		// Remove any existing autoplay.cfg file
		// NOTE: A workaround to fix leftover file in case of a program crash
		this.removeAutoPlay();
		
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
		
		// Handle index route request (when component has no active mission param)
		if (!this.props.params.mission) {
			
			const {router} = this.context;
			const {missions} = this.state;
			
			// Show/select first mission
			if (missions.list.length) {
				router.replace("/missions/" + missions.list[0].id);
			}
			// Show create mission screen
			else {
				router.replace("/create?first=1");
			}
		}
	}
	
	componentDidMount() {
		
		this._onKeyDown = this.onKeyDown.bind(this);
		document.addEventListener("keydown", this._onKeyDown, true);
	}
	
	componentWillUnmount() {
		
		document.removeEventListener("keydown", this._onKeyDown, true);
	}
	
	// Render component
	render() {
		
		const state = this.state;
		const missions = state.missions;
		const missionID = this.props.params.mission;
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
				className: "difficulty" + state.difficulty,
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
			removeMission: this.removeMission.bind(this)
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
			if (path.extname(fileName) !== FILE_EXT_META) {
				return;
			}
			
			let mission;
			
			try {
				
				// Read mission metadata file
				mission = JSON.parse(
					fs.readFileSync(missionsPath + path.sep + fileName, "utf8")
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
	removeMission(confirm, missionID = this.props.params.mission) {
		
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
			
			const {router} = this.context;
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
				return router.replace("/create?first=1");
			}
			
			// Select next mission on the list when removing active mission
			if (missionID === this.props.params.mission) {
				
				let nextMission = missions.list[removedIndex];
				
				if (!nextMission) {
					nextMission = missions.list[missions.list.length - 1];
				}
				
				router.replace("/missions/" + nextMission.id);
			}
			
			this.setState({missions});
		}
	}
	
	// Launch mission
	launchMission(selectFolder) {
		
		const {config} = this.context;
		
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
		
		try {
			
			this.createAutoPlay();
			
			// Run game executable
			const gameProcess = spawn(gameExePath, {
				cwd: path.dirname(gameExePath),
				stdio: "ignore",
				detached: true
			});
			
			// Don't wait for the spawned game process to exit
			gameProcess.unref();
			
			// Minimize window
			remote.getCurrentWindow().minimize();
		}
		finally {
			
			const onWindowUnload = () => {
				this.removeAutoPlay();
			};
			
			// Register window unload event (as a backup for removing autoplay.cfg
			// file on application quit before delayed timeout event is executed).
			window.addEventListener("unload", onWindowUnload);
			
			// Setup delayed autoplay.cfg file removal event - making sure game
			// executable has enough time to actually read the generated file.
			// TODO: Use fs.watchFile?
			this.autoplayRemoveTS = setTimeout(() => {
				
				this.removeAutoPlay();
				window.removeEventListener("unload", onWindowUnload);
				
			}, MAX_AUTOPLAY_TIME);
		}
	}
	
	// Set launch difficulty mode
	setDifficulty(difficulty) {
		
		const {config} = this.context;
		
		config.difficulty = difficulty;
		this.setState({difficulty});
	}
	
	// Create autoplay.cfg file
	createAutoPlay() {
		
		if (this.autoplayRemoveTS) {
			
			clearTimeout(this.autoplayRemoveTS);
			delete this.autoplayRemoveTS;
		}
		
		const {gamePath, missionsPath} = this.context.config;
		const missionID = this.props.params.mission;
		
		if (!gamePath || !missionID) {
			return;
		}
		
		// Make autoplay.cfg
		fs.writeFileSync(
			path.join(gamePath, PATH_AUTOPLAY),
			[
				"&enabled=1",
				"&missionSettingsPreset=" + this.state.difficulty,
				'&missionPath="' + path.join(missionsPath, missionID) + '"',
				// FIXME: Flight track records do not work with autoplay.cfg!
				'&trackPath="' + path.join(gamePath, PATH_TRACKS) + '"'
			].join("\r\n")
		);
	}
	
	// Remove autoplay.cfg file
	removeAutoPlay() {
		
		if (this.autoplayRemoveTS) {
			
			clearTimeout(this.autoplayRemoveTS);
			delete this.autoplayRemoveTS;
		}
		
		const {gamePath} = this.context.config;
		
		if (!gamePath) {
			return;
		}
		
		const autoplayPath = path.join(gamePath, PATH_AUTOPLAY);
		
		try {
			
			if (fs.existsSync(autoplayPath)) {
				fs.unlinkSync(autoplayPath);
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
}

Missions.contextTypes = {
	router: React.PropTypes.object.isRequired,
	config: React.PropTypes.object.isRequired
};

module.exports = Missions;