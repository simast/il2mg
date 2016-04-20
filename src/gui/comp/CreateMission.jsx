/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const Screen = require("./Screen");

// Create mission screen component
class CreateMission extends React.Component {
	
	constructor(props, context) {
		super(...arguments);
		
		this.router = context.router;
	}
	
	// Render component
	render() {
		
		const router = this.router;
		const params = this.props.params;
		const actions = {
			right: new Map()
		};
		
		// Create mission
		actions.right.set("Create", {});
		
		// Cancel create mission
		if (!params.type) {
			
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
};

CreateMission.contextTypes = {
	router: React.PropTypes.object.isRequired
};

module.exports = CreateMission;