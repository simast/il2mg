import * as MCU_Icon from "../item/MCU_Icon"
import {FlightState} from "./flight"

// Initial plan activity used to start/initialize flights
export default class ActivityStart {

	// Make start activity action
	makeAction(element) {

		const {mission, flight} = this
		const {rand} = mission
		const flightGroup = flight.group
		const isAirStart = (typeof element.state === "number")
		const debugFlights = Boolean(mission.debug && mission.debug.flights)

		// Create start location icon
		if ((!flight.startIcon || (flight.virtual && debugFlights)) &&
			(flight.player || debugFlights)) {

			const startIcon = flight.startIcon = flightGroup.createItem("MCU_Icon")

			startIcon.setPosition(this.position)

			if (flight.player) {

				startIcon.Coalitions = [flight.coalition]
				startIcon.IconId = MCU_Icon.ICON_ACTION_POINT
			}
			else {

				startIcon.Coalitions = mission.coalitions

				if (flight.virtual) {
					startIcon.IconId = MCU_Icon.ICON_WAYPOINT
				}
			}
		}

		// Player-only spawn without a valid taxi route
		if (flight.taxi <= 0 && !isAirStart) {
			return
		}

		// Create flight onBegin event command
		if (!flight.onBegin) {

			let onBegin = flightGroup.createItem("MCU_TR_MissionBegin")

			onBegin.setPositionNear(flight.leader.item)

			let beginDelay = this.delay

			// NOTE: Using a short delay for flights starting from a parking spot.
			// This is workaround as some aircraft have issues starting engines
			// without an initial timer delay (MiG-3 for example).
			if (!beginDelay && flight.state === FlightState.Start) {
				beginDelay = rand.real(2, 3)
			}

			if (beginDelay) {

				const onBeginTimer = flightGroup.createItem("MCU_Timer")

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

				onStart = flightGroup.createItem("MCU_Timer")

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
