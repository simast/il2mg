/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make plan start action
module.exports = function makePlanStart(action, element, flight, input) {

	var rand = this.rand;
	var airfield = this.airfields[flight.airfield];

	// Set element planes to an air start position
	if (typeof element.state === "number") {

		var orientation = rand.integer(0, 360);

		for (var plane of element) {

			var planeItem = plane.item;

			// TODO: Set orientation and tweak spawn distance
			// TODO: Set formation?
			var positionX = airfield.position[0] + rand.integer(150, 350);
			var positionY = airfield.position[1] + rand.integer(250, 350);
			var positionZ = airfield.position[2] + rand.integer(150, 350);

			// Set plane item air start position and orientation
			planeItem.setPosition(positionX, positionY, positionZ);
			planeItem.setOrientation(orientation);
		}
	}

	// Player-only spawn without valid taxi route
	if (flight.taxi <= 0) {
		return;
	}

	if (!flight.onStart) {

		// TODO: Add support for shedulled flights
		var onStart = flight.onStart = flight.group.createItem("MCU_TR_MissionBegin");

		onStart.setPositionNear(flight.leader.item);
	}

	// Connect next plan action with onStart event command
	return function(input) {
		flight.onStart.addTarget(input);
	};
};