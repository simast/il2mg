/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

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
	var waypointCommand = flight.group.createItem("MCU_Waypoint");

	// TODO
	waypointCommand.Area = 100;
	waypointCommand.Speed = 280;

	// Semi-random formation point over the airfield
	waypointCommand.setPosition(
		airfield.position[0] + rand.integer(-500, 500),
		airfield.position[1] + rand.integer(240, 260),
		airfield.position[2] + rand.integer(-500, 500)
	);

	waypointCommand.addObject(leaderPlaneItem);
	
	// Element plane formation command
	var formationCommand = flight.group.createItem("MCU_CMD_Formation");

	formationCommand.FormationType = Item.MCU_CMD_Formation.TYPE_PLANE_EDGE_RIGHT;
	formationCommand.FormationDensity = Item.MCU_CMD_Formation.DENSITY_LOOSE;
	formationCommand.addObject(leaderPlaneItem);

	// Short timer used to delay next command after takeoff is reported
	var waitTimer = flight.group.createItem("MCU_Timer");

	waitTimer.Time = rand.real(4, 6);
	waitTimer.setPosition(takeoffEnd);
	waitTimer.addTarget(waypointCommand);
	
	formationCommand.setPositionNear(waitTimer);
	waypointCommand.addTarget(formationCommand);

	// Set element leader take off report event action
	leaderPlaneItem.entity.addReport(
		Item.MCU_TR_Entity.REPORT_TOOK_OFF,
		takeoffCommand,
		waitTimer
	);

	// Connect takeoff command to next action
	return function(input) {
		waypointCommand.addTarget(input);
	};
};