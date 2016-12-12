/** @copyright Simas Toleikis, 2016 */
"use strict";

// Make flight state
module.exports = function makeFlightState(flight) {

	// Process only flights with a valid state
	if (typeof flight.state !== "number" || flight.state <= 0) {
		return;
	}

	const stateActivities = [];
	let totalState = 0;

	// Find valid state activities
	for (const activity of flight.plan) {

		if (activity.state === undefined) {
			continue;
		}

		totalState += activity.state;
		stateActivities.push(activity);
	}

	if (!totalState) {
		return;
	}

	let pendingState = totalState * flight.state;

	// Process state activities
	for (const activity of stateActivities) {

		if (pendingState <= 0) {
			break;
		}

		const state = Math.min(pendingState / activity.state, 1);
		pendingState -= activity.state;

		activity.state -= (activity.state * state);

		if (activity.makeState) {
			activity.makeState(state);
		}
	}
};