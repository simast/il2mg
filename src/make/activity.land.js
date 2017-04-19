/** @copyright Simas Toleikis, 2016 */
"use strict";

// Plan activity used to land on airfield (and end the flight)
module.exports = class ActivityLand {

	// Make land activity action
	makeAction(element, input) {

		if (!input) {
			return;
		}

		const {mission, flight} = this;
		const airfield = mission.airfields[this.airfield || flight.airfield];
		let taxiRoute;

		if (airfield.taxi) {
			taxiRoute = airfield.taxi[this.taxi || Math.abs(flight.taxi)];
		}

		// TODO: Delete flight planes at destination when it's not possible to land?
		if (!taxiRoute) {
			return;
		}

		const {rand} = mission;
		const flightGroup = flight.group;
		const leaderElement = flight.elements[0];
		const leaderPlaneItem = element[0].item;
		const landCommand = flightGroup.createItem("MCU_CMD_Land");

		// Set land command position and orientation
		// NOTE: Landing point is the same as takeoff
		landCommand.setPosition(taxiRoute.takeoffStart);
		landCommand.setOrientationTo(taxiRoute.takeoffEnd);

		landCommand.addObject(leaderPlaneItem);

		// Leading element land action
		if (element === leaderElement) {

			element.landCommand = landCommand;

			// Connect land command to previous action
			input(landCommand);
		}
		// Other element land action
		else {

			// TODO: Other elements should wait for previous element landed reports

			// Short timer used to delay land command
			const waitTimer = flightGroup.createItem("MCU_Timer");

			waitTimer.Time = +(rand.real(10, 15).toFixed(3));
			waitTimer.setPositionNear(leaderPlaneItem);
			waitTimer.addTarget(landCommand);

			flight.leader.item.entity.addReport(
				"OnLanded",
				leaderElement.landCommand,
				waitTimer
			);
		}
	}

	// Make land activity briefing
	makeBriefing() {

		const {mission, flight} = this;
		const briefing = [];
		const airfield = mission.airfields[this.airfield || flight.airfield];
		const playerElement = mission.player.element;
		let taxiRoute;

		if (airfield.taxi) {
			taxiRoute = airfield.taxi[this.taxi || Math.abs(flight.taxi)];
		}

		briefing.push("Land at");

		// Show airfield name (when target airfield is different or with air start)
		if (airfield.id !== flight.airfield ||
			typeof playerElement.state === "number") {

			briefing.push("[" + airfield.name + "]");
		}
		// Hide airfield name (should be already visibile in take off briefing)
		else {
			briefing.push("the");
		}

		briefing.push("airfield");

		// Target airfield callsign
		if (airfield.callsign && (airfield.id !== flight.airfield ||
			typeof playerElement.state === "number")) {

			briefing.push("(callsign <i>“" + airfield.callsign.name + "”</i>)");
		}

		// Add landing heading/direction
		if (taxiRoute && (airfield.id !== flight.airfield ||
			typeof playerElement.state === "number")) {

			let heading = Math.atan2(
				taxiRoute.takeoffEnd[2] - taxiRoute.takeoffStart[2],
				taxiRoute.takeoffEnd[0] - taxiRoute.takeoffStart[0]
			) * (180 / Math.PI);

			heading = Math.round((heading + 360) % 360);
			heading = ("000" + heading).substr(-3, 3);

			briefing.push("heading " + heading);

			// TODO: Add info about parking area location (to your left/right/forward)
		}

		briefing.push("and taxi to the parking area");

		return briefing.join(" ") + ".";
	}
};