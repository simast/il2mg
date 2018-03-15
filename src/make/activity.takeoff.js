import {FlightState} from "./flight"
import {ItemFlag} from "../data"

// Plan activity used to taxi (optionally) and take off from airfield
export default class ActivityTakeOff {

	// Make take off activity action
	makeAction(element, input) {

		const {mission, flight} = this
		const {rand} = mission
		const flightGroup = flight.group
		const leaderPlaneItem = element[0].item
		const isAirStart = (typeof element.state === "number")
		const isLastElement = (element === flight.elements[flight.elements.length - 1])
		const airfield = mission.airfields[flight.airfield]
		let takeoffCommand = flight.takeoffCommand
		let taxiRoute

		if (airfield.taxi) {
			taxiRoute = airfield.taxi[flight.taxi]
		}

		// Create take off command
		// NOTE: Flight will use a single take off command for all elements
		if (!takeoffCommand && taxiRoute && !isAirStart) {

			takeoffCommand = flightGroup.createItem("MCU_CMD_TakeOff")

			// Set takeoff command position and orientation
			takeoffCommand.setPosition(taxiRoute.takeoffStart)
			takeoffCommand.setOrientationTo(taxiRoute.takeoffEnd)

			flight.takeoffCommand = takeoffCommand
		}

		// Add a short timer before takeoff from runway start
		if (element.state === FlightState.Runway) {

			const waitTimerBefore = flightGroup.createItem("MCU_Timer")
			let waitTimerMin = 8
			let waitTimerMax = 12

			// Give more time before take off for player flight (when not a leader)
			if (flight.player && element[0] !== flight.player) {

				waitTimerMin = 20
				waitTimerMax = 30
			}

			waitTimerBefore.Time = Number(rand.real(waitTimerMin, waitTimerMax).toFixed(3))
			waitTimerBefore.setPositionNear(takeoffCommand)
			waitTimerBefore.addTarget(takeoffCommand)

			input(waitTimerBefore)
		}
		// Connect takeoff command to previous action
		else if (takeoffCommand && isLastElement && !isAirStart) {
			input(takeoffCommand)
		}

		// Set takeoff command object to element leader plane
		if (takeoffCommand && !isAirStart) {
			takeoffCommand.addObject(leaderPlaneItem)
		}

		// Short timer used to delay next command after takeoff is reported
		const waitTimerAfter = flightGroup.createItem("MCU_Timer")

		waitTimerAfter.Time = Number(rand.real(12, 18).toFixed(3))

		if (takeoffCommand) {
			waitTimerAfter.setPositionNear(takeoffCommand)
		}
		else {
			waitTimerAfter.setPositionNear(leaderPlaneItem)
		}

		// Use deactivate command to make sure the subsequent take off command actions
		// are not repeated after the second take off (for player flight only)
		if (element.player && !isAirStart) {

			const deactivateAfter = flightGroup.createItem("MCU_Deactivate")

			deactivateAfter.setPositionNear(waitTimerAfter)
			deactivateAfter.addTarget(waitTimerAfter)
			waitTimerAfter.addTarget(deactivateAfter)
		}

		// Activate takeoff wait timer from ground start
		if (!isAirStart) {

			// Set element leader take off report event action
			if (takeoffCommand) {

				leaderPlaneItem.entity.addReport(
					"OnTookOff",
					takeoffCommand,
					waitTimerAfter
				)
			}
			// Set take off event action for player-only spawn
			else {

				leaderPlaneItem.entity.addEvent(
					"OnPlaneTookOff",
					waitTimerAfter
				)
			}
		}
		// Activate takeoff wait timer from (forced) air start
		else {
			input(waitTimerAfter)
		}

		// Connect takeoff command to next action
		return input => {
			waitTimerAfter.addTarget(input)
		}
	}

