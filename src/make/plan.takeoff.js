/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU_TR_Entity = require("../item").MCU_TR_Entity;

// Make plan takeoff action
module.exports = function makePlanTakeoff(action, element, flight, input) {

	var rand = this.rand;
	var airfield = this.airfieldsByID[flight.airfield];

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

		return;
	}

	// Handle player-only taxi takeoff logic
	if (!flight.taxi) {
		return;
	}

	var leaderPlaneItem = element[0].item;
	var takeoffStart = airfield.taxi[flight.taxi].takeoffStart;
	var takeoffEnd = airfield.taxi[flight.taxi].takeoffEnd;
	var takeoffCommand = flight.takeoffCommand;
	
	// Create takeoff command
	// NOTE: Flight will use a single takeoff command for all elements
	if (!takeoffCommand) {

		takeoffCommand = flight.takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");

		// Set takeoff command position and orientation
		takeoffCommand.setPosition(takeoffStart);
		takeoffCommand.setOrientationTo(takeoffEnd);

		// Connect takeoff command to previous action
		input(takeoffCommand);
	}

	// Set takeoff command object to element leader plane
	takeoffCommand.addObject(leaderPlaneItem);
	
	// Waypoint command used to form/delay element over an airfield
	var formCommand = flight.group.createItem("MCU_Waypoint");

	// TODO
	formCommand.Area = 100;
	formCommand.Speed = 280;

	// Semi-random formation point over the airfield
	formCommand.setPosition(
		airfield.position[0] + rand.integer(-500, 500),
		airfield.position[1] + rand.integer(240, 260),
		airfield.position[2] + rand.integer(-500, 500)
	);

	formCommand.addObject(leaderPlaneItem);

	// Short timer used to delay next command after takeoff is reported
	var waitTimer = flight.group.createItem("MCU_Timer");

	waitTimer.Time = rand.real(3, 6);
	waitTimer.setPosition(takeoffEnd);
	waitTimer.addTarget(formCommand);

	// Set element leader take off report event action
	leaderPlaneItem.entity.addReport(
		MCU_TR_Entity.REPORT_TOOK_OFF,
		takeoffCommand,
		waitTimer
	);

	// Connect takeoff command to next action
	return function(input) {
		formCommand.addTarget(input);
	}
};