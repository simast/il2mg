/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU_Icon = require("../item").MCU_Icon;

// Make plan start action
module.exports = function makePlanStart(action, element, flight, input) {

	const rand = this.rand;
	const airfield = this.airfields[flight.airfield];
	const isAirStart = (typeof element.state === "number");

	// Set element planes to an air start position
	if (isAirStart) {

		const orientation = rand.integer(0, 360);

		for (const plane of element) {

			const planeItem = plane.item;

			// TODO: Set orientation and tweak spawn distance
			// TODO: Set formation?
			const positionX = airfield.position[0] + rand.integer(150, 350);
			const positionY = airfield.position[1] + rand.integer(250, 350);
			const positionZ = airfield.position[2] + rand.integer(150, 350);

			// Set plane item air start position and orientation
			planeItem.setPosition(positionX, positionY, positionZ);
			planeItem.setOrientation(orientation);
		}
	}
	
	// Create start location icon for player flight
	// TODO: Don't create icon for flights in progress (state > 0)?
	if (flight.player && !flight.startIcon) {
		
		const startIcon = flight.startIcon = flight.group.createItem("MCU_Icon");
		
		startIcon.setPosition(airfield.position);
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
	}

	// Connect next plan action with onStart event command
	return (input) => {
		flight.onStart.addTarget(input);
	};
};