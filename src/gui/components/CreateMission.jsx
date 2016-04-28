/** @copyright Simas Toleikis, 2016 */
"use strict";

const fs = global.require("fs");
const execSync = global.require("child_process").execSync;
const React = require("react");
const Screen = require("./Screen");

// Path to battle data directory
const PATH_BATTLES = "data/battles";

// Create mission screen component
class CreateMission extends React.Component {
	
	constructor() {
		super(...arguments);
		
		const data = this.data = Object.create(null);
		let battle;
		
		// Load data index for each battle
		fs.readdirSync(PATH_BATTLES).forEach((battleID) => {
			
			const filePath = PATH_BATTLES + "/" + battleID;
			
			// Read battle data index JSON file
			if (fs.statSync(filePath).isDirectory()) {
				
				data[battleID] = global.require("../../" + filePath);
				
				// Set first battle to be active (selected by default)
				if (!battle) {
					battle = battleID;
				}
			}
		});
		
		// Initial state
		this.state = {battle};
	}
	
	// Render component
	render() {
		
		const {battle} = this.state;
		const {router} = this.context;
		const actions = {
			right: new Map()
		};
		
		// Create mission
		actions.right.set("Create", {
			onClick: this.onCreateClick.bind(this)
		});
		
		// Cancel create mission
		if (!this.props.location.query.first) {
			
			actions.right.set("Cancel", {
				onClick() {
					router.goBack();
				}
			});
		}
		
		return (
			<Screen id="create" actions={actions}>
				<CreateMission.Battle battle={battle} data={this.data} />
				<CreateMission.Choice title="Units" />
				<CreateMission.Choice title="Aircraft" />
				<CreateMission.Choice title="Tasks" />
				<CreateMission.Choice title="Airfields" />
			</Screen>
		);
	}
	
	// Handle create mission button click
	onCreateClick() {
		
		const {config, router} = this.context;
		
		// TODO:
		execSync(`node . -M "${config.missionsPath}"`);
		
		router.replace("/missions");
	}
}

CreateMission.contextTypes = {
	router: React.PropTypes.object.isRequired,
	config: React.PropTypes.object.isRequired
};

// Mission battle selection component
CreateMission.Battle = ({battle, data}) => {
	
	// TODO: Allow selecting other battles
	return <h1>{data[battle].name}</h1>;
};

// Mission data choice component
CreateMission.Choice = ({title}) => {
	
	// TODO:
	return <h2>{title}</h2>;
};

module.exports = CreateMission;