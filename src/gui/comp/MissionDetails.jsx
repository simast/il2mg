/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");

// Mission details pane component
class MissionDetails extends React.Component {
	
	// Render component
	render() {
		
		const mission = this.props.mission;
		
		return (
			<section id="missionDetails">
				<h1>{mission.title}</h1>
				<div id="briefing" dangerouslySetInnerHTML={{__html: mission.briefing}}></div>
			</section>
		);
	}
}

MissionDetails.propTypes = {
	mission: React.PropTypes.object.isRequired
};

module.exports = MissionDetails;