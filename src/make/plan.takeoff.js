/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");

// Data constants
const flightState = data.flightState;

// Make plan takeoff action
module.exports = function makePlanTakeoff(action, element, flight, input) {
	
	const rand = this.rand;
	const leaderPlaneItem = element[0].item;
	const isAirStart = (typeof element.state === "number");
	const isLastElement = (element === flight.elements[flight.elements.length - 1]);
	const airfield = this.airfields[flight.airfield];
	let takeoffCommand = flight.takeoffCommand;
	let taxiRoute;
	
	if (airfield.taxi) {
		taxiRoute = airfield.taxi[flight.taxi];
	}
	
	// Create take off command
	// NOTE: Flight will use a single take off command for all elements
	if (!takeoffCommand && taxiRoute && !isAirStart) {

		takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");

		// Set takeoff command position and orientation
		takeoffCommand.setPosition(taxiRoute.takeoffStart);
		takeoffCommand.setOrientationTo(taxiRoute.takeoffEnd);
		
		flight.takeoffCommand = takeoffCommand;
	}

	// Add a short timer before takeoff from runway start
	if (element.state === flightState.RUNWAY) {

		const waitTimerBefore = flight.group.createItem("MCU_Timer");
		let waitTimerMin = 8;
		let waitTimerMax = 12;

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
	
	// Short timer used to delay next command after takeoff is reported
	const waitTimerAfter = flight.group.createItem("MCU_Timer");

	waitTimerAfter.Time = +(rand.real(5, 8).toFixed(3));
	
	if (takeoffCommand) {
		waitTimerAfter.setPositionNear(takeoffCommand);
	}
	else {
		waitTimerAfter.setPositionNear(leaderPlaneItem);
	}
	
	// Use deactivate command to make sure the subsequent take off command actions
	// are not repeated after the second take off (for player flight only)
	if (element.player && !isAirStart) {

		const deactivateAfter = flight.group.createItem("MCU_Deactivate");

		deactivateAfter.setPositionNear(waitTimerAfter);
		deactivateAfter.addTarget(waitTimerAfter);
		waitTimerAfter.addTarget(deactivateAfter);
	}
	
	// Activate takeoff wait timer from ground start
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
	// Activate takeoff wait timer from (forced) air start
	else {
		input(waitTimerAfter);
	}

	// Connect takeoff command to next action
	return (input) => {
		waitTimerAfter.addTarget(input);
	};
};