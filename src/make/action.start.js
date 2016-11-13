/** @copyright Simas Toleikis, 2015 */
"use strict";

const {MCU_Icon} = require("../item");
const {flightState} = require("../data");

// Make plan start action
module.exports = function makePlanStartAction(flight, element, action) {

	const rand = this.rand;
	const position = action.position;
	const isAirStart = (typeof element.state === "number");

	// Create start location icon for player flight
	if (flight.player && !flight.startIcon) {

		const startIcon = flight.startIcon = flight.group.createItem("MCU_Icon");

		startIcon.setPosition(position);
		startIcon.Coalitions = [flight.coalition];
		startIcon.IconId = MCU_Icon.ICON_ACTION_POINT;
		startIcon.LineType = MCU_Icon.LINE_SECTOR_4;
	}

	// Player-only spawn without valid taxi route
	if (flight.taxi <= 0 && !isAirStart) {
		return;
	}

	if (!flight.onStart) {

		// TODO: Add support for shedulled flights
		const onStart = flight.onStart = flight.group.createItem("MCU_TR_MissionBegin");

		onStart.setPositionNear(flight.leader.item);

		// NOTE: Using a separate timer to delay flights starting from a parking spot.
		// This is necessary as some aircraft have issues starting engines without
		// an initial timer delay (MiG-3 for example).
		if (flight.state === flightState.START) {

			const onStartTimer = flight.onStart = flight.group.createItem("MCU_Timer");

			onStartTimer.Time = Number(rand.real(2, 3).toFixed(3));
			onStartTimer.setPositionNear(onStart);
			onStart.addTarget(onStartTimer);
		}
	}

	// Connect next plan action with onStart event command
	return (input) => {
		flight.onStart.addTarget(input);
	};
};