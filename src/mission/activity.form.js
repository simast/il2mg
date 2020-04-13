import {FormationDensity} from '../items/enums'
import {FlightState} from './flight'

// Plan activity used to form up (set formation and element cover)
export default class ActivityForm {

	// Make form activity action
	makeAction(element, input) {

		const {mission, flight} = this
		const {rand} = mission
		const flightGroup = flight.group
		const leaderPlaneItem = element[0].item
		const isFlightAirStart = (typeof flight.state === 'number')
		const isLeadingElement = (element === flight.elements[0])
		const isPlayerFlightLeader = (flight.player === flight.leader)
		const debugFlights = Boolean(mission.debug && mission.debug.flights)

		// Set cover command for non-leading elements
		if (!isLeadingElement) {

			let coverCommand = element.coverCommand

			if (!coverCommand) {

				coverCommand = mission.createItem('MCU_CMD_Cover', flightGroup)
				coverCommand.setPositionNear(leaderPlaneItem)

				element.coverCommand = coverCommand
			}

			coverCommand.addTarget(flight.leader.item.entity)
			coverCommand.addObject(leaderPlaneItem)

			input(coverCommand)
		}

		// Set element plane formation command
		if (element.length > 1) {

			let formationCommand = element.formationCommand

			if (!formationCommand) {

				formationCommand = mission.createItem('MCU_CMD_Formation', flightGroup)

				formationCommand.FormationType = element.formation
				formationCommand.FormationDensity = FormationDensity.Safe
				formationCommand.setPositionNear(leaderPlaneItem)

				element.formationCommand = formationCommand
			}

			formationCommand.addObject(leaderPlaneItem)

			input(formationCommand)
		}

		// NOTE: No more commands will be generated when player is a flight leader!
		if (isPlayerFlightLeader && !debugFlights) {
			return
		}

		// NOTE: Leading element (in a multi element formation) will wait for other
		// elements still on the ground before executing further task plan actions.
		if (isLeadingElement && !isFlightAirStart && flight.elements.length > 1) {

			const groundStartElements = []

			// Collect all ground start elements in a priority list
			for (const element of flight.elements) {

				const priority = {
					[FlightState.Start]: 1,
					[FlightState.Taxi]: 2,
					[FlightState.Runway]: 3
				}[element.state]

				if (priority) {
					groundStartElements.push({priority, element})
				}
			}

			let lastStartingElement

			if (groundStartElements.length) {

				// Pick last starting ground element based on starting priority
				lastStartingElement = groundStartElements.sort((a, b) => (
					a.priority - b.priority
				))[0].element
			}

			if (lastStartingElement && lastStartingElement !== element) {

				return input => {

					// Add a small timer so that other elements can link up with the rest
					// of the flight after take off (just before proceeding with the task).
					const waitTimerLink = mission.createItem('MCU_Timer', flightGroup)

					waitTimerLink.Time = Number(rand.real(40, 60).toFixed(3))
					waitTimerLink.setPositionNear(flight.takeoffCommand)
					waitTimerLink.addTarget(input)

					// Connect form up action using last ground element "took off" report
					lastStartingElement[0].item.entity.addReport(
						'OnTookOff',
						flight.takeoffCommand,
						waitTimerLink
					)
				}
			}
		}

		// Connect form up to next action
		return input
	}
}