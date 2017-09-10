/** @copyright Simas Toleikis, 2016 */

import React from "react"

// Mission details pane component
export default class MissionDetails extends React.PureComponent {

	componentWillReceiveProps(nextProps) {

		const {mission} = this.props

		// Scroll briefing text to the top
		if (this.briefingElement && nextProps.mission !== mission) {
			this.briefingElement.scrollTop = 0
		}
	}

	// Render component
	render() {

		const {mission} = this.props

		const briefingProps = {
			dangerouslySetInnerHTML: {
				__html: mission.briefing
			},
			ref: ref => {
				this.briefingElement = ref
			}
		}

		return (
			<section id="missionDetails">
				<h1>{mission.title}</h1>
				<div id="briefing" {...briefingProps}></div>
			</section>
		)
	}
}