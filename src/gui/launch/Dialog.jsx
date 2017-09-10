/** @copyright Simas Toleikis, 2017 */

import React from "react"
import classNames from "classnames"
import Dialog from "../app/Dialog"
import SelectGamePath from "./SelectGamePath"

// Launch mission dialog component
export default class LaunchDialog extends React.PureComponent {

	// Render component
	render() {

		const {mission} = this.props
		const planeClassName = classNames("plane",  "country", "c" + mission.country)

		return (
			<Dialog id="launchDialog" {...this.props}>
				<div className="title">{mission.title}</div>
				<div className={planeClassName}>{mission.plane}</div>
				<SelectGamePath />
			</Dialog>
		)
	}
}