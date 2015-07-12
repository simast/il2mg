/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU_CMD_Formation = require("../item").MCU_CMD_Formation;

// Make plan takeoff action
module.exports = function makePlanTakeoff(action, element, flight, input) {

	var rand = this.rand;
	var airfield = this.airfieldsByID[flight.airfield];
	var leaderPlaneItem = element[0].item;
	var takeoffCommand = flight.takeoffCommand;
	var taxiRoute = airfield.taxi[flight.taxi];
	var flightState = DATA.flightState;
	var isAirStart = (typeof element.state === "number");
	var isLastElement = (element === flight.elements[flight.elements.length - 1]);
	
	// Create take off command
	// NOTE: Flight will use a single take off command for all elements
	if (!takeoffCommand && taxiRoute) {

		takeoffCommand = flight.takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");

		// Set takeoff command position and orientation
		takeoffCommand.setPosition(taxiRoute.takeoffStart);
		takeoffCommand.setOrientationTo(taxiRoute.takeoffEnd);
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

		waitTimerBefore.Time = +(rand.real(waitTimerMin, waitTimerMax).toFixed(3));
		waitTimerBefore.setPositionNear(takeoffCommand);
		waitTimerBefore.addTarget(takeoffCommand);

		input(waitTimerBefore);
	}
	// Connect takeoff command to previous action
	else if (takeoffCommand && isLastElement && !isAirStart) {
		input(takeoffCommand);
	}

	// Set takeoff command object to element leader plane
	if (takeoffCommand && !isAirStart) {
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

	waitTimerAfter.Time = +(rand.real(5, 8).toFixed(3));
	waitTimerAfter.addTarget(waypointCommand);
	
	if (takeoffCommand) {
		waitTimerAfter.setPositionNear(takeoffCommand);
	}
	else {
		waitTimerAfter.setPositionNear(leaderPlaneItem);
	}

	// Deactivate command used to make sure the subsequent take off command actions
	// are not repeated after the second take off (for player flight only)
	if (flight.player) {

		var deactivateAfter = flight.group.createItem("MCU_Deactivate");

		deactivateAfter.setPositionNear(waitTimerAfter);
		deactivateAfter.addTarget(waitTimerAfter);
		waitTimerAfter.addTarget(deactivateAfter);
	}

	if (element.length > 1) {

		// Element plane formation command
		var formationCommand = flight.group.createItem("MCU_CMD_Formation");
	
		formationCommand.FormationType = MCU_CMD_Formation.TYPE_PLANE_EDGE_RIGHT;
		formationCommand.FormationDensity = MCU_CMD_Formation.DENSITY_LOOSE;
		formationCommand.addObject(leaderPlaneItem);
		formationCommand.setPositionNear(waypointCommand);

		waypointCommand.addTarget(formationCommand);
	}

	if (!isAirStart) {
		
		// Set element leader take off report event action
		if (takeoffCommand) {

			leaderPlaneItem.entity.addReport(
				"OnTookOff",
				takeoffCommand,
				waitTimerAfter
			);
		}
		// Set take off event action for player-only spawn
		else {

			leaderPlaneItem.entity.addEvent(
				"OnPlaneTookOff",
				waitTimerAfter
			);
		}
	}
	else {
		input(waitTimerAfter);
	}

	// Connect takeoff command to next action
	return function(input) {
		waypointCommand.addTarget(input);
	};
};