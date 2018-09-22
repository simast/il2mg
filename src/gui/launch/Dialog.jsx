import React from "react"
import {observer} from "mobx-react"
import classNames from "classnames"
import launchStore from "./store"
import {launchMission} from "./actions"
import Dialog from "../app/Dialog"
import SelectGamePath from "./SelectGamePath"
import SelectRealism from "./SelectRealism"

// Launch mission dialog component
@observer export default class LaunchDialog extends React.Component {

	// Render component
	render() {

		const {mission, onClose} = this.props
		const planeClassName = classNames("plane", "country", "c" + mission.country)
		const actions = {
			center: new Map()
		}

		actions.center.set("Accept", {
			onClick: event => {

				if (launchMission(mission.id, event.ctrlKey)) {
					onClose()
				}
			},
			disabled: !launchStore.gamePath,
			primary: true
		})

		actions.center.set("Cancel", {
			onClick: () => onClose()
		})

		return (
			<Dialog id="launchDialog" actions={actions} {...this.props}>
				<div className="title">{mission.title}</div>
				<div className={planeClassName}>{mission.plane}</div>
				<SelectGamePath />
				<SelectRealism />
			</Dialog>
		)
	}
}
