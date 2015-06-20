/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Make plan takeoff action
module.exports = function makePlanTakeoff(action, element, flight, input) {

	// Skip takeoff logic for player-only taxi routes
	if (!flight.taxi) {
		return;
	}

	var rand = this.rand;
	var airfield = this.airfieldsByID[flight.airfield];
	var leaderPlaneItem = element[0].item;
	var takeoffStart = airfield.taxi[flight.taxi].takeoffStart;
	var takeoffEnd = airfield.taxi[flight.taxi].takeoffEnd;
	var takeoffCommand = flight.takeoffCommand;
	var flightState = DATA.flightState;
	var isAirStart = (typeof element.state === "number");
	var isLastElement = (element === flight.elements[flight.elements.length - 1]);
	
	// Create takeoff command
	// NOTE: Flight will use a single takeoff command for all elements
	if (!takeoffCommand) {

		takeoffCommand = flight.takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");

		// Set takeoff command position and orientation
		takeoffCommand.setPosition(takeoffStart);
		takeoffCommand.setOrientationTo(takeoffEnd);
	}

	// Add a short timer before takeoff from runway start
	if (element.state === flightState.RUNWAY) {

		var waitTimerBefore = flight.group.createItem("MCU_Timer");
		var waitTimerMin = 8;
		var waitTimerMax = 12;

		// Give more time before take off for player flight (when not a leader)
		if (flight.player && element[0] !== flight.player) {

			waitTimerMin = 20;
			waitTimerMax = 30;
		}

		waitTimerBefore.Time = rand.real(waitTimerMin, waitTimerMax, true);
		waitTimerBefore.setPositionNear(takeoffCommand);
		waitTimerBefore.addTarget(takeoffCommand);

		input(waitTimerBefore);
	}
	// Connect takeoff command to previous action
	else if (isLastElement && !isAirStart) {
		input(takeoffCommand);
	}

	// Set takeoff command object to element leader plane
	if (!isAirStart) {
		takeoffCommand.addObject(leaderPlaneItem);
	}
	
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
	
	// Short timer used to delay next command after takeoff is reported
	var waitTimerAfter = flight.group.createItem("MCU_Timer");

	waitTimerAfter.Time = rand.real(5, 8, true);
	waitTimerAfter.setPosition(takeoffEnd);
	waitTimerAfter.addTarget(waypointCommand);

	if (element.length > 1) {

		// Element plane formation command
		var formationCommand = flight.group.createItem("MCU_CMD_Formation");
	
		formationCommand.FormationType = Item.MCU_CMD_Formation.TYPE_PLANE_EDGE_RIGHT;
		formationCommand.FormationDensity = Item.MCU_CMD_Formation.DENSITY_LOOSE;
		formationCommand.addObject(leaderPlaneItem);
		formationCommand.setPositionNear(waypointCommand);

		waypointCommand.addTarget(formationCommand);
	}

	if (!isAirStart) {
		
		// Set element leader take off report event action
		leaderPlaneItem.entity.addReport(
			Item.MCU_TR_Entity.REPORT_TOOK_OFF,
			takeoffCommand,
			waitTimerAfter
		);
	}
	else {
		input(waitTimerAfter);
	}

	// Connect takeoff command to next action
	return function(input) {
		waypointCommand.addTarget(input);
	};
};