/** @copyright Simas Toleikis, 2016 */

import {remote} from "electron"
import React from "react"
import {observer} from "mobx-react"
import MissionsListItem from "./ListItem"
import {saveMission} from  "./actions"
import missionsStore from "./store"

// Missions list component
@observer export default class MissionsList extends React.Component {

	constructor({removeMission}) {
		super(...arguments)

		// Create context menu
		const {Menu, MenuItem} = remote
		const menu = this.menu = new Menu()

		// Remove menu
		menu.append(new MenuItem({
			label: "Remove",
			click: () => {
				removeMission(this.contextMission.id, true)
			}
		}))

		// Save menu
		menu.append(new MenuItem({
			label: "Save As...",
			click: () => {
				saveMission(this.contextMission.id)
			}
		}))
	}

	componentDidMount() {

		// Scroll active/selected mission item into view (if needed)
		if (this.listElement) {

			const activeElement = this.listElement.querySelector(".selected")

			if (activeElement) {
				activeElement.scrollIntoViewIfNeeded()
			}
		}
	}

	// Render component
	render() {

		return (
			<ul id="missionsList" ref={ref => {this.listElement = ref}}>
				{missionsStore.list.map(mission => {

					const props = {
						mission,
						onContextMenu: this.onContextMenu.bind(this)
					}

					return <MissionsListItem key={mission.id} {...props} />
				})}
			</ul>
		)
	}

	// Handle mission list context/popup menu
	onContextMenu(mission) {

		this.contextMission = mission
		this.menu.popup(remote.getCurrentWindow())
	}
}