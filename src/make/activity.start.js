/** @copyright Simas Toleikis, 2016 */
"use strict";

const {MCU_Icon} = require("../item");
const {flightState} = require("../data");

// Initial plan activity used to start/initialize flights
module.exports = class ActivityStart {

	// Make start activity action
	makeAction(element) {

		const {mission, flight} = this;
		const {rand} = mission;
		const flightGroup = flight.group;
		const isAirStart = (typeof element.state === "number");
		const debugFlights = Boolean(mission.debug && mission.debug.flights);

		// Create start location icon
		if (!flight.startIcon && (flight.player || debugFlights)) {

			const startIcon = flight.startIcon = flightGroup.createItem("MCU_Icon");

			startIcon.setPosition(this.position);

			if (flight.player) {

				startIcon.Coalitions = [flight.coalition];
				startIcon.IconId = MCU_Icon.ICON_ACTION_POINT;
			}
			else {
				startIcon.Coalitions = mission.coalitions;
			}
		}

		// Player-only spawn without a valid taxi route
		if (flight.taxi <= 0 && !isAirStart) {
			return;
		}

		// Create flight onStart event command
		if (!flight.onStart) {

			let onStart = flightGroup.createItem("MCU_TR_MissionBegin");

			onStart.setPositionNear(flight.leader.item);

			let startDelay = this.delay;

			// NOTE: Using a short delay for flights starting from a parking spot.
			// This is workaround as some aircraft have issues starting engines
			// without an initial timer delay (MiG-3 for example).
			if (flight.state === flightState.START) {
				startDelay = rand.real(2, 3);
			}

			if (startDelay) {

				const onStartTimer = flightGroup.createItem("MCU_Timer");

				onStartTimer.Time = Number(startDelay.toFixed(3));
				onStartTimer.setPositionNear(onStart);
				onStart.addTarget(onStartTimer);

				onStart = onStartTimer;
			}

			flight.onStart = onStart;
		}

		// Connect next plan action with onStart event command
		return (input) => {
			flight.onStart.addTarget(input);
		};
	}
};