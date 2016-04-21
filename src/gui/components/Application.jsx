/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const {remote} = require("electron");
const Missions = require("./Missions");

// Application component
class Application extends React.Component {
	
	constructor() {
		super(...arguments);
		
		// Handle drag and drop events on application window
		document.addEventListener("dragover", Application.onDragAndDrop, true);
		document.addEventListener("drop", Application.onDragAndDrop, true);
		
		this.config = remote.getGlobal("config");
		this.missions = Missions.loadMissions(this.config.missionsPath);
	}
	
	getChildContext() {
		
		return {
			config: this.config,
			missions: this.missions
		};
	}
	
	static onDragAndDrop(event) {
		
		// Disable file drag and drop for application window
		event.preventDefault();
		event.stopPropagation();
	}
	
	componentWillMount() {

		// Show create mission screen when missions list is empty
		if (!this.missions.list.length) {
			this.context.router.replace("/create");
		}
	}
	
	// Render component
	render() {
		
		// NOTE: Router will provide child components
		return (
			<div id="application">
				{this.props.children}
			</div>
		);
	}
}

Application.childContextTypes = {
	config: React.PropTypes.object,
	missions: React.PropTypes.object
};

Application.contextTypes = {
	router: React.PropTypes.object.isRequired
};

module.exports = Application;