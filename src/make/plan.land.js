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
			
			// TODO: Set position on the start of runway
			landCommand.setPositionNear(leaderPlaneItem);
			landCommand.Priority = MCU_CMD_Land.PRIORITY_LOW;
		}

		landCommand.addObject(leaderPlaneItem);

		// Connect land command to previous action
		input(landCommand);
	}
};