	// Make take off activity briefing
	makeBriefing() {

		const {mission, flight} = this
		const playerElement = mission.player.element

		// Ignore take off briefing on air start
		// NOTE: This may happen when the flight state was "start" - but the player
		// element was pushed for air start (due to lack of plane spots or taxi
		// routes for example).
		if (typeof playerElement.state === "number") {
			return
		}

		let briefing = []
		const airfield = mission.airfields[flight.airfield]
		const playerPlaneItem = flight.player.item
		const taxiRoute = airfield.taxi[Math.abs(flight.taxi)]

		// Add taxi info string only if relevant
		if (taxiRoute && (playerElement.state === FlightState.Start ||
				playerElement.state === FlightState.Taxi)) {

			briefing.push("taxi")

			// Add taxi direction hint
			if (taxiRoute) {

				const taxiPoints = taxiRoute[4]
				let taxiReferencePoint
				let taxiDistanceReference
				let taxiDistanceFirst

				// Find taxi hint reference point
				for (let i = 0; i < taxiPoints.length; i++) {

					taxiReferencePoint = taxiPoints[i]

					// Compute distance from taxi reference point to player plane item
					taxiDistanceReference = Math.sqrt(
						Math.pow(playerPlaneItem.XPos - taxiReferencePoint[0], 2) +
						Math.pow(playerPlaneItem.ZPos - taxiReferencePoint[1], 2)
					)

					if (i === 0) {
						taxiDistanceFirst = taxiDistanceReference
					}

					// NOTE: Try at least 3 taxi points and abort when the distance from
					// the reference point to the player plane item is greater than 100
					// meters. Also abort if we hit taxi runway takeoff point.
					if (i >= 2 && (taxiDistanceReference > 100 ||
						taxiPoints[i][2] === ItemFlag.TaxiRunway)) {

						break
					}
				}

				// Use runway start point as a taxi hint reference point
				if (taxiDistanceFirst > taxiDistanceReference) {

					taxiReferencePoint = [
						taxiRoute.takeoffStart[0],
						taxiRoute.takeoffStart[2]
					]
				}

				if (taxiReferencePoint) {

					let taxiHintOrientation = Math.atan2(
						taxiReferencePoint[1] - playerPlaneItem.ZPos,
						taxiReferencePoint[0] - playerPlaneItem.XPos
					) * (180 / Math.PI)

					let planeHintOrientation = playerPlaneItem.YOri

					if (planeHintOrientation > 180) {
						planeHintOrientation -= 360
					}

					taxiHintOrientation -= planeHintOrientation

					// Normalize taxi hint orientation from -180 to +180 range
					if (taxiHintOrientation < -180) {
						taxiHintOrientation += 360
					}
					else if (taxiHintOrientation > 180) {
						taxiHintOrientation -= 360
					}

					// Forward direction from -25 to +25 orientation
					if (Math.abs(taxiHintOrientation) <= 25) {
						briefing.push("forward")
					}
					// Left direction from -25 to -150
					else if (taxiHintOrientation < -25 && taxiHintOrientation > -150) {
						briefing.push("to your left")
					}
					// Right direction from +25 to +150
					else if (taxiHintOrientation > 25 && taxiHintOrientation < 150) {
						briefing.push("to your right")
					}
				}
			}

			briefing.push("and")
		}

		briefing.push("take off from [" + airfield.name + "] airfield")

		// Airfield callsign
		if (airfield.callsign) {
			briefing.push("(callsign <i>“" + airfield.callsign.name + "”</i>)")
		}

		// Add take off heading/direction
		if (taxiRoute) {

			let heading = Math.atan2(
				taxiRoute.takeoffEnd[2] - taxiRoute.takeoffStart[2],
				taxiRoute.takeoffEnd[0] - taxiRoute.takeoffStart[0]
			) * (180 / Math.PI)

			heading = Math.round((heading + 360) % 360)
			heading = ("000" + heading).substr(-3, 3)

			briefing.push("heading " + heading)
		}

		briefing = briefing.join(" ") + "."
		briefing = briefing.charAt(0).toUpperCase() + briefing.slice(1)

		return briefing
	}
}