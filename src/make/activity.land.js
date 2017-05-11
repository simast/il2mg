/** @copyright Simas Toleikis, 2016 */
"use strict"

// Plan activity used to land on airfield (and end the flight)
module.exports = class ActivityLand {

	// Make land activity action
	makeAction(element, input) {

		const {flight} = this
		const [leadingElement] = flight.elements

		// Land action is initiated by leading element
		if (element !== leadingElement) {
			return
		}

		const {mission} = this
		const airfield = mission.airfields[this.airfield || flight.airfield]
		let taxiRoute

		if (airfield.taxi) {
			taxiRoute = airfield.taxi[this.taxi || Math.abs(flight.taxi)]
		}

		if (!taxiRoute) {
			return
		}

		const debugFlights = Boolean(mission.debug && mission.debug.flights)
		const isPlayerFlightLeader = (flight.player === flight.leader)

		// Skip land action for player-only flight
		if (isPlayerFlightLeader && flight.planes === 1 && !debugFlights) {
			return
		}

		const {rand} = mission
		const flightGroup = flight.group

		// Process each element
		for (const element of flight.elements) {

			const leaderPlaneItem = element[0].item
			let landCommand = element.landCommand

			if (!landCommand) {

				landCommand = flightGroup.createItem("MCU_CMD_Land")

				// Landing point position and orientation is the same as takeoff
				landCommand.setPosition(taxiRoute.takeoffStart)
				landCommand.setOrientationTo(taxiRoute.takeoffEnd)

				element.landCommand = landCommand
			}

			landCommand.addObject(leaderPlaneItem)

			// Leading element land action
			if (element === leadingElement) {

				// Connect leading element land command to previous action
				// FIXME: Handle all cases when input is not available!
				if (input) {
					input(landCommand)
				}
			}
			// Other element land action
			else {

				// TODO: Other elements should wait for previous element landed reports

				let landWaitTimer = element.landWaitTimer

				if (!landWaitTimer) {

					// Short timer used to delay land command
					landWaitTimer = flightGroup.createItem("MCU_Timer")

					landWaitTimer.Time = +(rand.real(10, 15).toFixed(3))
					landWaitTimer.setPositionNear(leaderPlaneItem)
					landWaitTimer.addTarget(landCommand)

					element.landWaitTimer = landWaitTimer
				}

				flight.leader.item.entity.addReport(
					"OnLanded",
					leadingElement.landCommand,
					landWaitTimer
				)
			}
		}
	}

	// Make land activity briefing
	makeBriefing() {

		const {mission, flight} = this
		const briefing = []
		const airfield = mission.airfields[this.airfield || flight.airfield]
		const playerElement = mission.player.element
		let taxiRoute

		if (airfield.taxi) {
			taxiRoute = airfield.taxi[this.taxi || Math.abs(flight.taxi)]
		}

		briefing.push("Land at")

		// Show airfield name (when target airfield is different or with air start)
		if (airfield.id !== flight.airfield ||
			typeof playerElement.state === "number") {

			briefing.push("[" + airfield.name + "]")
		}
		// Hide airfield name (should be already visibile in take off briefing)
		else {
			briefing.push("the")
		}

		briefing.push("airfield")

		// Target airfield callsign
		if (airfield.callsign && (airfield.id !== flight.airfield ||
			typeof playerElement.state === "number")) {

			briefing.push("(callsign <i>“" + airfield.callsign.name + "”</i>)")
		}

		// Add landing heading/direction
		if (taxiRoute && (airfield.id !== flight.airfield ||
			typeof playerElement.state === "number")) {

			let heading = Math.atan2(
				taxiRoute.takeoffEnd[2] - taxiRoute.takeoffStart[2],
				taxiRoute.takeoffEnd[0] - taxiRoute.takeoffStart[0]
			) * (180 / Math.PI)

			heading = Math.round((heading + 360) % 360)
			heading = ("000" + heading).substr(-3, 3)

			briefing.push("heading " + heading)

			// TODO: Add info about parking area location (to your left/right/forward)
		}

		briefing.push("and taxi to the parking area")

		return briefing.join(" ") + "."
	}
}