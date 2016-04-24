/** @copyright Simas Toleikis, 2016 */
"use strict";

const fs = require("fs");
const path = require("path");
const execFile = require("child_process").execFile;
const remote = require("electron").remote;
const React = require("react");
const Screen = require("./Screen");
const MissionsList = require("./MissionsList");
const MissionDetails = require("./MissionDetails");

// Mission metadata file extension
const FILE_EXT_META = ".il2mg";

// Game executable and autoplay.cfg paths (relative to base directory)
const PATH_EXE = "bin\\game\\Il-2.exe";
const PATH_AUTOPLAY = "data\\autoplay.cfg";

// Default difficulty mode
const DEFAULT_DIFFICULTY = 1;

// Difficulty settings modes
const difficultyMode = {
	0: "Custom",
	1: "Normal",
	2: "Expert"
};

// Missions screen component
class Missions extends React.Component {
	
	constructor() {
		super(...arguments);
		
		const missions = this.loadMissions();
		const {config} = this.context;
		let difficulty = DEFAULT_DIFFICULTY;
		
		// Use difficulty from config
		if (config.difficulty !== undefined && difficultyMode[config.difficulty]) {
			difficulty = config.difficulty;
		}
		
		// Create context menu for launch button difficulty choice
		if (missions.list.length) {
			
			const {Menu, MenuItem} = remote;
			const launchMenu = this.launchMenu = new Menu();
			
			for (let mode in difficultyMode) {
				
				mode = +mode;
				
				launchMenu.append(new MenuItem({
					label: difficultyMode[mode],
					type: "radio",
					checked: (mode === difficulty),
					click: () => {
						this.setDifficulty(mode);
					}
				}));
			}
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
		this.startWatching();
	}
	
	componentWillUnmount() {
		
		document.removeEventListener("keydown", this._onKeyDown, true);
		this.stopWatching();
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
	
	// Start watching missions directory for file changes
	startWatching() {
		
		if (this.watcher) {
			return;
		}

		const {missionsPath} = this.context.config;
		
		// Watch and reload missions directory on any changes
		this.watcher = fs.watch(missionsPath, {persistent: false}, () => {
			this.setState({missions: this.loadMissions()});
		});
	}
	
	// Stop watching missions directory for file changes
	stopWatching() {
		
		if (this.watcher) {
			
			this.watcher.close();
			this.watcher = null;
		}
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
			
			this.stopWatching();
			
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
			this.startWatching();
		}
	}
	
	// Launch mission
	launchMission(selectFolder) {
		
		const {config} = this.context;
		
		// Force selecting game path on first run or when existing path is invalid
		if (!config.gamePath || !Missions.isValidGamePath(config.gamePath)) {
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
				
				isValidPath = Missions.isValidGamePath(gamePath);
				
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

				remote.dialog.showMessageBox(
					remote.getCurrentWindow(),
					{
						type: "error",
						title: "Error!",
						message: "Selected folder is not a valid IL-2 Sturmovik directory:\n\n" + folder,
						buttons: ["OK"],
						defaultId: 0,
						noLink: true
					}
				);
				
				return;
			}
		}
		
		const gameExePath = path.join(config.gamePath, PATH_EXE);
		
		this.createAutoPlay();
		
		// Run game executable
		execFile(gameExePath, {cwd: path.dirname(gameExePath)});
		
		// Minimize window
		remote.getCurrentWindow().minimize();
	}
	
	// Set launch difficulty mode
	setDifficulty(difficulty) {
		
		const {config} = this.context;
		
		config.difficulty = difficulty;
		this.setState({difficulty});
	}
	
	// Create autoplay.cfg file
	createAutoPlay() {
		
		const {gamePath, missionsPath} = this.context.config;
		const missionID = this.props.params.mission;
		
		if (!gamePath || !missionID) {
			return;
		}
		
		fs.writeFileSync(
			path.join(gamePath, PATH_AUTOPLAY),
			[
				"&enabled=1",
				"&missionSettingsPreset=" + this.state.difficulty,
				'&missionPath="' + path.join(missionsPath, missionID) + '"'
			].join("\r\n")
		);
	}
	
	// TODO: Remove autoplay.cfg file
	removeAutoPlay() {
		
	}
	
	// Check if specified game path is valid
	static isValidGamePath(gamePath) {
		
		if (!gamePath) {
			return false;
		}
		
		return fs.existsSync(path.join(gamePath, PATH_EXE));
	}
}

Missions.contextTypes = {
	router: React.PropTypes.object.isRequired,
	config: React.PropTypes.object.isRequired
};

module.exports = Missions;