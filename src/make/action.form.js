/** @copyright Simas Toleikis, 2015 */
"use strict";

const {MCU_CMD_Formation} = require("../item");
const {flightState} = require("../data");

// Make plan form action
module.exports = function makePlanFormAction(flight, element, action, input) {

	const rand = this.rand;
	const leaderPlaneItem = element[0].item;
	const isFlightAirStart = (typeof flight.state === "number");
	const isLeadingElement = (element === flight.elements[0]);
	const isPlayerFlightLeader = (flight.player === flight.leader);
	const debugFlights = Boolean(this.debug && this.debug.flights);

	// Set cover command for non-leading elements
	if (!isLeadingElement) {

		const coverCommand = flight.group.createItem("MCU_CMD_Cover");

		coverCommand.setPositionNear(leaderPlaneItem);
		coverCommand.addObject(leaderPlaneItem);
		coverCommand.addTarget(flight.elements[0][0].item.entity);

		input(coverCommand);
	}

	// Set element plane formation command
	if (element.length > 1) {

		const formationCommand = flight.group.createItem("MCU_CMD_Formation");

		formationCommand.FormationType = element.formation;
		formationCommand.FormationDensity = MCU_CMD_Formation.DENSITY_SAFE;
		formationCommand.addObject(leaderPlaneItem);
		formationCommand.setPositionNear(leaderPlaneItem);

		input(formationCommand);
	}

	// NOTE: No more commands should be generated when player is a flight leader!
	if (isPlayerFlightLeader && !debugFlights) {
		return;
	}

	// NOTE: Leading element (in a multi element formation) will wait for other
	// elements still on the ground before executing further task plan actions.
	if (isLeadingElement && !isFlightAirStart && flight.elements.length > 1) {

		const groundStartElements = [];

		// Collect all ground start elements in a priority list
		flight.elements.forEach((element) => {

			const startData = {
				priority: {
					[flightState.START]: 1,
					[flightState.TAXI]: 2,
					[flightState.RUNWAY]: 3
				}[element.state],
				element: element
			};

			if (startData.priority) {
				groundStartElements.push(startData);
			}
		});

		let lastStartingElement;

		if (groundStartElements.length) {

			// Pick last starting ground element based on starting priority
			lastStartingElement = groundStartElements.sort((a, b) => {
				return a.priority - b.priority;
			})[0].element;
		}

		if (lastStartingElement && lastStartingElement !== element) {

			return (input) => {

				// Add a small timer so that other elements can link up with the rest of
				// the flight after take off (just before proceeding with the task).
				const waitTimerLink = flight.group.createItem("MCU_Timer");

				waitTimerLink.Time = +(rand.real(40, 60).toFixed(3));
				waitTimerLink.setPositionNear(flight.takeoffCommand);
				waitTimerLink.addTarget(input);

				// Connect form up action using last ground element "took off" report
				lastStartingElement[0].item.entity.addReport(
					"OnTookOff",
					flight.takeoffCommand,
					waitTimerLink
				);
			};
		}
	}

	// Connect form up to next action
	return input;
};