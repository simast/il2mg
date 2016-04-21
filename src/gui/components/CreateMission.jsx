/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const Screen = require("./Screen");

// Create mission screen component
class CreateMission extends React.Component {
	
	// Handle create mission button click
	onCreateClick() {
		
		// TODO: Create mission
		this.context.router.replace("/missions");
	}
	
	// Render component
	render() {
		
		const context = this.context;
		const actions = {
			right: new Map()
		};
		
		// Create mission
		actions.right.set("Create", {
			onClick: this.onCreateClick.bind(this)
		});
		
		// Cancel create mission
		if (context.missions.list.length) {
			
			actions.right.set("Cancel", {
				onClick() {
					context.router.goBack();
				}
			});
		}
		
		return (
			<Screen id="create" actions={actions}></Screen>
		);
	}
}

CreateMission.contextTypes = {
	router: React.PropTypes.object.isRequired,
	missions: React.PropTypes.object.isRequired
};

module.exports = CreateMission;