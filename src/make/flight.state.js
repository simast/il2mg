/** @copyright Simas Toleikis, 2016 */
"use strict";

const requireDir = require("require-directory");
const makeState = requireDir(module, {include: /state\..+\.js$/});

// Make flight state
module.exports = function makeFlightState(flight) {

	// Process only flights with a valid state
	if (typeof flight.state !== "number" || flight.state <= 0) {
		return;
	}

	const stateActions = [];
	let totalState = 0;

	// Find valid state actions
	for (const action of flight.plan) {

		if (action.state === undefined) {
			continue;
		}

		totalState += action.state;
		stateActions.push(action);
	}

	if (!totalState) {
		return;
	}

	let pendingState = totalState * flight.state;

	// Process state actions
	for (const action of stateActions) {

		if (pendingState <= 0) {
			break;
		}

		const state = Math.min(pendingState / action.state, 1);
		pendingState -= action.state;

		let makePlanState;

		// Use custom plan make state
		if (typeof action.makeState === "function") {
			makePlanState = action.makeState;
		}
		// Use default/common plan make state
		else if (action.type) {
			makePlanState = makeState["state." + action.type];
		}

		action.state -= (action.state * state);

		if (makePlanState) {
			makePlanState.call(this, flight, action, state);
		}
	}
};