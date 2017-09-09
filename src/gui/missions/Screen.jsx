/** @copyright Simas Toleikis, 2016 */

import fs from "fs"
import path from "path"
import {remote} from "electron"
import React from "react"
import {observer} from "mobx-react"
import {Difficulty} from "../launch"
import launchStore from "../launch/store"
import LaunchDialog from "../launch/Dialog"
import missionsStore from "./store"
import {loadMissions} from "./actions"
import Screen from "../app/Screen"
import MissionsList from "./List"
import MissionDetails from "./Details"

// Difficulty settings/preset modes
const difficultyModes = new Map([
	[Difficulty.Normal, "Normal"],
	[Difficulty.Expert, "Expert"],
	[Difficulty.Custom, "Custom"]
])

// Missions screen component
@observer export default class MissionsScreen extends React.Component {

	constructor() {
		super(...arguments)

		// Load missions from missions directory
		loadMissions()

		// Create context menu for launch button difficulty choice
		if (missionsStore.list.length) {

			const {Menu, MenuItem} = remote
			const launchMenu = this.launchMenu = new Menu()

			difficultyModes.forEach((difficultyLabel, difficultyID) => {

				launchMenu.append(new MenuItem({
					label: difficultyLabel,
					type: "radio",
					checked: (difficultyID === launchStore.difficulty),
					click: () => {
						launchStore.setDifficulty(difficultyID)
					}
				}))
			})
		}
	}

	componentWillMount() {

		const {match, history} = this.props

		// Handle index route request (when component has no active mission param)
		if (!match.params.mission) {

			// Show/select first mission
			if (missionsStore.list.length) {
				history.replace("/missions/" + missionsStore.list[0].id)
			}
			// Show create mission screen
			else {
				history.replace("/create?first=1")
			}
		}
	}

	// Render component
	render() {

		const {match} = this.props
		const missionID = match.params.mission
		const actions = {
			left: new Map()
		}

		// Create a new mission
		actions.left.set("Create New", {
			to: "/create"
		})

		// Set active mission from query params
		let mission

		if (missionID) {

			mission = missionsStore.index[missionID]

			// Remove selected mission
			actions.left.set("Remove", {
				onClick: event => {
					this.removeMission(missionID, !event.ctrlKey)
				}
			})

			// Launch selected mission
			actions.right = new Map()
			actions.right.set("Launch", {
				className: "difficulty" + launchStore.difficulty,
				onClick: () => {
					this.toggleLaunchDialog()
				},
				onContextMenu: () => {
					this.launchMenu.popup(remote.getCurrentWindow())
				}
			})
		}

		const missionsListProps = {
			removeMission: this.removeMission.bind(this)
		}

		const launchDialogProps = {
			mission,
			opened: match.params.action === "launch",
			onClose: this.toggleLaunchDialog.bind(this)
		}

		return (
			<div>
				<Screen id="missions" actions={actions}>
					<MissionsList {...missionsListProps} />
					{mission && <MissionDetails mission={mission} />}
				</Screen>
				{mission && <LaunchDialog {...launchDialogProps} />}
			</div>
		)
	}

	// Show/hide launch mission dialog
	toggleLaunchDialog() {

		const {match, history} = this.props
		const {mission, action} = match.params

		let path = "/missions/" + mission

		if (action !== "launch") {
			path += "/launch"
		}

		history.replace(path)
	}

	// Remove mission
	removeMission(missionID, confirm = false) {

		if (!missionID) {
			return
		}

		let result = 0

		if (confirm) {

			// Confirm mission remove action
			result = remote.dialog.showMessageBox(
				remote.getCurrentWindow(),
				{
					type: "warning",
					title: "Remove Mission",
					message: "Are you sure you want to remove this mission?",
					buttons: ["Remove", "Cancel"],
					defaultId: 0,
					noLink: true
				}
			)
		}

		// Remove mission files
		if (result === 0) {

			const {match, history} = this.props
			const mission = missionsStore.index[missionID]
			const {files} = mission
			const removedIndex = missionsStore.list.indexOf(mission)

			for (const fileName of files) {
				fs.unlinkSync(path.join(missionsStore.path, fileName))
			}

			// Reload missions
			loadMissions()

			// Show create mission screen
			if (!missionsStore.list.length) {
				return history.replace("/create?first=1")
			}

			// Select next mission on the list when removing active mission
			if (missionID === match.params.mission) {

				let nextMission

				if (removedIndex < missionsStore.list.length) {
					nextMission = missionsStore.list[removedIndex]
				}
				else {
					nextMission = missionsStore.list[missionsStore.list.length - 1]
				}

				history.replace("/missions/" + nextMission.id)
			}
		}
	}
}