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
		const position = this.position;
		const isAirStart = (typeof element.state === "number");
		const debugFlights = Boolean(mission.debug && mission.debug.flights);

		// Create start location icon
		if (!flight.startIcon && (flight.player || debugFlights)) {

			const startIcon = flight.startIcon = flightGroup.createItem("MCU_Icon");

			startIcon.setPosition(position);
			startIcon.Coalitions = [flight.coalition];

			if (debugFlights) {
				startIcon.Coalitions = mission.coalitions;
			}

			if (flight.player) {
				startIcon.IconId = MCU_Icon.ICON_ACTION_POINT;
			}
		}

		// Player-only spawn without a valid taxi route
		if (flight.taxi <= 0 && !isAirStart) {
			return;
		}

		// Create flight onStart event command
		if (!flight.onStart) {

			// TODO: Add support for shedulled flights
			let onStart = flightGroup.createItem("MCU_TR_MissionBegin");

			onStart.setPositionNear(flight.leader.item);

			// NOTE: Using a separate timer to delay flights starting from a parking
			// spot. This is necessary as some aircraft have issues starting engines
			// without an initial timer delay (MiG-3 for example).
			if (flight.state === flightState.START) {

				const onStartTimer = flightGroup.createItem("MCU_Timer");

				onStartTimer.Time = Number(rand.real(2, 3).toFixed(3));
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

	// Make start activity state
	makeState(state) {

		// NOTE: Start action will only have state when the flight is arriving from
		// an offmap point. The fuel for offmap route has already been adjusted and
		// all that is left is to fast-forward start delay.

		this.delay -= (this.delay * state);

		if (this.delay <= 0) {
			delete this.delay;
		}
	}
};