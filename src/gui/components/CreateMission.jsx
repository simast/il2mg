/** @copyright Simas Toleikis, 2016 */
"use strict";

const execSync = require("child_process").execSync;
const React = require("react");
const Screen = require("./Screen");

// Create mission screen component
class CreateMission extends React.Component {
	
	// Render component
	render() {
		
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
			<Screen id="create" actions={actions}></Screen>
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

module.exports = CreateMission;