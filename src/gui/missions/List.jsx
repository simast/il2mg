/** @copyright Simas Toleikis, 2016 */
"use strict"

const {remote} = global.require("electron")
const React = require("react")
const MissionsListItem = require("./ListItem")

// Missions list component
class MissionsList extends React.Component {

	constructor({missions, removeMission, saveMission}) {
		super(...arguments)

		// Create context menu
		if (missions.length) {

			const {Menu, MenuItem} = remote
			const menu = this.menu = new Menu()

			// Remove menu
			menu.append(new MenuItem({
				label: "Remove",
				click: () => {
					removeMission(true, this.contextMission.id)
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
				{this.props.missions.map(mission => {

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

module.exports = MissionsList