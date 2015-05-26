/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU_CMD_Land = require("../item").MCU_CMD_Land;

// Make plan land action
module.exports = function makePlanLand(flight, action, input) {

	var rand = this.rand;
	var airfield = this.airfieldsByID[flight.airfield];

	// NOTE: Flight will use a single land command for all elements
	var landCommand;

	for (var element of flight.elements) {

		var leaderPlaneItem = element[0].item;

		if (!landCommand) {

			landCommand = flight.group.createItem("MCU_CMD_Land");
			
			// NOTE: Landing point is the same as takeoff
			var landPoint = airfield.taxi[flight.taxi].takeoff;

			landCommand.Priority = MCU_CMD_Land.PRIORITY_HIGH;

			// Set land command position to the start/land point of runway
			landCommand.setPosition(
				landPoint[0],
				airfield.position[1],
				landPoint[1]
			);
		}

		landCommand.addObject(leaderPlaneItem);

		// Connect land command to previous action
		input(landCommand);
	}
};