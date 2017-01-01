/** @copyright Simas Toleikis, 2017 */
"use strict";

// Make flight plan activity actions
module.exports = function makeFlightActions(flight) {

	// List of output callback functions from previous plan action (for each
	// element, used as input for the next plan action).
	let outputPrev = [];

	// Process pending plan actions
	for (const activity of flight.plan) {

		if (!activity.makeAction) {
			continue;
		}

		const output = [];

		// NOTE: Multiple flight elements will share a single plan, but can use a
		// different command set (as with second element on cover duty for first
		// leading element for example).
		flight.elements.forEach((element, elementIndex) => {
			output.push(activity.makeAction(element, outputPrev[elementIndex]));
		});

		outputPrev = output;
	}
};