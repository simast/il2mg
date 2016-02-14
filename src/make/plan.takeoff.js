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
	const isLeadingElement = (element === flight.elements[0]);
	const isLastElement = (element === flight.elements[flight.elements.length - 1]);
	const airfield = this.airfields[flight.airfield];
	let takeoffCommand = action.takeoffCommand;
	let taxiRoute;
	
	if (airfield.taxi) {
		taxiRoute = airfield.taxi[flight.taxi];
	}
	
	// Create take off command
	// NOTE: Flight will use a single take off command for all elements
	if (!takeoffCommand && taxiRoute && !isAirStart) {

		takeoffCommand = action.takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");

		// Set takeoff command position and orientation
		takeoffCommand.setPosition(taxiRoute.takeoffStart);
		takeoffCommand.setOrientationTo(taxiRoute.takeoffEnd);
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
	
	// Deactivate command used to make sure the subsequent take off command actions
	// are not repeated after the second take off (for player flight only)
	if (element.player && !isAirStart) {

		const deactivateAfter = flight.group.createItem("MCU_Deactivate");

		deactivateAfter.setPositionNear(waitTimerAfter);
		deactivateAfter.addTarget(waitTimerAfter);
		waitTimerAfter.addTarget(deactivateAfter);
	}

	// FIXME!
	if (!isAirStart && isLastElement) {
		
		const tookOffTargets = [waitTimerAfter];
		
		// Also connect queued wait timer that will activate leading element
		// commands (after the last element took off report).
		if (action.waitTimerAfter) {
			
			tookOffTargets.push(action.waitTimerAfter);
			delete action.waitTimerAfter;
		}
		
		// Set element leader take off report event action
		if (takeoffCommand) {

			tookOffTargets.forEach((target) => {

				leaderPlaneItem.entity.addReport(
					"OnTookOff",
					takeoffCommand,
					target
				);
			});
		}
		// Set take off event action for player-only spawn
		else {

			tookOffTargets.forEach((target) => {

				leaderPlaneItem.entity.addEvent(
					"OnPlaneTookOff",
					target
				);
			});
		}
	}
	else {
		
		// Activate next command chain from (forced) element air start
		if (!isLeadingElement || isLastElement) {
			input(waitTimerAfter);
		}
		// NOTE: We can't connect wait timer with previous action for the leading
		// element at this point. There are other elements that may still be taking
		// off from runway and/or start position.
		else {
			action.waitTimerAfter = waitTimerAfter;
		}
	}

	// Connect takeoff command to next action
	return function(input) {
		waitTimerAfter.addTarget(input);
	};
};