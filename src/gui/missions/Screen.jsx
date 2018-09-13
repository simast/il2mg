import React from "react"
import {observer} from "mobx-react"
import LaunchDialog from "../launch/Dialog"
import missionsStore from "./store"
import {loadMissions, removeMission} from "./actions"
import Screen from "../app/Screen"
import MissionsList from "./List"
import MissionDetails from "./Details"

// Missions screen component
@observer export default class MissionsScreen extends React.Component {

	constructor() {
		super(...arguments)

		// Load missions from missions directory
		loadMissions()

		// Bind event handler contexts
		this.onRemoveMission = this.onRemoveMission.bind(this)
		this.onOpenLaunchDialog = this.onOpenLaunchDialog.bind(this)
		this.onCloseLaunchDialog = this.onCloseLaunchDialog.bind(this)
	}

	UNSAFE_componentWillMount() {

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

		const {match, location} = this.props
		const missionID = match.params.mission
		const actions = {
			left: new Map()
		}

		// Create a new mission
		actions.left.set("Create New", {
			to: "/create"
		})

		let mission
		let launchDialog

		// Set active mission from query params
		if (missionID) {

			mission = missionsStore.index[missionID]

			// Remove selected mission
			actions.left.set("Remove", {
				onClick: event => this.onRemoveMission(missionID, !event.ctrlKey)
			})

			// Launch selected mission
			actions.right = new Map()
			actions.right.set("Launch", {
				onClick: () => this.onOpenLaunchDialog(),
				primary: true
			})

			launchDialog = (
				<LaunchDialog
					mission={mission}
					opened={match.params.action === "launch"}
					onClose={this.onCloseLaunchDialog}
				/>
			)
		}

		const missionListProps = {
			onRemoveMission: this.onRemoveMission,
			// NOTE: MobX observer() implements shouldComponentUpdate() with shallow property
			// comparison and is preventing React Router <NavLink> updates. As a workaround
			// we pass location object to re-render <MissionsList> child components during
			// actual location changes.
			location
		}

		return (
			<div>
				<Screen id="missions" actions={actions}>
					<MissionsList {...missionListProps} />
					{mission && <MissionDetails mission={mission} />}
				</Screen>
				{launchDialog}
			</div>
		)
	}

	// Open launch dialog event handler
	onOpenLaunchDialog() {

		const {match, history} = this.props

		history.replace("/missions/" + match.params.mission + "/launch")
	}

	// Close launch dialog event handler
	onCloseLaunchDialog() {

		const {match, history} = this.props

		history.replace("/missions/" + match.params.mission)
	}

	// Remove mission event handler
	onRemoveMission(missionID, confirm = false) {

		const removedIndex = removeMission(missionID, confirm)

		if (removedIndex === false) {
			return
		}

		const {match, history} = this.props

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
