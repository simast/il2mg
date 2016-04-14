/** @copyright Simas Toleikis, 2016 */
"use strict";

const fs = require("fs");
const path = require("path");
const React = require("react");
const {Link} = require("react-router");
const MissionsList = require("./MissionsList");
const MissionDetails = require("./MissionDetails");
const config = require("electron").remote.getGlobal("config");

// Mission metadata file extension
const FILE_EXT_META = ".il2mg";

// Missions screen component
module.exports = class Missions extends React.Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			missions: this.loadMissions()
		};
	}
	
	// Load a list of missions (from config.missionsPath)
	loadMissions() {
		
		const {missionsPath} = config;
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
		
		const {missionsPath} = config;
		
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
		
		// Set active mission from query params
		let mission;
		
		if (missionID) {
			mission = missions.index[missionID];
		}
		
		return (
			<div>
				<MissionsList missions={missions.list} />
				{mission ? <MissionDetails mission={mission} /> : ""}
				<Link to="/create">Create</Link>
			</div>
		);
	}
};