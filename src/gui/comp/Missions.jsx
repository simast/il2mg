/** @copyright Simas Toleikis, 2016 */
"use strict";

const fs = require("fs");
const path = require("path");
const React = require("react");
const Screen = require("./Screen");
const MissionsList = require("./MissionsList");
const MissionDetails = require("./MissionDetails");

// Mission metadata file extension
const FILE_EXT_META = ".il2mg";

// Missions screen component
class Missions extends React.Component {
	
	constructor(props, context) {
		super(...arguments);
		
		this.router = context.router;
		this.config = context.config;
		this.state = {
			missions: this.loadMissions()
		};
	}
	
	componentWillMount() {
		
		const missions = this.state.missions;
		
		// Show create mission screen when mission list is empty
		if (!missions.list.length) {
			this.router.replace("/create");
		}
	}
	
	// Load a list of missions (from config.missionsPath)
	loadMissions() {
		
		const {missionsPath} = this.config;
		const missions = {
			list: [],
			index: Object.create(null)
		};
		
		// Load a list of missions (from config.missionsPath)
		fs.readdirSync(missionsPath).forEach((fileName) => {
			
			// Filter out invalid files
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
			
			const id = mission.id = path.basename(fileName, FILE_EXT_META);
			
			missions.list.push(mission);
			missions.index[id] = mission;
		});
		
		// Sort missions list based on id (new missions first)
		missions.list.sort((a, b) => {
			return b.id.localeCompare(a.id);
		});
		
		return missions;
	}
	
	componentDidMount() {
		
		const {missionsPath} = this.config;
		
		// Watch missions directory for any changes
		this.watcher = fs.watch(missionsPath, {persistent: false}, () => {
			
			this.setState({
				missions: this.loadMissions()
			});
		});
	}
	
	componentWillUnmount() {
		this.watcher.close();
	}
	
	// Render component
	render() {
		
		const missions = this.state.missions;
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
			actions.left.set("Remove", {});
			
			// Launch selected mission
			actions.right = new Map();
			actions.right.set("Launch", {});
		}
		
		return (
			<Screen id="missions" actions={actions}>
				<MissionsList missions={missions.list} />
				{mission ? <MissionDetails mission={mission} /> : ""}
			</Screen>
		);
	}
};

Missions.contextTypes = {
	router: React.PropTypes.object.isRequired,
	config: React.PropTypes.object.isRequired
};

module.exports = Missions;