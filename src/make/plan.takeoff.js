/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU_TR_Entity = require("../item").MCU_TR_Entity;

// Make plan takeoff action
module.exports = function makePlanTakeoff(flight, action, input) {

	var output = [];
	var rand = this.rand;
	var airfield = this.airfieldsByID[flight.airfield];

	// NOTE: Flight will use a single takeoff command for all elements
	var takeoffCommand;

	for (var element of flight.elements) {

		// Set element planes to an air start position
		// TODO: Move from plan takeoff action logic?
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
		// Create takeoff command
		else if (flight.taxi) {

			var leaderPlaneItem = element[0].item;
			
			if (!takeoffCommand) {

				takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");

				var takeoffPoint = airfield.taxi[flight.taxi].takeoff;

				// Set takeoff command position to the start/takeoff point of runway
				takeoffCommand.setPosition(
					takeoffPoint[0],
					airfield.position[1],
					takeoffPoint[1]
				);
			}

			takeoffCommand.addObject(leaderPlaneItem);
			
			// Connect takeoff command to previous action
			input(takeoffCommand);
			
			// Connect takeoff command to next action
			output.push(function(input) {
				
				flight.leader.item.entity.addReport(
					MCU_TR_Entity.REPORT_TOOK_OFF,
					takeoffCommand,
					input
				);
			});
		}
	}

	// Build a connecting plan action output to input callback function
	if (output.length) {

		return function(input) {
			
			for (var outputCallback of output) {
				outputCallback(input);
			}
		};
	}
};