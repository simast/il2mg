/** @copyright Simas Toleikis, 2016 */
"use strict";

const makeFlightFuel = require("./flight.fuel");

// Make plan wait state
module.exports = function makePlanWaitState(flight, action, state) {

	const plan = flight.plan;

	// Fast-forward wait action state based on elapsed time
	const elapsedTime = action.time * state;
	const planeSpeed = this.planes[flight.leader.plane].speed;
	const waitDistance = elapsedTime * (planeSpeed * 1000 / 3600);

	action.time -= elapsedTime;

	// Use flight fuel for fast-forward wait distance
	makeFlightFuel.call(this, flight, waitDistance);

	// Remove action from plan
	if (state >= 1) {
		plan.splice(plan.indexOf(action), 1);
	}
};