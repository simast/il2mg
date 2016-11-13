/** @copyright Simas Toleikis, 2016 */
"use strict";

// Make plan start state
module.exports = function makePlanStartState(flight, action, state) {

	// NOTE: Start action will only have state when the flight is arriving from
	// an offmap point. The fuel for virtual offmap route has already been
	// adjusted and all that is left is to fast-forward start delay.

	action.delay -= (action.delay * state);

	if (action.delay <= 0) {
		delete action.delay;
	}
};