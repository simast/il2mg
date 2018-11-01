import {IconType} from '../items/enums'
import {FlightState} from './flight'

// Initial plan activity used to start/initialize flights
export default class ActivityStart {

	// Make start activity action
	makeAction(element) {

		const {mission, flight} = this
		const {rand} = mission
		const flightGroup = flight.group
		const isAirStart = (typeof element.state === 'number')
		const debugFlights = Boolean(mission.debug && mission.debug.flights)

		// Create start location icon
		if ((!flight.startIcon || (flight.virtual && debugFlights)) &&
			(flight.player || debugFlights)) {

			const startIcon = flight.startIcon = mission.createItem('MCU_Icon', flightGroup)

			startIcon.setPosition(this.position)

			if (flight.player) {

				const fromAirfield = mission.airfields[flight.airfield]
				const isForwardState = isAirStart && element.state > 0

				// NOTE: Using a single whitespace to disable showing default "Point 1/2/etc"
				// text on the map near flight route points.
				let iconName = ' '

				if (!isForwardState) {
					iconName = (fromAirfield.offmap ? 'from ' : '') + fromAirfield.name
				}

				// NOTE: Omitting Y position to hide altitude display on the map route point!
				if (!isForwardState || (element.state === 0 && !fromAirfield.offmap)) {
					startIcon.YPos = 0
				}

				startIcon.setName(mission.getLC(iconName))
				startIcon.Coalitions = [flight.coalition]
				startIcon.IconId = IconType.ActionPoint
			}
			else {

				startIcon.Coalitions = mission.coalitions

				if (flight.virtual) {
					startIcon.IconId = IconType.Waypoint
				}
			}
		}

		// Player-only spawn without a valid taxi route
		if (flight.taxi <= 0 && !isAirStart) {
			return
		}

		// Create flight onBegin event command
		if (!flight.onBegin) {

			let onBegin = mission.createItem('MCU_TR_MissionBegin', flightGroup)

			onBegin.setPositionNear(flight.leader.item)

			let beginDelay = flight.player ? 0 : this.delay

			// NOTE: Using a short delay for flights starting from a parking spot.
			// This is workaround as some aircraft have issues starting engines
			// without an initial timer delay (MiG-3 for example).
			if (!beginDelay && flight.state === FlightState.Start) {
				beginDelay = rand.real(2, 3)
			}

			if (beginDelay) {

				const onBeginTimer = mission.createItem('MCU_Timer', flightGroup)

				onBeginTimer.Time = Number(beginDelay.toFixed(3))
				onBeginTimer.setPositionNear(onBegin)
				onBegin.addTarget(onBeginTimer)

				onBegin = onBeginTimer
			}

			flight.onBegin = onBegin
		}

		// Create flight onStart event command
		if (!flight.onStart) {

			let onStart = flight.onBegin

			// NOTE: Virtual flights are deactivated and start with a separate timer
			// after being activated.
			if (flight.virtual) {

				onStart = mission.createItem('MCU_Timer', flightGroup)

				// Short delay used to wait for virtual flight plane activation
				onStart.Time = 1
				onStart.setPositionNear(flight.leader.item)
			}

			flight.onStart = onStart
		}

		// Connect next plan action with onStart event command
		return input => {
			flight.onStart.addTarget(input)
		}
	}
}
