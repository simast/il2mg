/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");

// Mission details pane component
class MissionDetails extends React.Component {

	componentWillReceiveProps() {

		// Scroll briefing text to the top
		if (this.briefingElement) {
			this.briefingElement.scrollTop = 0;
		}
	}

	// Render component
	render() {

		const mission = this.props.mission;

		const briefingProps = {
			dangerouslySetInnerHTML: {
				__html: mission.briefing
			},
			ref: (ref) => {
				this.briefingElement = ref;
			}
		};

		return (
			<section id="missionDetails">
				<h1>{mission.title}</h1>
				<div id="briefing" {...briefingProps}></div>
			</section>
		);
	}
}

MissionDetails.propTypes = {
	mission: React.PropTypes.object.isRequired
};

module.exports = MissionDetails;